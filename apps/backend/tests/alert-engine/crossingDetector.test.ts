import { describe, expect, it } from "vitest";
import { detectCrossing } from "../../src/alert-engine/crossingDetector.js";

describe("crossingDetector", () => {
  it("detects BELOW crossing", () => {
    expect(
      detectCrossing({
        conditionType: "BELOW",
        targetPrice: 1450,
        previousPrice: 1450.1,
        currentPrice: 1449.9,
      }),
    ).toBe(true);
  });

  it("detects ABOVE crossing", () => {
    expect(
      detectCrossing({
        conditionType: "ABOVE",
        targetPrice: 4000,
        previousPrice: 3999.5,
        currentPrice: 4000.5,
      }),
    ).toBe(true);
  });

  it("does not trigger when price remains below target", () => {
    expect(
      detectCrossing({
        conditionType: "BELOW",
        targetPrice: 1450,
        previousPrice: 1449,
        currentPrice: 1448,
      }),
    ).toBe(false);
  });

  it("does not trigger without previous price when condition is not met", () => {
    expect(
      detectCrossing({
        conditionType: "BELOW",
        targetPrice: 1450,
        previousPrice: null,
        currentPrice: 1451,
      }),
    ).toBe(false);
  });

  it("triggers on first tick when price is already below target", () => {
    expect(
      detectCrossing({
        conditionType: "BELOW",
        targetPrice: 1450,
        previousPrice: null,
        currentPrice: 1449,
      }),
    ).toBe(true);
  });

  it("triggers when price reaches target exactly from above", () => {
    expect(
      detectCrossing({
        conditionType: "BELOW",
        targetPrice: 1450,
        previousPrice: 1450.1,
        currentPrice: 1450,
      }),
    ).toBe(true);
  });

  it("triggers on first tick when price is already at target", () => {
    expect(
      detectCrossing({
        conditionType: "BELOW",
        targetPrice: 1450,
        previousPrice: null,
        currentPrice: 1450,
      }),
    ).toBe(true);
  });

  it("triggers on first tick when price is already above target", () => {
    expect(
      detectCrossing({
        conditionType: "ABOVE",
        targetPrice: 4000,
        previousPrice: null,
        currentPrice: 4001,
      }),
    ).toBe(true);
  });
});
