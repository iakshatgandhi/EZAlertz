import { describe, expect, it } from "vitest";

// Test the extract logic inline by importing through a small export
// We test via UpstoxQuoteClient behavior pattern - duplicate extract for unit test
function extractLtp(
  payload: { data?: Record<string, { last_price?: number; ltp?: number }> },
  instrumentKey: string,
): number | null {
  const data = payload.data;
  if (!data) return null;

  const quote =
    data[instrumentKey] ??
    data[decodeURIComponent(instrumentKey)] ??
    Object.values(data)[0];

  const ltp = quote?.last_price ?? quote?.ltp;
  if (ltp === undefined || ltp === null || Number.isNaN(Number(ltp))) {
    return null;
  }

  return Number(ltp);
}

describe("extractLtp", () => {
  it("reads LTP by exact instrument key", () => {
    const ltp = extractLtp(
      {
        data: {
          "NSE_EQ|INE758E01017": { last_price: 312.45 },
        },
      },
      "NSE_EQ|INE758E01017",
    );

    expect(ltp).toBe(312.45);
  });

  it("falls back to first quote entry when key differs", () => {
    const ltp = extractLtp(
      {
        data: {
          "NSE_EQ|INE002A01018": { last_price: 1482.3 },
        },
      },
      "NSE_EQ|INE758E01017",
    );

    expect(ltp).toBe(1482.3);
  });
});
