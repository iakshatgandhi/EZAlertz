export const DEFAULT_MARKET_DATA_MODE = "ltpc" as const;

export const PHASE1_RELIANCE_INSTRUMENT_KEY = "NSE_EQ|INE002A01018";

export const RECONNECT_BASE_DELAY_MS = 1_000;
export const RECONNECT_MAX_DELAY_MS = 30_000;
export const RECONNECT_MAX_ATTEMPTS = 10;

export const UPSTOX_INSTRUMENTS_URL =
  "https://assets.upstox.com/market-quote/instruments/exchange/complete.json.gz";

export const INSTRUMENT_SYNC_MIN_COUNT = 500;

export const EQUITY_SEGMENTS = new Set(["NSE_EQ", "BSE_EQ"]);
