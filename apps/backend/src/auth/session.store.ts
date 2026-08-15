import { randomBytes } from "node:crypto";
import type { Redis } from "ioredis";

const SESSION_PREFIX = "session:";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
export const SESSION_COOKIE_NAME = "ez_session";

export class SessionStore {
  constructor(private readonly redis: Redis) {}

  private key(sessionId: string): string {
    return `${SESSION_PREFIX}${sessionId}`;
  }

  async create(userId: string): Promise<string> {
    const sessionId = randomBytes(32).toString("hex");
    await this.redis.set(this.key(sessionId), userId, "EX", SESSION_TTL_SECONDS);
    return sessionId;
  }

  async getUserId(sessionId: string): Promise<string | null> {
    return this.redis.get(this.key(sessionId));
  }

  async destroy(sessionId: string): Promise<void> {
    await this.redis.del(this.key(sessionId));
  }
}
