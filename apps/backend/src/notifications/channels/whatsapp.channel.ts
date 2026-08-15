import { logger } from "../../shared/logger.js";
import type {
  NotificationChannel,
  WhatsAppSendPayload,
  WhatsAppSendResult,
} from "../types.js";

interface WhatsAppApiResponse {
  messages?: Array<{ id: string }>;
  error?: {
    message: string;
    type?: string;
    code?: number;
  };
}

export class WhatsAppChannel implements NotificationChannel {
  constructor(
    private readonly apiToken: string,
    private readonly phoneNumberId: string,
  ) {}

  async send(payload: WhatsAppSendPayload): Promise<WhatsAppSendResult> {
    const to = normalizePhone(payload.phone);

    const response = await fetch(
      `https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: payload.message },
        }),
      },
    );

    const data = (await response.json()) as WhatsAppApiResponse;

    if (!response.ok) {
      const errorMessage = data.error?.message ?? `WhatsApp API error (${response.status})`;
      logger.error({ errorMessage, alertId: payload.alertId }, "WhatsApp send failed");
      throw new Error(errorMessage);
    }

    const providerMessageId = data.messages?.[0]?.id;
    if (!providerMessageId) {
      throw new Error("WhatsApp API returned no message id");
    }

    return { providerMessageId };
  }
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function isWhatsAppConfigured(
  apiToken?: string,
  phoneNumberId?: string,
): boolean {
  return Boolean(apiToken?.trim() && phoneNumberId?.trim());
}
