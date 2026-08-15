import { and, asc, count, eq, ilike, inArray, or, sql } from "drizzle-orm";
import type { Instrument } from "@stock-alert/shared-types";
import { getDb } from "../db/postgres/client.js";
import { instruments } from "../db/postgres/schema/index.js";
import { mapInstrumentRow } from "../alerts/alerts.mapper.js";

export interface SeedInstrument {
  symbol: string;
  companyName: string;
  exchange: string;
  instrumentKey: string;
  instrumentType: string;
}

export class InstrumentsRepository {
  private readonly db = getDb(process.env.DATABASE_URL!);

  async findByInstrumentKeys(instrumentKeys: string[]): Promise<Instrument[]> {
    if (instrumentKeys.length === 0) {
      return [];
    }

    const rows = await this.db
      .select()
      .from(instruments)
      .where(
        and(
          eq(instruments.isActive, true),
          inArray(instruments.instrumentKey, instrumentKeys),
        ),
      );

    const byKey = new Map(rows.map((row) => [row.instrumentKey, mapInstrumentRow(row)]));
    return instrumentKeys
      .map((key) => byKey.get(key))
      .filter((instrument): instrument is Instrument => instrument !== undefined);
  }

  async upsertMany(items: SeedInstrument[]): Promise<Instrument[]> {
    if (items.length === 0) {
      return [];
    }

    await this.bulkUpsert(items);
    return this.findByInstrumentKeys(items.map((item) => item.instrumentKey));
  }

  async searchLocal(query: string, limit = 25): Promise<Instrument[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }

    const pattern = `%${trimmed}%`;
    const prefix = `${trimmed}%`;

    const rows = await this.db
      .select()
      .from(instruments)
      .where(
        and(
          eq(instruments.isActive, true),
          or(
            ilike(instruments.symbol, pattern),
            ilike(instruments.companyName, pattern),
          ),
        ),
      )
      .orderBy(
        sql`CASE
          WHEN ${instruments.symbol} ILIKE ${prefix} THEN 0
          WHEN ${instruments.companyName} ILIKE ${prefix} THEN 1
          WHEN ${instruments.symbol} ILIKE ${pattern} THEN 2
          ELSE 3
        END`,
        asc(instruments.symbol),
      )
      .limit(limit);

    return rows.map(mapInstrumentRow);
  }

  async countActive(): Promise<number> {
    const [result] = await this.db
      .select({ value: count() })
      .from(instruments)
      .where(eq(instruments.isActive, true));

    return Number(result?.value ?? 0);
  }

  async bulkUpsert(items: SeedInstrument[]): Promise<number> {
    if (items.length === 0) {
      return 0;
    }

    await this.db
      .insert(instruments)
      .values(
        items.map((item) => ({
          symbol: item.symbol,
          companyName: item.companyName,
          exchange: item.exchange,
          instrumentKey: item.instrumentKey,
          instrumentType: item.instrumentType,
          isActive: true,
          updatedAt: new Date(),
        })),
      )
      .onConflictDoUpdate({
        target: instruments.instrumentKey,
        set: {
          symbol: sql`excluded.symbol`,
          companyName: sql`excluded.company_name`,
          exchange: sql`excluded.exchange`,
          instrumentType: sql`excluded.instrument_type`,
          isActive: sql`true`,
          updatedAt: sql`now()`,
        },
      });

    return items.length;
  }

  async findById(id: string): Promise<Instrument | null> {
    const rows = await this.db
      .select()
      .from(instruments)
      .where(eq(instruments.id, id))
      .limit(1);

    const row = rows[0];
    return row ? mapInstrumentRow(row) : null;
  }

  async findByInstrumentKey(instrumentKey: string): Promise<Instrument | null> {
    const rows = await this.db
      .select()
      .from(instruments)
      .where(eq(instruments.instrumentKey, instrumentKey))
      .limit(1);

    const row = rows[0];
    return row ? mapInstrumentRow(row) : null;
  }

  async upsertSeed(items: SeedInstrument[]): Promise<void> {
    for (const item of items) {
      const existing = await this.findByInstrumentKey(item.instrumentKey);
      if (existing) {
        continue;
      }

      await this.db.insert(instruments).values({
        symbol: item.symbol,
        companyName: item.companyName,
        exchange: item.exchange,
        instrumentKey: item.instrumentKey,
        instrumentType: item.instrumentType,
        isActive: true,
      });
    }
  }
}
