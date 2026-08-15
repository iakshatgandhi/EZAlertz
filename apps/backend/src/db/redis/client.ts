import { Redis } from "ioredis";

let redis: Redis | null = null;

export function getRedis(url: string): Redis {
  if (!redis) {
    redis = new Redis(url, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
  }
  return redis;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
