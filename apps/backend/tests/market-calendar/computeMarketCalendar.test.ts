import { describe, expect, it } from "vitest";
import { computeMarketCalendar } from "../../src/market-calendar/computeMarketCalendar.js";

describe("computeMarketCalendar", () => {
  const sessionStart = Date.UTC(2026, 7, 18, 3, 45);
  const sessionEnd = Date.UTC(2026, 7, 18, 10, 0);
  const duringSession = new Date(Date.UTC(2026, 7, 18, 6, 0));

  it("shows countdown to close when market is open", () => {
    const status = computeMarketCalendar({
      now: duringSession,
      marketStatus: {
        exchange: "NSE",
        status: "NORMAL_OPEN",
        last_updated: duringSession.getTime(),
      },
      todayTimings: [
        { exchange: "NSE", start_time: sessionStart, end_time: sessionEnd },
      ],
      tomorrowTimings: [
        { exchange: "NSE", start_time: sessionStart + 86_400_000, end_time: sessionEnd + 86_400_000 },
      ],
      todayHoliday: null,
      tomorrowHoliday: null,
    });

    expect(status.today.state).toBe("OPEN");
    expect(status.today.statusLabel).toBe("Trading live");
    expect(status.today.countdownLabel).toBe("Closes in");
    expect(status.today.secondsRemaining).toBeGreaterThan(0);
    expect(status.today.sessionProgressPercent).toBeGreaterThan(0);
    expect(status.alertsActive).toBe(true);
    expect(status.tomorrow.isTradingDay).toBe(true);
  });

  it("marks tomorrow as closed with holiday reason", () => {
    const status = computeMarketCalendar({
      now: duringSession,
      marketStatus: {
        exchange: "NSE",
        status: "NORMAL_OPEN",
        last_updated: duringSession.getTime(),
      },
      todayTimings: [
        { exchange: "NSE", start_time: sessionStart, end_time: sessionEnd },
      ],
      tomorrowTimings: [],
      todayHoliday: null,
      tomorrowHoliday: {
        date: "2026-08-17",
        description: "Independence Day",
        holiday_type: "TRADING_HOLIDAY",
        closed_exchanges: ["NSE", "BSE"],
      },
    });

    expect(status.tomorrow.isTradingDay).toBe(false);
    expect(status.tomorrow.holidayReason).toBe("Independence Day");
  });

  it("shows opens-in countdown before session start", () => {
    const beforeOpen = new Date(sessionStart - 30 * 60_000);

    const status = computeMarketCalendar({
      now: beforeOpen,
      marketStatus: {
        exchange: "NSE",
        status: "PRE_OPEN_START",
        last_updated: beforeOpen.getTime(),
      },
      todayTimings: [
        { exchange: "NSE", start_time: sessionStart, end_time: sessionEnd },
      ],
      tomorrowTimings: [],
      todayHoliday: null,
      tomorrowHoliday: null,
    });

    expect(status.today.countdownLabel).toBe("Opens in");
    expect(status.today.secondsRemaining).toBe(30 * 60);
    expect(status.alertsActive).toBe(false);
  });

  it("maps CLOSING_END to friendly labels and next session countdown", () => {
    const afterClose = new Date(sessionEnd + 15 * 60_000);
    const tomorrowStart = sessionStart + 86_400_000;
    const tomorrowEnd = sessionEnd + 86_400_000;

    const status = computeMarketCalendar({
      now: afterClose,
      marketStatus: {
        exchange: "NSE",
        status: "CLOSING_END",
        last_updated: afterClose.getTime(),
      },
      todayTimings: [
        { exchange: "NSE", start_time: sessionStart, end_time: sessionEnd },
      ],
      tomorrowTimings: [
        { exchange: "NSE", start_time: tomorrowStart, end_time: tomorrowEnd },
      ],
      todayHoliday: null,
      tomorrowHoliday: null,
      lookahead: [
        {
          date: "2026-08-18",
          timings: [{ exchange: "NSE", start_time: sessionStart, end_time: sessionEnd }],
          holiday: null,
        },
        {
          date: "2026-08-19",
          timings: [{ exchange: "NSE", start_time: tomorrowStart, end_time: tomorrowEnd }],
          holiday: null,
        },
      ],
    });

    expect(status.today.state).toBe("POST_CLOSE");
    expect(status.today.statusLabel).toBe("Closing session ended");
    expect(status.today.countdownLabel).toBe("Next session opens in");
    expect(status.nextSession).not.toBeNull();
    expect(status.alertsActive).toBe(false);
  });
});
