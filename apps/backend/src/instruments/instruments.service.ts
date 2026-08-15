import type { Instrument } from "@stock-alert/shared-types";
import { NotFoundError } from "../shared/errors.js";
import type { SubscriptionManager } from "../market-data/subscriptionManager.js";
import { InstrumentsRepository } from "./instruments.repository.js";
import { UpstoxInstrumentSearchClient } from "./upstox/UpstoxInstrumentSearchClient.js";
import { UpstoxQuoteClient } from "./upstox/UpstoxQuoteClient.js";

export class InstrumentsService {
  constructor(
    private readonly repository = new InstrumentsRepository(),
    private readonly upstoxSearch: UpstoxInstrumentSearchClient,
    private readonly upstoxQuote: UpstoxQuoteClient,
    private readonly subscriptionManager?: SubscriptionManager,
  ) {}

  async search(query: string): Promise<Instrument[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }

    const upstoxResults = await this.upstoxSearch.search(trimmed);
    if (upstoxResults.length === 0) {
      return [];
    }

    return this.repository.upsertMany(upstoxResults);
  }

  async getById(id: string): Promise<Instrument> {
    const instrument = await this.repository.findById(id);
    if (!instrument) {
      throw new NotFoundError("Instrument not found");
    }
    return instrument;
  }

  async getLtp(instrumentId: string): Promise<{ instrumentKey: string; ltp: number }> {
    const instrument = await this.getById(instrumentId);
    const ltp = await this.upstoxQuote.getLtp(instrument.instrumentKey);

    if (ltp === null) {
      throw new NotFoundError("LTP not available for this instrument");
    }

    await this.subscriptionManager?.add([instrument.instrumentKey]);

    return {
      instrumentKey: instrument.instrumentKey,
      ltp,
    };
  }
}
