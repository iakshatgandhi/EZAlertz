import { Queue, Worker, type Job } from "bullmq";
import { logger } from "../shared/logger.js";
import type { WhatsAppSendPayload } from "./types.js";
import {
  WhatsAppChannel,
  isWhatsAppConfigured,
} from "./channels/whatsapp.channel.js";
import { NotificationsRepository } from "./notifications.repository.js";

export const NOTIFICATION_QUEUE_NAME = "whatsapp-notifications";

export interface NotificationQueueDeps {
  redisUrl: string;
  apiToken: string;
  phoneNumberId: string;
  notificationsRepository: NotificationsRepository;
}

function parseRedisUrl(redisUrl: string): { host: string; port: number; password?: string } {
  const url = new URL(redisUrl);
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    password: url.password || undefined,
  };
}

export class NotificationQueue {
  private readonly queue: Queue<WhatsAppSendPayload>;

  constructor(redisUrl: string) {
    this.queue = new Queue<WhatsAppSendPayload>(NOTIFICATION_QUEUE_NAME, {
      connection: {
        ...parseRedisUrl(redisUrl),
        maxRetriesPerRequest: null,
      },
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    });
  }

  async enqueue(payload: WhatsAppSendPayload): Promise<void> {
    await this.queue.add("send-whatsapp", payload, {
      jobId: payload.notificationId,
    });
    logger.info(
      { notificationId: payload.notificationId, alertId: payload.alertId },
      "WhatsApp notification enqueued",
    );
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}

export function startNotificationWorker(
  deps: NotificationQueueDeps,
): Worker<WhatsAppSendPayload> {
  if (!isWhatsAppConfigured(deps.apiToken, deps.phoneNumberId)) {
    throw new Error("WhatsApp is not configured");
  }

  const channel = new WhatsAppChannel(deps.apiToken, deps.phoneNumberId);

  const worker = new Worker<WhatsAppSendPayload>(
    NOTIFICATION_QUEUE_NAME,
    async (job: Job<WhatsAppSendPayload>) => {
      const payload = job.data;

      try {
        const result = await channel.send(payload);
        await deps.notificationsRepository.markSent(
          payload.notificationId,
          result.providerMessageId,
        );
        logger.info(
          {
            notificationId: payload.notificationId,
            providerMessageId: result.providerMessageId,
          },
          "WhatsApp notification sent",
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await deps.notificationsRepository.markFailed(payload.notificationId, message);
        throw error;
      }
    },
    {
      connection: {
        ...parseRedisUrl(deps.redisUrl),
        maxRetriesPerRequest: null,
      },
    },
  );

  worker.on("failed", (job, error) => {
    logger.error(
      {
        jobId: job?.id,
        notificationId: job?.data.notificationId,
        error: error.message,
      },
      "WhatsApp notification job failed",
    );
  });

  return worker;
}
