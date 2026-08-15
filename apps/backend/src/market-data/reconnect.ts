import {
  RECONNECT_BASE_DELAY_MS,
  RECONNECT_MAX_ATTEMPTS,
  RECONNECT_MAX_DELAY_MS,
} from "../config/constants.js";
import { logger } from "../shared/logger.js";
import type { MarketDataProvider } from "./MarketDataProvider.js";

export async function withReconnect(
  provider: MarketDataProvider,
  instrumentKeys: string[],
): Promise<void> {
  let attempt = 0;

  while (attempt < RECONNECT_MAX_ATTEMPTS) {
    try {
      await provider.connect();
      if (instrumentKeys.length > 0) {
        await provider.subscribe(instrumentKeys);
      }
      return;
    } catch (error) {
      attempt += 1;
      const delay = Math.min(
        RECONNECT_BASE_DELAY_MS * 2 ** (attempt - 1),
        RECONNECT_MAX_DELAY_MS,
      );
      logger.error(
        { error, attempt, delayMs: delay },
        "Market data connect failed, retrying",
      );
      await sleep(delay);
    }
  }

  throw new Error("Failed to connect to market data provider after max retries");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
