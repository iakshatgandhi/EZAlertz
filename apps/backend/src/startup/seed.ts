import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { getDb } from "../db/postgres/client.js";
import { users } from "../db/postgres/schema/index.js";
import { logger } from "../shared/logger.js";

export async function seedDatabase(
  devEmail: string,
  whatsappPhone?: string,
): Promise<string> {
  const db = getDb(process.env.DATABASE_URL!);

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, devEmail))
    .limit(1);

  if (existing[0]) {
    if (whatsappPhone && !existing[0].whatsappPhone) {
      await db
        .update(users)
        .set({ whatsappPhone, updatedAt: new Date() })
        .where(eq(users.id, existing[0].id));
      logger.info({ userId: existing[0].id, whatsappPhone }, "Updated dev user WhatsApp phone");
    }

    logger.info({ userId: existing[0].id, email: devEmail }, "Dev user ready");
    return existing[0].id;
  }

  const passwordHash = await bcrypt.hash("dev-password-not-for-production", 10);
  const [created] = await db
    .insert(users)
    .values({
      email: devEmail,
      passwordHash,
      whatsappPhone: whatsappPhone || null,
    })
    .returning();

  logger.info({ userId: created.id, email: devEmail }, "Created dev user");
  return created.id;
}
