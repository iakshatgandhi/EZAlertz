import { describe, expect, it } from "vitest";
import { formatMarketStatus } from "../../src/market-calendar/upstoxStatusLabels.js";

describe("formatMarketStatus", () => {
  it("maps CLOSING_END to a friendly label", () => {
    const result = formatMarketStatus("CLOSING_END");
    expect(result.label).toBe("Closing session ended");
    expect(result.description).toContain("done for today");
  });

  it("maps NORMAL_OPEN to trading live", () => {
    const result = formatMarketStatus("NORMAL_OPEN");
    expect(result.label).toBe("Trading live");
  });
});
