import type { NormalizedTick } from "@stock-alert/shared-types";
import type { UpstoxQuoteClient } from "../instruments/upstox/UpstoxQuoteClient.js";
import { logger } from "../shared/logger.js";
import { parseInstrumentKey } from "./normalizer.js";

export const LTP_POLL_INTERVAL_MS = 2_000;

export class LtpPollingService {
  private timer: ReturnType<typeof setInterval> | null = null;
  private polling = false;

  constructor(
    private readonly quoteClient: UpstoxQuoteClient,
    private readonly getInstrumentKeys: () => string[],
    private readonly onTick: (tick: NormalizedTick) => void,
    private readonly intervalMs = LTP_POLL_INTERVAL_MS,
  ) {}

  start(): void {
    if (this.timer) {
      return;
    }

    void this.poll();
    this.timer = setInterval(() => {
      void this.poll();
    }, this.intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async poll(): Promise<void> {
    if (this.polling) {
      return;
    }

    const instrumentKeys = this.getInstrumentKeys();
    if (instrumentKeys.length === 0) {
      return;
    }

    this.polling = true;
    try {
      const quotes = await this.quoteClient.getLtps(instrumentKeys);
      const timestamp = new Date().toISOString();

      for (const [instrumentKey, ltp] of quotes) {
        const { exchange, symbol } = parseInstrumentKey(instrumentKey);
        this.onTick({
          instrumentKey,
          symbol,
          exchange,
          ltp,
          timestamp,
        });
      }
    } catch (error) {
      logger.warn({ error }, "LTP polling failed");
    } finally {
      this.polling = false;
    }
  }
}
