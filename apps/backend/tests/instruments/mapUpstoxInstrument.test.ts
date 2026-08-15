import { describe, expect, it } from "vitest";
import {
  isTradableEquity,
  mapUpstoxInstrument,
} from "../../src/instruments/sync/mapUpstoxInstrument.js";

describe("mapUpstoxInstrument", () => {
  it("maps NSE cash equity instruments", () => {
    const mapped = mapUpstoxInstrument({
      segment: "NSE_EQ",
      exchange: "NSE",
      instrument_type: "EQ",
      instrument_key: "NSE_EQ|INE002A01018",
      trading_symbol: "RELIANCE",
      name: "Reliance Industries Ltd",
    });

    expect(mapped).toEqual({
      symbol: "RELIANCE",
      companyName: "Reliance Industries Ltd",
      exchange: "NSE",
      instrumentKey: "NSE_EQ|INE002A01018",
      instrumentType: "EQ",
    });
  });

  it("rejects derivatives", () => {
    expect(
      isTradableEquity({
        segment: "NSE_FO",
        instrument_type: "CE",
        instrument_key: "NSE_FO|123",
        trading_symbol: "NIFTY24CE",
      }),
    ).toBe(false);
  });

  it("rejects instruments missing required fields", () => {
    expect(
      mapUpstoxInstrument({
        segment: "NSE_EQ",
        instrument_type: "EQ",
        trading_symbol: "TCS",
      }),
    ).toBeNull();
  });
});
