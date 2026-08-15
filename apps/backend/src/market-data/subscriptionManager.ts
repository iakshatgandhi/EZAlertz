import type { MarketDataProvider } from "./MarketDataProvider.js";
import { logger } from "../shared/logger.js";

export class SubscriptionManager {
  private readonly activeKeys = new Set<string>();

  constructor(private readonly provider: MarketDataProvider) {}

  async add(instrumentKeys: string[]): Promise<void> {
    const toAdd = instrumentKeys.filter((key) => !this.activeKeys.has(key));
    if (toAdd.length === 0) {
      return;
    }

    for (const key of toAdd) {
      this.activeKeys.add(key);
    }

    await this.provider.subscribe(toAdd);
    logger.info({ count: toAdd.length }, "Subscription manager added instruments");
  }

  async remove(instrumentKeys: string[]): Promise<void> {
    const toRemove = instrumentKeys.filter((key) => this.activeKeys.has(key));
    if (toRemove.length === 0) {
      return;
    }

    for (const key of toRemove) {
      this.activeKeys.delete(key);
    }

    await this.provider.unsubscribe(toRemove);
    logger.info({ count: toRemove.length }, "Subscription manager removed instruments");
  }

  getActiveKeys(): string[] {
    return [...this.activeKeys];
  }

  async sync(keys: string[]): Promise<void> {
    const desired = new Set(keys);
    const current = new Set(this.activeKeys);

    const toAdd = keys.filter((key) => !current.has(key));
    const toRemove = [...current].filter((key) => !desired.has(key));

    if (toAdd.length > 0) {
      await this.add(toAdd);
    }
    if (toRemove.length > 0) {
      await this.remove(toRemove);
    }
  }
}
