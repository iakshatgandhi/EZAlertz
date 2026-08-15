import type { Worker } from "bullmq";
import { isWhatsAppConfigured } from "./channels/whatsapp.channel.js";
import { createNotificationsService } from "./notifications.service.js";
import { NotificationsRepository } from "./notifications.repository.js";
import {
  NotificationQueue,
  startNotificationWorker,
  type NotificationQueueDeps,
} from "./queue.js";

export { NotificationQueue, startNotificationWorker, NOTIFICATION_QUEUE_NAME } from "./queue.js";
export { NotificationsService, createNotificationsService } from "./notifications.service.js";
export type { NotificationPayload } from "./types.js";

export interface NotificationSystem {
  service: ReturnType<typeof createNotificationsService>["service"];
  queue: NotificationQueue | null;
  worker: Worker | null;
  close: () => Promise<void>;
}

export function createNotificationSystem(
  redisUrl: string,
  apiToken: string,
  phoneNumberId: string,
): NotificationSystem {
  const { service, queue } = createNotificationsService(
    redisUrl,
    apiToken,
    phoneNumberId,
  );

  let worker: Worker | null = null;

  if (isWhatsAppConfigured(apiToken, phoneNumberId)) {
    const deps: NotificationQueueDeps = {
      redisUrl,
      apiToken,
      phoneNumberId,
      notificationsRepository: new NotificationsRepository(),
    };
    worker = startNotificationWorker(deps);
  }

  return {
    service,
    queue,
    worker,
    close: async () => {
      await worker?.close();
      await queue?.close();
    },
  };
}
