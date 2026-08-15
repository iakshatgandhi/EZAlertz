import type { NormalizedTick } from "@stock-alert/shared-types";

export type MarketDataConnectionStatus =
  | "connected"
  | "reconnecting"
  | "disconnected";

export type PriceUpdateHandler = (tick: NormalizedTick) => void;
export type ConnectionStatusHandler = (status: MarketDataConnectionStatus) => void;

export interface MarketDataProvider {
  connect(): Promise<void>;
  subscribe(instrumentKeys: string[]): Promise<void>;
  unsubscribe(instrumentKeys: string[]): Promise<void>;
  onPriceUpdate(handler: PriceUpdateHandler): void;
  onConnectionStatus(handler: ConnectionStatusHandler): void;
  getConnectionStatus(): MarketDataConnectionStatus;
  getSubscribedInstruments(): string[];
  disconnect(): Promise<void>;
}
