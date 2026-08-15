import { EQUITY_SEGMENTS } from "../../config/constants.js";
import type { SeedInstrument } from "../instruments.repository.js";

export interface UpstoxRawInstrument {
  segment?: string;
  name?: string;
  exchange?: string;
  instrument_type?: string;
  instrument_key?: string;
  trading_symbol?: string;
  short_name?: string;
}

export function isTradableEquity(instrument: UpstoxRawInstrument): boolean {
  if (!instrument.segment || !EQUITY_SEGMENTS.has(instrument.segment)) {
    return false;
  }

  if (!instrument.instrument_key || !instrument.trading_symbol) {
    return false;
  }

  const blockedTypes = new Set([
    "FUT",
    "CE",
    "PE",
    "FUTSTK",
    "OPTSTK",
    "OPTIDX",
    "FUTIDX",
  ]);

  if (instrument.instrument_type && blockedTypes.has(instrument.instrument_type)) {
    return false;
  }

  return true;
}

export function mapUpstoxInstrument(
  instrument: UpstoxRawInstrument,
): SeedInstrument | null {
  if (!isTradableEquity(instrument)) {
    return null;
  }

  return {
    symbol: instrument.trading_symbol!.trim(),
    companyName: (instrument.name ?? instrument.short_name ?? instrument.trading_symbol)!
      .trim(),
    exchange: instrument.exchange ?? instrument.segment!.split("_")[0] ?? "NSE",
    instrumentKey: instrument.instrument_key!,
    instrumentType: instrument.instrument_type ?? "EQ",
  };
}
