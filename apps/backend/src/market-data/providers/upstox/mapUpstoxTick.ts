import type { NormalizedTick } from "@stock-alert/shared-types";
import { parseInstrumentKey } from "../../normalizer.js";

interface UpstoxLtpcFeed {
  ltp?: number;
  last_price?: number;
  cp?: number;
  ltt?: string | number;
}

interface UpstoxFeedEntry {
  instrumentKey?: string;
  instrument_key?: string;
  ltpc?: UpstoxLtpcFeed;
  lastPrice?: number;
  ltp?: number;
  fullFeed?: {
    marketFF?: { ltpc?: UpstoxLtpcFeed };
    indexFF?: { ltpc?: UpstoxLtpcFeed };
  };
  full_feed?: {
    marketFF?: { ltpc?: UpstoxLtpcFeed };
    indexFF?: { ltpc?: UpstoxLtpcFeed };
  };
}

interface UpstoxFeedMessage {
  feeds?: Record<string, UpstoxFeedEntry>;
  type?: string | number;
}

function extractLtpc(feed: UpstoxFeedEntry): UpstoxLtpcFeed | undefined {
  if (feed.ltpc) {
    return feed.ltpc;
  }

  const full = feed.fullFeed ?? feed.full_feed;
  return full?.marketFF?.ltpc ?? full?.indexFF?.ltpc;
}

export function mapUpstoxTick(
  instrumentKey: string,
  feed: UpstoxFeedEntry,
): NormalizedTick | null {
  const ltpc = extractLtpc(feed);
  const ltp =
    ltpc?.ltp ??
    ltpc?.last_price ??
    feed.lastPrice ??
    feed.ltp;

  if (ltp === undefined || ltp === null || Number.isNaN(Number(ltp))) {
    return null;
  }

  const { exchange, symbol } = parseInstrumentKey(instrumentKey);
  const timestamp =
    ltpc?.ltt !== undefined
      ? new Date(Number(ltpc.ltt)).toISOString()
      : new Date().toISOString();

  return {
    instrumentKey,
    symbol,
    exchange,
    ltp: Number(ltp),
    timestamp,
  };
}

export function mapUpstoxMessage(message: unknown): NormalizedTick[] {
  if (!message || typeof message !== "object") {
    return [];
  }

  const payload = message as UpstoxFeedMessage;

  if (payload.type === "market_info" || payload.type === 2) {
    return [];
  }

  const feeds = payload.feeds;

  if (!feeds || typeof feeds !== "object") {
    return [];
  }

  const ticks: NormalizedTick[] = [];

  for (const [key, feed] of Object.entries(feeds)) {
    const instrumentKey = decodeURIComponent(
      feed.instrumentKey ?? feed.instrument_key ?? key,
    );
    const tick = mapUpstoxTick(instrumentKey, feed);
    if (tick) {
      ticks.push(tick);
    }
  }

  return ticks;
}
