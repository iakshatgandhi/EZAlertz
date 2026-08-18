import { describe, expect, it } from "vitest";
import {
  ALERT_HISTORY_RETENTION_MS,
  getAlertHistoryCutoff,
} from "../../src/config/constants.js";

describe("getAlertHistoryCutoff", () => {
  it("returns a timestamp 24 hours before the reference time", () => {
    const now = new Date("2026-08-16T12:00:00.000Z");
    const cutoff = getAlertHistoryCutoff(now);

    expect(cutoff.toISOString()).toBe(
      new Date(now.getTime() - ALERT_HISTORY_RETENTION_MS).toISOString(),
    );
  });
});
