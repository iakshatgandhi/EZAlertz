import { Redis } from "ioredis";

const ALERT_INDEX_PREFIX = "alerts:";

export class AlertIndex {
  constructor(private readonly redis: Redis) {}

  private key(instrumentKey: string): string {
    return `${ALERT_INDEX_PREFIX}${instrumentKey}`;
  }

  async addAlert(instrumentKey: string, alertId: string): Promise<void> {
    await this.redis.sadd(this.key(instrumentKey), alertId);
  }

  async removeAlert(instrumentKey: string, alertId: string): Promise<void> {
    await this.redis.srem(this.key(instrumentKey), alertId);
  }

  async getAlertIds(instrumentKey: string): Promise<string[]> {
    return this.redis.smembers(this.key(instrumentKey));
  }

  async rebuildIndex(
    entries: Array<{ instrumentKey: string; alertId: string }>,
  ): Promise<void> {
    const pipeline = this.redis.pipeline();
    const keys = await this.redis.keys(`${ALERT_INDEX_PREFIX}*`);

    for (const key of keys) {
      pipeline.del(key);
    }

    for (const entry of entries) {
      pipeline.sadd(this.key(entry.instrumentKey), entry.alertId);
    }

    await pipeline.exec();
  }
}
