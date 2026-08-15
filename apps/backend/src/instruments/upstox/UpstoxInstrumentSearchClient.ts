import { logger } from "../../shared/logger.js";
import { formatUnknownError } from "../../shared/formatError.js";
import { assertUpstoxAuthorized } from "./upstoxAuth.js";
import {
  mapUpstoxSearchResult,
  type UpstoxSearchInstrument,
} from "./mapUpstoxSearchResult.js";
import type { SeedInstrument } from "../instruments.repository.js";

const UPSTOX_SEARCH_URL = "https://api.upstox.com/v2/instruments/search";
const MIN_QUERY_LENGTH = 2;

interface UpstoxSearchResponse {
  status?: string;
  data?: UpstoxSearchInstrument[];
}

export class UpstoxInstrumentSearchClient {
  constructor(private readonly accessToken: string) {}

  async search(query: string, limit = 25): Promise<SeedInstrument[]> {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      return [];
    }

    const url = new URL(UPSTOX_SEARCH_URL);
    url.searchParams.set("query", trimmed.slice(0, 50));
    url.searchParams.set("segments", "EQ");
    url.searchParams.set("records", String(Math.min(limit, 30)));

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const body = await response.text();
      assertUpstoxAuthorized(response.status, "instrument search");
      logger.error(
        { status: response.status, body: body.slice(0, 200) },
        "Upstox instrument search failed",
      );
      throw new Error(`Upstox instrument search failed: HTTP ${response.status}`);
    }

    const payload = (await response.json()) as UpstoxSearchResponse;
    const rows = payload.data ?? [];

    const seen = new Set<string>();
    const results: SeedInstrument[] = [];

    for (const row of rows) {
      const mapped = mapUpstoxSearchResult(row);
      if (!mapped || seen.has(mapped.instrumentKey)) {
        continue;
      }

      seen.add(mapped.instrumentKey);
      results.push(mapped);
    }

    return results;
  }
}
