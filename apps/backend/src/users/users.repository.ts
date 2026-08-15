import { eq } from "drizzle-orm";
import { getDb } from "../db/postgres/client.js";
import { users } from "../db/postgres/schema/index.js";

export class UsersRepository {
  private readonly db = getDb(process.env.DATABASE_URL!);

  async getWhatsappPhone(userId: string): Promise<string | null> {
    const rows = await this.db
      .select({ whatsappPhone: users.whatsappPhone })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return rows[0]?.whatsappPhone ?? null;
  }

  async updateWhatsappPhone(userId: string, phone: string): Promise<void> {
    await this.db
      .update(users)
      .set({ whatsappPhone: phone, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }
}
