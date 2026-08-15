import type { NormalizedTick } from "@stock-alert/shared-types";

export function normalizeTick(tick: NormalizedTick): NormalizedTick {
  return {
    instrumentKey: tick.instrumentKey,
    symbol: tick.symbol,
    exchange: tick.exchange,
    ltp: tick.ltp,
    timestamp: tick.timestamp,
  };
}

export function parseInstrumentKey(instrumentKey: string): {
  exchange: string;
  symbol: string;
} {
  const [exchangeSegment, isinOrToken] = instrumentKey.split("|");
  const exchange = exchangeSegment?.split("_")[0] ?? "NSE";
  return {
    exchange,
    symbol: isinOrToken ?? instrumentKey,
  };
}
