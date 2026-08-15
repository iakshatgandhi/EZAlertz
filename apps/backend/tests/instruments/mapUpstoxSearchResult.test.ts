import { describe, expect, it } from "vitest";
import { mapUpstoxSearchResult } from "../../src/instruments/upstox/mapUpstoxSearchResult.js";

describe("mapUpstoxSearchResult", () => {
  it("maps live search equity results", () => {
    const mapped = mapUpstoxSearchResult({
      segment: "NSE_EQ",
      exchange: "NSE",
      instrumentType: "EQ",
      instrumentKey: "NSE_EQ|INE002A01018",
      tradingSymbol: "RELIANCE",
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

  it("accepts snake_case fields from raw API JSON", () => {
    const mapped = mapUpstoxSearchResult({
      segment: "BSE_EQ",
      exchange: "BSE",
      instrument_type: "EQ",
      instrument_key: "BSE_EQ|INE467B01029",
      trading_symbol: "TCS",
      short_name: "TCS Ltd",
    });

    expect(mapped?.symbol).toBe("TCS");
    expect(mapped?.exchange).toBe("BSE");
  });

  it("rejects non-equity segments", () => {
    expect(
      mapUpstoxSearchResult({
        segment: "NSE_FO",
        instrument_key: "NSE_FO|123",
        trading_symbol: "NIFTY CE",
        instrument_type: "CE",
      }),
    ).toBeNull();
  });
});
