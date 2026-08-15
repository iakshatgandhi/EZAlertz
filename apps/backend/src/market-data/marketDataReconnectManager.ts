import {
  RECONNECT_BASE_DELAY_MS,
  RECONNECT_MAX_DELAY_MS,
} from "../config/constants.js";
import { logger } from "../shared/logger.js";
import type { MarketDataProvider } from "./MarketDataProvider.js";

export interface MarketDataReconnectOptions {
  /** Return false to pause reconnect attempts (e.g. invalid Upstox token). */
  canReconnect?: () => Promise<boolean>;
}

/**
 * Keeps the Upstox WebSocket alive in production.
 * On disconnect, reconnects with exponential backoff and re-subscribes instruments.
 */
export class MarketDataReconnectManager {
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private attempt = 0;
  private stopped = false;
  private reconnecting = false;

  constructor(
    private readonly provider: MarketDataProvider,
    private readonly options: MarketDataReconnectOptions = {},
  ) {
    this.provider.onConnectionStatus((status) => {
      if (status === "disconnected" && !this.stopped) {
        this.scheduleReconnect();
      }
    });
  }

  async connectAndSubscribe(instrumentKeys: string[]): Promise<void> {
    await this.provider.connect();
    if (instrumentKeys.length > 0) {
      await this.provider.subscribe(instrumentKeys);
    }
    this.attempt = 0;
  }

  stop(): void {
    this.stopped = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.stopped || this.reconnectTimer || this.reconnecting) {
      return;
    }

    const delay = Math.min(
      RECONNECT_BASE_DELAY_MS * 2 ** this.attempt,
      RECONNECT_MAX_DELAY_MS,
    );
    this.attempt += 1;

    logger.info({ attempt: this.attempt, delayMs: delay }, "Scheduling market data reconnect");

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.reconnect();
    }, delay);
  }

  private async reconnect(): Promise<void> {
    if (this.stopped || this.reconnecting) {
      return;
    }

    if (this.options.canReconnect) {
      const allowed = await this.options.canReconnect();
      if (!allowed) {
        logger.error(
          "Market data reconnect paused — Upstox token invalid. Update UPSTOX_ACCESS_TOKEN.",
        );
        this.scheduleReconnect();
        return;
      }
    }

    this.reconnecting = true;
    const instrumentKeys = this.provider.getSubscribedInstruments();

    try {
      await this.provider.connect();
      if (instrumentKeys.length > 0) {
        await this.provider.subscribe(instrumentKeys);
      }
      this.attempt = 0;
      logger.info(
        { instrumentCount: instrumentKeys.length },
        "Market data WebSocket reconnected",
      );
    } catch (error) {
      logger.error({ error, attempt: this.attempt }, "Market data reconnect failed");
      this.scheduleReconnect();
    } finally {
      this.reconnecting = false;
    }
  }
}
