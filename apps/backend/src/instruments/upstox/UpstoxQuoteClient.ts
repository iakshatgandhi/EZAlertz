import { logger } from "../../shared/logger.js";
import { formatUnknownError } from "../../shared/formatError.js";
import { assertUpstoxAuthorized } from "./upstoxAuth.js";

const UPSTOX_LTP_URL = "https://api.upstox.com/v3/market-quote/ltp";

interface UpstoxLtpResponse {
  status?: string;
  data?: Record<string, { last_price?: number; ltp?: number }>;
}

function extractLtp(
  payload: UpstoxLtpResponse,
  instrumentKey: string,
): number | null {
  const data = payload.data;
  if (!data) {
    return null;
  }

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

function parseLtpsFromPayload(payload: UpstoxLtpResponse): Map<string, number> {
  const result = new Map<string, number>();
  const data = payload.data;
  if (!data) {
    return result;
  }

  for (const [key, quote] of Object.entries(data)) {
    const ltp = quote?.last_price ?? quote?.ltp;
    if (ltp === undefined || ltp === null || Number.isNaN(Number(ltp))) {
      continue;
    }
    result.set(key, Number(ltp));
    result.set(decodeURIComponent(key), Number(ltp));
  }

  return result;
}

export class UpstoxQuoteClient {
  constructor(private readonly accessToken: string) {}

  async getLtp(instrumentKey: string): Promise<number | null> {
    const url = new URL(UPSTOX_LTP_URL);
    url.searchParams.set("instrument_key", instrumentKey);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const body = await response.text();
      assertUpstoxAuthorized(response.status, "LTP quote");
      logger.error(
        { status: response.status, instrumentKey, body: body.slice(0, 200) },
        "Upstox LTP fetch failed",
      );
      throw new Error(`Upstox LTP fetch failed: HTTP ${response.status}`);
    }

    const payload = (await response.json()) as UpstoxLtpResponse;
    const ltp = extractLtp(payload, instrumentKey);

    if (ltp === null) {
      logger.warn({ instrumentKey, keys: Object.keys(payload.data ?? {}) }, "LTP missing in Upstox response");
      return null;
    }

    return ltp;
  }

  async getLtps(instrumentKeys: string[]): Promise<Map<string, number>> {
    const uniqueKeys = [...new Set(instrumentKeys)];
    if (uniqueKeys.length === 0) {
      return new Map();
    }

    const url = new URL(UPSTOX_LTP_URL);
    for (const instrumentKey of uniqueKeys) {
      url.searchParams.append("instrument_key", instrumentKey);
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const body = await response.text();
      assertUpstoxAuthorized(response.status, "LTP quote");
      logger.error(
        { status: response.status, count: uniqueKeys.length, body: body.slice(0, 200) },
        "Upstox batch LTP fetch failed",
      );
      throw new Error(`Upstox batch LTP fetch failed: HTTP ${response.status}`);
    }

    const payload = (await response.json()) as UpstoxLtpResponse;
    const parsed = parseLtpsFromPayload(payload);
    const result = new Map<string, number>();

    for (const instrumentKey of uniqueKeys) {
      const ltp =
        parsed.get(instrumentKey) ??
        parsed.get(decodeURIComponent(instrumentKey)) ??
        null;
      if (ltp !== null) {
        result.set(instrumentKey, ltp);
      }
    }

    return result;
  }
}
