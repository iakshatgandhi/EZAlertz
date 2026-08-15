export interface NotificationPayload {
  alertId: string;
  userId: string;
  message: string;
}

export interface WhatsAppSendPayload extends NotificationPayload {
  notificationId: string;
  phone: string;
}

export interface WhatsAppSendResult {
  providerMessageId: string;
}

export interface NotificationChannel {
  send(payload: WhatsAppSendPayload): Promise<WhatsAppSendResult>;
}
