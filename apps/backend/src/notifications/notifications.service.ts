import { logger } from "../shared/logger.js";
import { UsersRepository } from "../users/users.repository.js";
import { isWhatsAppConfigured } from "./channels/whatsapp.channel.js";
import { NotificationsRepository } from "./notifications.repository.js";
import { NotificationQueue } from "./queue.js";
import type { NotificationPayload } from "./types.js";

export class NotificationsService {
  constructor(
    private readonly queue: NotificationQueue | null,
    private readonly notificationsRepository: NotificationsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly whatsappEnabled: boolean,
  ) {}

  async notify(payload: NotificationPayload): Promise<void> {
    const phone = await this.usersRepository.getWhatsappPhone(payload.userId);

    const record = await this.notificationsRepository.createPending(
      payload.alertId,
      payload.userId,
      "WHATSAPP",
    );

    if (!phone) {
      await this.notificationsRepository.markFailed(
        record.id,
        "No WhatsApp phone number configured for user",
      );
      logger.warn(
        { userId: payload.userId, alertId: payload.alertId },
        "Skipping WhatsApp — user has no phone number",
      );
      return;
    }

    if (!this.whatsappEnabled || !this.queue) {
      await this.notificationsRepository.markFailed(
        record.id,
        "WhatsApp API is not configured",
      );
      logger.warn(
        { alertId: payload.alertId },
        "WhatsApp not configured — set WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID",
      );
      return;
    }

    await this.queue.enqueue({
      notificationId: record.id,
      alertId: payload.alertId,
      userId: payload.userId,
      message: payload.message,
      phone,
    });
  }
}

export function createNotificationsService(
  redisUrl: string,
  apiToken: string,
  phoneNumberId: string,
): {
  service: NotificationsService;
  queue: NotificationQueue | null;
} {
  const notificationsRepository = new NotificationsRepository();
  const usersRepository = new UsersRepository();
  const whatsappEnabled = isWhatsAppConfigured(apiToken, phoneNumberId);

  if (!whatsappEnabled) {
    return {
      service: new NotificationsService(
        null,
        notificationsRepository,
        usersRepository,
        false,
      ),
      queue: null,
    };
  }

  const queue = new NotificationQueue(redisUrl);
  const service = new NotificationsService(
    queue,
    notificationsRepository,
    usersRepository,
    true,
  );

  return { service, queue };
}
