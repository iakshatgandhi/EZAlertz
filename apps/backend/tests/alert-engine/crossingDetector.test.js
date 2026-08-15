import { describe, expect, it } from "vitest";
import { detectCrossing } from "../../src/alert-engine/crossingDetector.js";
describe("crossingDetector", () => {
    it("detects BELOW crossing", () => {
        expect(detectCrossing({
            conditionType: "BELOW",
            targetPrice: 1450,
            previousPrice: 1450.1,
            currentPrice: 1449.9,
        })).toBe(true);
    });
    it("detects ABOVE crossing", () => {
        expect(detectCrossing({
            conditionType: "ABOVE",
            targetPrice: 4000,
            previousPrice: 3999.5,
            currentPrice: 4000.5,
        })).toBe(true);
    });
    it("does not trigger when price remains below target", () => {
        expect(detectCrossing({
            conditionType: "BELOW",
            targetPrice: 1450,
            previousPrice: 1449,
            currentPrice: 1448,
        })).toBe(false);
    });
    it("does not trigger without previous price", () => {
        expect(detectCrossing({
            conditionType: "BELOW",
            targetPrice: 1450,
            previousPrice: null,
            currentPrice: 1449,
        })).toBe(false);
    });
});
//# sourceMappingURL=crossingDetector.test.js.map