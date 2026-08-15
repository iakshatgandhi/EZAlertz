import { eq } from "drizzle-orm";
import type { NotificationChannel as Channel } from "@stock-alert/shared-types";
import { getDb } from "../db/postgres/client.js";
import { notifications } from "../db/postgres/schema/index.js";

export interface NotificationRecord {
  id: string;
  alertId: string;
  userId: string;
  channel: Channel;
  status: "PENDING" | "SENT" | "FAILED";
  providerMessageId: string | null;
  errorMessage: string | null;
}

export class NotificationsRepository {
  private readonly db = getDb(process.env.DATABASE_URL!);

  async createPending(
    alertId: string,
    userId: string,
    channel: Channel = "WHATSAPP",
  ): Promise<NotificationRecord> {
    const [row] = await this.db
      .insert(notifications)
      .values({
        alertId,
        userId,
        channel,
        status: "PENDING",
      })
      .returning();

    return mapRow(row);
  }

  async markSent(id: string, providerMessageId: string): Promise<void> {
    await this.db
      .update(notifications)
      .set({
        status: "SENT",
        providerMessageId,
        sentAt: new Date(),
      })
      .where(eq(notifications.id, id));
  }

  async markFailed(id: string, errorMessage: string): Promise<void> {
    await this.db
      .update(notifications)
      .set({
        status: "FAILED",
        errorMessage,
      })
      .where(eq(notifications.id, id));
  }

  async findById(id: string): Promise<NotificationRecord | null> {
    const rows = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);

    const row = rows[0];
    return row ? mapRow(row) : null;
  }
}

function mapRow(row: typeof notifications.$inferSelect): NotificationRecord {
  return {
    id: row.id,
    alertId: row.alertId,
    userId: row.userId,
    channel: row.channel,
    status: row.status,
    providerMessageId: row.providerMessageId,
    errorMessage: row.errorMessage,
  };
}
