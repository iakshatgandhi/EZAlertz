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
}
