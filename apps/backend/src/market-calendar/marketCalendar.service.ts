import type { MarketCalendarStatus } from "@stock-alert/shared-types";
import { computeMarketCalendar } from "./computeMarketCalendar.js";
import { addDaysToDateString, toIstDateString } from "./ist.js";
import type {
  UpstoxExchangeTiming,
  UpstoxHolidayEntry,
  UpstoxMarketStatusData,
} from "./upstox/UpstoxMarketCalendarClient.js";
import { UpstoxMarketCalendarClient } from "./upstox/UpstoxMarketCalendarClient.js";

const CACHE_TTL_MS = 60_000;
const LOOKAHEAD_DAYS = 5;

interface CachedMarketData {
  expiresAt: number;
  marketStatus: UpstoxMarketStatusData | null;
  todayTimings: UpstoxExchangeTiming[];
  tomorrowTimings: UpstoxExchangeTiming[];
  todayHoliday: UpstoxHolidayEntry | null;
  tomorrowHoliday: UpstoxHolidayEntry | null;
  lookahead: Array<{
    date: string;
    timings: UpstoxExchangeTiming[];
    holiday: UpstoxHolidayEntry | null;
  }>;
}

export class MarketCalendarService {
  private cached: CachedMarketData | null = null;

  constructor(private readonly client: UpstoxMarketCalendarClient) {}

  async getStatus(): Promise<MarketCalendarStatus> {
    const data = await this.loadMarketData();

    return computeMarketCalendar({
      marketStatus: data.marketStatus,
      todayTimings: data.todayTimings,
      tomorrowTimings: data.tomorrowTimings,
      todayHoliday: data.todayHoliday,
      tomorrowHoliday: data.tomorrowHoliday,
      lookahead: data.lookahead,
    });
  }

  private async loadMarketData(): Promise<CachedMarketData> {
    const now = Date.now();
    if (this.cached && this.cached.expiresAt > now) {
      return this.cached;
    }

    const today = toIstDateString();
    const dates = Array.from({ length: LOOKAHEAD_DAYS }, (_, index) =>
      addDaysToDateString(today, index),
    );

    const marketStatus = await this.client.getMarketStatus("NSE");
    const dayData = await Promise.all(
      dates.map(async (date) => ({
        date,
        timings: await this.client.getTimings(date),
        holiday: await this.client.getHoliday(date),
      })),
    );

    const todayData = dayData[0];
    const tomorrowData = dayData[1];

    this.cached = {
      marketStatus,
      todayTimings: todayData.timings,
      tomorrowTimings: tomorrowData.timings,
      todayHoliday: todayData.holiday,
      tomorrowHoliday: tomorrowData.holiday,
      lookahead: dayData,
      expiresAt: now + CACHE_TTL_MS,
    };

    return this.cached;
  }
}
