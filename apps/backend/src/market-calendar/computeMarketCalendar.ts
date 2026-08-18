import type { MarketCalendarStatus, MarketSessionState } from "@stock-alert/shared-types";
import {
  addDaysToDateString,
  formatIstDate,
  formatIstTime,
  isIstWeekend,
  toIstDateString,
} from "./ist.js";
import type {
  UpstoxExchangeTiming,
  UpstoxHolidayEntry,
  UpstoxMarketStatusData,
} from "./upstox/UpstoxMarketCalendarClient.js";
import { formatMarketStatus } from "./upstoxStatusLabels.js";

const PRIMARY_EXCHANGE = "NSE";

export interface LookaheadDay {
  date: string;
  timings: UpstoxExchangeTiming[];
  holiday: UpstoxHolidayEntry | null;
}

export interface ComputeMarketCalendarInput {
  now?: Date;
  marketStatus: UpstoxMarketStatusData | null;
  todayTimings: UpstoxExchangeTiming[];
  tomorrowTimings: UpstoxExchangeTiming[];
  todayHoliday: UpstoxHolidayEntry | null;
  tomorrowHoliday: UpstoxHolidayEntry | null;
  lookahead?: LookaheadDay[];
}

function findExchangeTiming(
  timings: UpstoxExchangeTiming[],
  exchange: string,
): UpstoxExchangeTiming | null {
  return timings.find((timing) => timing.exchange === exchange) ?? null;
}

function isExchangeClosed(
  holiday: UpstoxHolidayEntry | null,
  exchange: string,
): boolean {
  if (!holiday) {
    return false;
  }

  return holiday.closed_exchanges.includes(exchange);
}

function getHolidayReason(
  holiday: UpstoxHolidayEntry | null,
  weekend: boolean,
): string | null {
  if (weekend) {
    return "Weekend";
  }

  if (!holiday) {
    return null;
  }

  if (holiday.holiday_type === "SPECIAL_TIMING") {
    return holiday.description || "Special session";
  }

  return holiday.description || "Market holiday";
}

function mapUpstoxStatus(status: string | undefined): MarketSessionState {
  const normalized = (status ?? "").toUpperCase();

  if (normalized === "NORMAL_OPEN") {
    return "OPEN";
  }
  if (normalized.includes("PRE_OPEN") || normalized.includes("PREOPEN")) {
    return "PRE_OPEN";
  }
  if (normalized.includes("CLOSING") || normalized.includes("POST")) {
    return "POST_CLOSE";
  }
  if (normalized.includes("HOLIDAY")) {
    return "HOLIDAY";
  }
  if (normalized.includes("OPEN") && !normalized.includes("CLOSE")) {
    return "OPEN";
  }

  return "CLOSED";
}

function deriveTodayState(input: {
  nowMs: number;
  weekend: boolean;
  holiday: UpstoxHolidayEntry | null;
  timing: UpstoxExchangeTiming | null;
  upstoxStatus: string | undefined;
}): {
  state: MarketSessionState;
  countdownLabel: string;
  countdownTarget: string | null;
  secondsRemaining: number | null;
  sessionProgressPercent: number | null;
} {
  const { nowMs, weekend, holiday, timing, upstoxStatus } = input;
  const mappedStatus = mapUpstoxStatus(upstoxStatus);

  if (weekend || isExchangeClosed(holiday, PRIMARY_EXCHANGE)) {
    return {
      state: weekend ? "CLOSED" : "HOLIDAY",
      countdownLabel: "Market closed",
      countdownTarget: null,
      secondsRemaining: null,
      sessionProgressPercent: null,
    };
  }

  if (!timing) {
    return {
      state: mappedStatus,
      countdownLabel: mappedStatus === "OPEN" ? "Session active" : "Market closed",
      countdownTarget: null,
      secondsRemaining: null,
      sessionProgressPercent: null,
    };
  }

  if (nowMs < timing.start_time) {
    const secondsRemaining = Math.max(0, Math.floor((timing.start_time - nowMs) / 1000));
    return {
      state: mappedStatus === "PRE_OPEN" ? "PRE_OPEN" : "CLOSED",
      countdownLabel: "Opens in",
      countdownTarget: new Date(timing.start_time).toISOString(),
      secondsRemaining,
      sessionProgressPercent: null,
    };
  }

  if (nowMs >= timing.start_time && nowMs < timing.end_time) {
    const secondsRemaining = Math.max(0, Math.floor((timing.end_time - nowMs) / 1000));
    const duration = timing.end_time - timing.start_time;
    const elapsed = nowMs - timing.start_time;
    const sessionProgressPercent =
      duration > 0 ? Math.min(100, Math.max(0, (elapsed / duration) * 100)) : null;

    return {
      state: "OPEN",
      countdownLabel: "Closes in",
      countdownTarget: new Date(timing.end_time).toISOString(),
      secondsRemaining,
      sessionProgressPercent,
    };
  }

  return {
    state: mappedStatus === "POST_CLOSE" ? "POST_CLOSE" : "CLOSED",
    countdownLabel: "Closed for today",
    countdownTarget: null,
    secondsRemaining: null,
    sessionProgressPercent: null,
  };
}

