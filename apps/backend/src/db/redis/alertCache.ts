import type { Redis } from "ioredis";
import type { EngineAlert } from "../../alert-engine/types.js";
import { AlertIndex } from "./alertIndex.js";

const PAYLOAD_PREFIX = "alert:payload:";

export class AlertCache {
  constructor(
    private readonly redis: Redis,
    private readonly alertIndex: AlertIndex,
  ) {}

  private payloadKey(alertId: string): string {
    return `${PAYLOAD_PREFIX}${alertId}`;
  }

  async upsert(alert: EngineAlert): Promise<void> {
    await this.redis.set(this.payloadKey(alert.id), JSON.stringify(alert));

    if (alert.status === "ACTIVE") {
      await this.alertIndex.addAlert(alert.instrumentKey, alert.id);
    } else {
      await this.alertIndex.removeAlert(alert.instrumentKey, alert.id);
    }
  }

  async remove(alertId: string, instrumentKey: string): Promise<void> {
    await this.redis.del(this.payloadKey(alertId));
    await this.alertIndex.removeAlert(instrumentKey, alertId);
  }

  async getById(alertId: string): Promise<EngineAlert | null> {
    const raw = await this.redis.get(this.payloadKey(alertId));
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as EngineAlert;
  }

  async getActiveByInstrumentKey(instrumentKey: string): Promise<EngineAlert[]> {
    const ids = await this.alertIndex.getAlertIds(instrumentKey);
    if (ids.length === 0) {
      return [];
    }

    const payloads = await this.redis.mget(ids.map((id) => this.payloadKey(id)));
    const alerts: EngineAlert[] = [];

    for (const raw of payloads) {
      if (!raw) {
        continue;
      }
      const alert = JSON.parse(raw) as EngineAlert;
      if (alert.status === "ACTIVE") {
        alerts.push(alert);
      }
    }

    return alerts;
  }

  async countForInstrument(instrumentKey: string): Promise<number> {
    const ids = await this.alertIndex.getAlertIds(instrumentKey);
    return ids.length;
  }

  async rebuild(alerts: EngineAlert[]): Promise<void> {
    const pipeline = this.redis.pipeline();
    const existingKeys = await this.redis.keys(`${PAYLOAD_PREFIX}*`);

    for (const key of existingKeys) {
      pipeline.del(key);
    }

    await pipeline.exec();

    await this.alertIndex.rebuildIndex(
      alerts
        .filter((alert) => alert.status === "ACTIVE")
        .map((alert) => ({
          alertId: alert.id,
          instrumentKey: alert.instrumentKey,
        })),
    );

    for (const alert of alerts) {
      await this.redis.set(this.payloadKey(alert.id), JSON.stringify(alert));
    }
  }

  async tryAcquireTriggerLock(
    alertId: string,
    previousPrice: number,
    currentPrice: number,
  ): Promise<boolean> {
    const key = `trigger:lock:${alertId}:${previousPrice}:${currentPrice}`;
    const result = await this.redis.set(key, "1", "EX", 120, "NX");
    return result === "OK";
  }
}
