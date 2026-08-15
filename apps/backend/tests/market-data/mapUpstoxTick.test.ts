import { describe, expect, it } from "vitest";
import { mapUpstoxMessage } from "../../src/market-data/providers/upstox/mapUpstoxTick.js";

describe("mapUpstoxMessage", () => {
  it("maps ltpc feed payload to normalized ticks", () => {
    const ticks = mapUpstoxMessage({
      feeds: {
        "NSE_EQ|INE002A01018": {
          ltpc: {
            ltp: 1482.3,
            ltt: Date.now(),
          },
        },
      },
    });

    expect(ticks).toHaveLength(1);
    expect(ticks[0]?.instrumentKey).toBe("NSE_EQ|INE002A01018");
    expect(ticks[0]?.ltp).toBe(1482.3);
  });
});
