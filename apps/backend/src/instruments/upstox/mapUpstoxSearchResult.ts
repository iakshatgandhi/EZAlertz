import { EQUITY_SEGMENTS } from "../../config/constants.js";
import type { SeedInstrument } from "../instruments.repository.js";

export interface UpstoxSearchInstrument {
  segment?: string;
  name?: string;
  exchange?: string;
  instrument_type?: string;
  instrumentType?: string;
  instrument_key?: string;
  instrumentKey?: string;
  trading_symbol?: string;
  tradingSymbol?: string;
  short_name?: string;
  shortName?: string;
}

export function mapUpstoxSearchResult(
  instrument: UpstoxSearchInstrument,
): SeedInstrument | null {
  const segment = instrument.segment;
  const instrumentKey = instrument.instrument_key ?? instrument.instrumentKey;
  const tradingSymbol = instrument.trading_symbol ?? instrument.tradingSymbol;

  if (!segment || !EQUITY_SEGMENTS.has(segment)) {
    return null;
  }

  if (!instrumentKey || !tradingSymbol) {
    return null;
  }

  const instrumentType = instrument.instrument_type ?? instrument.instrumentType ?? "EQ";
  const blockedTypes = new Set(["FUT", "CE", "PE", "FUTSTK", "OPTSTK", "OPTIDX", "FUTIDX"]);
  if (blockedTypes.has(instrumentType)) {
    return null;
  }

  const companyName =
    instrument.name ?? instrument.short_name ?? instrument.shortName ?? tradingSymbol;

  return {
    symbol: tradingSymbol.trim(),
    companyName: companyName.trim(),
    exchange: instrument.exchange ?? segment.split("_")[0] ?? "NSE",
    instrumentKey,
    instrumentType,
  };
}
