import { assertUpstoxAuthorized } from "../../instruments/upstox/upstoxAuth.js";
import { logger } from "../../shared/logger.js";

const UPSTOX_MARKET_BASE = "https://api.upstox.com/v2/market";

export interface UpstoxExchangeTiming {
  exchange: string;
  start_time: number;
  end_time: number;
}

export interface UpstoxHolidayEntry {
  date: string;
  description: string;
  holiday_type: string;
  closed_exchanges: string[];
  open_exchanges?: UpstoxExchangeTiming[];
}

export interface UpstoxMarketStatusData {
  exchange: string;
  status: string;
  last_updated: number;
}

interface UpstoxListResponse<T> {
  status?: string;
  data?: T;
}

export class UpstoxMarketCalendarClient {
  constructor(private readonly accessToken: string) {}

  async getMarketStatus(exchange: string): Promise<UpstoxMarketStatusData | null> {
    return this.fetchJson<UpstoxMarketStatusData>(
      `${UPSTOX_MARKET_BASE}/status/${exchange}`,
      `market status for ${exchange}`,
    );
  }

  async getTimings(date: string): Promise<UpstoxExchangeTiming[]> {
    const data = await this.fetchJson<UpstoxExchangeTiming[]>(
      `${UPSTOX_MARKET_BASE}/timings/${date}`,
      `market timings for ${date}`,
    );
    return data ?? [];
  }

  async getHoliday(date: string): Promise<UpstoxHolidayEntry | null> {
    try {
      const data = await this.fetchJson<UpstoxHolidayEntry | UpstoxHolidayEntry[]>(
        `${UPSTOX_MARKET_BASE}/holidays/${date}`,
        `market holiday for ${date}`,
        { allowNotFound: true },
      );

      if (!data) {
        return null;
      }

      if (Array.isArray(data)) {
        return data[0] ?? null;
      }

      return data;
    } catch {
      return null;
    }
  }

  private async fetchJson<T>(
    url: string,
    context: string,
    options: { allowNotFound?: boolean } = {},
  ): Promise<T | null> {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: "application/json",
      },
    });

    if (response.status === 404 && options.allowNotFound) {
      return null;
    }

    if (!response.ok) {
      const body = await response.text();
      assertUpstoxAuthorized(response.status, context);
      logger.error(
        { status: response.status, url, body: body.slice(0, 200) },
        "Upstox market calendar fetch failed",
      );
      throw new Error(`Upstox ${context} failed: HTTP ${response.status}`);
    }

    const payload = (await response.json()) as UpstoxListResponse<T>;
    return payload.data ?? null;
  }
}
