import type { NormalizedTick } from "@stock-alert/shared-types";
import type {
  ConnectionStatusHandler,
  MarketDataConnectionStatus,
  MarketDataProvider,
  PriceUpdateHandler,
} from "../../MarketDataProvider.js";
import { DEFAULT_MARKET_DATA_MODE } from "../../../config/constants.js";
import { logger } from "../../../shared/logger.js";
import { UpstoxClientWrapper } from "./UpstoxClient.js";

export class UpstoxProvider implements MarketDataProvider {
  private readonly client: UpstoxClientWrapper;
  private readonly subscribed = new Set<string>();
  private connectionStatus: MarketDataConnectionStatus = "disconnected";
  private priceHandlers = new Set<PriceUpdateHandler>();
  private statusHandlers = new Set<ConnectionStatusHandler>();

  constructor(accessToken: string) {
    this.client = new UpstoxClientWrapper(accessToken);
  }

  async connect(): Promise<void> {
    if (this.client.getStreamer()) {
      return;
    }

    this.setConnectionStatus("reconnecting");

    const streamer = this.client.createStreamer([...this.subscribed]);
    this.client.attachMessageHandler(streamer, (ticks) => {
      for (const tick of ticks) {
        this.emitPriceUpdate(tick);
      }
    });

    streamer.on("open", () => {
      logger.info("Upstox market data WebSocket connected");
      this.setConnectionStatus("connected");

      if (this.subscribed.size > 0) {
        streamer.subscribe([...this.subscribed], DEFAULT_MARKET_DATA_MODE);
      }
    });

    streamer.on("close", () => {
      logger.warn("Upstox market data WebSocket closed");
      this.setConnectionStatus("disconnected");
      this.client.clearStreamer();
    });

    await streamer.connect();
  }

  async subscribe(instrumentKeys: string[]): Promise<void> {
    const newKeys = instrumentKeys.filter((key) => !this.subscribed.has(key));
    if (newKeys.length === 0) {
      return;
    }

    for (const key of newKeys) {
      this.subscribed.add(key);
    }

    const streamer = this.client.getStreamer();
    if (streamer && this.connectionStatus === "connected") {
      streamer.subscribe(newKeys, DEFAULT_MARKET_DATA_MODE);
      logger.info({ instrumentKeys: newKeys }, "Subscribed to instruments");
    }
  }

  async unsubscribe(instrumentKeys: string[]): Promise<void> {
    const removedKeys = instrumentKeys.filter((key) => this.subscribed.has(key));
    if (removedKeys.length === 0) {
      return;
    }

    for (const key of removedKeys) {
      this.subscribed.delete(key);
    }

    const streamer = this.client.getStreamer();
    if (streamer && this.connectionStatus === "connected") {
      streamer.unsubscribe(removedKeys);
      logger.info({ instrumentKeys: removedKeys }, "Unsubscribed from instruments");
    }
  }

  onPriceUpdate(handler: PriceUpdateHandler): void {
    this.priceHandlers.add(handler);
  }

  onConnectionStatus(handler: ConnectionStatusHandler): void {
    this.statusHandlers.add(handler);
  }

  getConnectionStatus(): MarketDataConnectionStatus {
    return this.connectionStatus;
  }

  getSubscribedInstruments(): string[] {
    return [...this.subscribed];
  }

  async disconnect(): Promise<void> {
    const streamer = this.client.getStreamer();
    if (streamer) {
      streamer.disconnect();
    }
    this.setConnectionStatus("disconnected");
  }

  private emitPriceUpdate(tick: NormalizedTick): void {
    for (const handler of this.priceHandlers) {
      handler(tick);
    }
  }

  private setConnectionStatus(status: MarketDataConnectionStatus): void {
    this.connectionStatus = status;
    for (const handler of this.statusHandlers) {
      handler(status);
    }
  }
}
