export interface NotificationPayload {
  alertId: string;
  userId: string;
  message: string;
}

export interface NotificationChannel {
  send(payload: NotificationPayload): Promise<void>;
}

export class ConsoleNotificationChannel implements NotificationChannel {
  async send(payload: NotificationPayload): Promise<void> {
    console.log(`[NOTIFICATION] ${payload.message}`);
  }
}
