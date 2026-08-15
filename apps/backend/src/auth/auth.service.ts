import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { getDb } from "../db/postgres/client.js";
import { users } from "../db/postgres/schema/index.js";
import { UnauthorizedError, ValidationError } from "../shared/errors.js";
import type { RegisterInput } from "./auth.validation.js";
import { normalizePhone } from "../notifications/channels/whatsapp.channel.js";

export interface AuthUser {
  id: string;
  email: string;
  whatsappPhone: string | null;
}

export class AuthService {
  private readonly db = getDb(process.env.DATABASE_URL!);

  async register(input: RegisterInput): Promise<AuthUser> {
    const existing = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email.toLowerCase()))
      .limit(1);

    if (existing[0]) {
      throw new ValidationError("Email is already registered");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const whatsappPhone = input.whatsappPhone
      ? normalizePhone(input.whatsappPhone)
      : null;

    const [created] = await this.db
      .insert(users)
      .values({
        email: input.email.toLowerCase(),
        passwordHash,
        whatsappPhone,
      })
      .returning();

    return mapUser(created);
  }

  async login(email: string, password: string): Promise<AuthUser> {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    const user = rows[0];
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    return mapUser(user);
  }

  async getUserById(userId: string): Promise<AuthUser | null> {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const user = rows[0];
    return user ? mapUser(user) : null;
  }

  async updateProfile(
    userId: string,
    whatsappPhone?: string,
  ): Promise<AuthUser> {
    const phone = whatsappPhone ? normalizePhone(whatsappPhone) : undefined;

    await this.db
      .update(users)
      .set({
        whatsappPhone: phone,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    const user = await this.getUserById(userId);
    if (!user) {
      throw new UnauthorizedError();
    }
    return user;
  }
}

function mapUser(row: typeof users.$inferSelect): AuthUser {
  return {
    id: row.id,
    email: row.email,
    whatsappPhone: row.whatsappPhone,
  };
}