function buildDaySummary(input: {
  date: string;
  weekend: boolean;
  holiday: UpstoxHolidayEntry | null;
  timing: UpstoxExchangeTiming | null;
}): MarketCalendarStatus["tomorrow"] {
  const closed =
    input.weekend || isExchangeClosed(input.holiday, PRIMARY_EXCHANGE);

  return {
    date: input.date,
    dateLabel: formatIstDate(input.date),
    isTradingDay: !closed && Boolean(input.timing),
    holidayReason: closed ? getHolidayReason(input.holiday, input.weekend) : null,
    holidayType: input.holiday?.holiday_type ?? null,
    sessionStart: input.timing ? new Date(input.timing.start_time).toISOString() : null,
    sessionEnd: input.timing ? new Date(input.timing.end_time).toISOString() : null,
    sessionStartLabel: input.timing ? formatIstTime(input.timing.start_time) : null,
    sessionEndLabel: input.timing ? formatIstTime(input.timing.end_time) : null,
  };
}

function findNextSession(
  nowMs: number,
  lookahead: LookaheadDay[],
): MarketCalendarStatus["nextSession"] {
  for (const day of lookahead) {
    const weekend = isIstWeekend(new Date(`${day.date}T12:00:00Z`));
    const timing = findExchangeTiming(day.timings, PRIMARY_EXCHANGE);
    const closed = weekend || isExchangeClosed(day.holiday, PRIMARY_EXCHANGE);

    if (closed || !timing) {
      continue;
    }

    if (timing.start_time > nowMs) {
      const secondsUntilOpen = Math.max(
        0,
        Math.floor((timing.start_time - nowMs) / 1000),
      );
      const dateLabel = formatIstDate(day.date);
      const opensAtLabel = formatIstTime(timing.start_time);

      return {
        dateLabel,
        opensAtLabel,
        opensAt: new Date(timing.start_time).toISOString(),
        secondsUntilOpen,
        label: `Opens ${dateLabel} at ${opensAtLabel}`,
      };
    }
  }

  return null;
}

export function computeMarketCalendar(
  input: ComputeMarketCalendarInput,
): MarketCalendarStatus {
  const now = input.now ?? new Date();
  const nowMs = now.getTime();
  const todayDate = toIstDateString(now);
  const tomorrowDate = addDaysToDateString(todayDate, 1);

  const todayTiming = findExchangeTiming(input.todayTimings, PRIMARY_EXCHANGE);
  const tomorrowTiming = findExchangeTiming(input.tomorrowTimings, PRIMARY_EXCHANGE);
  const todayWeekend = isIstWeekend(now);
  const tomorrowWeekend = isIstWeekend(new Date(`${tomorrowDate}T12:00:00Z`));

  const statusPresentation = formatMarketStatus(input.marketStatus?.status);

  const todayDerived = deriveTodayState({
    nowMs,
    weekend: todayWeekend,
    holiday: input.todayHoliday,
    timing: todayTiming,
    upstoxStatus: input.marketStatus?.status,
  });

  const todayClosed =
    todayWeekend || isExchangeClosed(input.todayHoliday, PRIMARY_EXCHANGE);

  const lookahead =
    input.lookahead ??
    [
      {
        date: todayDate,
        timings: input.todayTimings,
        holiday: input.todayHoliday,
      },
      {
        date: tomorrowDate,
        timings: input.tomorrowTimings,
        holiday: input.tomorrowHoliday,
      },
    ];

  let nextSession = findNextSession(nowMs, lookahead);

  let countdownLabel = todayDerived.countdownLabel;
  let countdownTarget = todayDerived.countdownTarget;
  let secondsRemaining = todayDerived.secondsRemaining;

  if (
    todayDerived.state !== "OPEN" &&
    todayDerived.countdownLabel === "Closed for today" &&
    nextSession
  ) {
    countdownLabel = "Next session opens in";
    countdownTarget = nextSession.opensAt;
    secondsRemaining = nextSession.secondsUntilOpen;
  }

  const alertsActive = todayDerived.state === "OPEN";

  return {
    exchange: PRIMARY_EXCHANGE,
    timezone: "Asia/Kolkata",
    now: now.toISOString(),
    today: {
      date: todayDate,
      dateLabel: formatIstDate(todayDate),
      isTradingDay: !todayClosed && Boolean(todayTiming),
      holidayReason: todayClosed
        ? getHolidayReason(input.todayHoliday, todayWeekend)
        : null,
      holidayType: input.todayHoliday?.holiday_type ?? null,
      sessionStart: todayTiming ? new Date(todayTiming.start_time).toISOString() : null,
      sessionEnd: todayTiming ? new Date(todayTiming.end_time).toISOString() : null,
      sessionStartLabel: todayTiming ? formatIstTime(todayTiming.start_time) : null,
      sessionEndLabel: todayTiming ? formatIstTime(todayTiming.end_time) : null,
      marketStatus: input.marketStatus?.status ?? "UNKNOWN",
      statusLabel: statusPresentation.label,
      statusDescription: statusPresentation.description,
      state: todayDerived.state,
      countdownLabel,
      countdownTarget,
      secondsRemaining,
      sessionProgressPercent: todayDerived.sessionProgressPercent,
    },
    tomorrow: buildDaySummary({
      date: tomorrowDate,
      weekend: tomorrowWeekend,
      holiday: input.tomorrowHoliday,
      timing: tomorrowTiming,
    }),
    nextSession,
    alertsActive,
  };
}
