import { gunzipSync } from "node:zlib";
import { INSTRUMENT_SYNC_MIN_COUNT, UPSTOX_INSTRUMENTS_URL } from "../../config/constants.js";
import { logger } from "../../shared/logger.js";
import {
  InstrumentsRepository,
  type SeedInstrument,
} from "../instruments.repository.js";
import {
  mapUpstoxInstrument,
  type UpstoxRawInstrument,
} from "./mapUpstoxInstrument.js";

const BATCH_SIZE = 1_000;

export async function syncUpstoxInstruments(
  url: string = UPSTOX_INSTRUMENTS_URL,
): Promise<number> {
  const repository = new InstrumentsRepository();

  logger.info({ url }, "Downloading Upstox instrument master file");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download instruments: HTTP ${response.status}`);
  }

  const compressed = Buffer.from(await response.arrayBuffer());
  logger.info(
    { sizeMb: (compressed.length / 1024 / 1024).toFixed(1) },
    "Decompressing instrument file",
  );

  const decompressed = gunzipSync(compressed);
  const payload = JSON.parse(decompressed.toString("utf-8")) as UpstoxRawInstrument[];

  if (!Array.isArray(payload)) {
    throw new Error("Upstox instrument file did not contain a JSON array");
  }

  logger.info({ totalRecords: payload.length }, "Parsing tradable equities");

  let batch: SeedInstrument[] = [];
  let synced = 0;

  for (const raw of payload) {
    const mapped = mapUpstoxInstrument(raw);
    if (!mapped) {
      continue;
    }

    batch.push(mapped);

    if (batch.length >= BATCH_SIZE) {
      synced += await repository.bulkUpsert(batch);
      batch = [];
      if (synced % 5_000 === 0) {
        logger.info({ synced }, "Instrument sync progress");
      }
    }
  }

  if (batch.length > 0) {
    synced += await repository.bulkUpsert(batch);
  }

  logger.info({ synced }, "Upstox instrument sync complete");
  return synced;
}

export async function ensureInstrumentsSynced(
  url: string = UPSTOX_INSTRUMENTS_URL,
): Promise<void> {
  const repository = new InstrumentsRepository();
  const count = await repository.countActive();

  if (count >= INSTRUMENT_SYNC_MIN_COUNT) {
    logger.info({ count }, "Instrument master already loaded");
    return;
  }

  logger.info(
    { count, minimum: INSTRUMENT_SYNC_MIN_COUNT },
    "Instrument database is empty or incomplete — syncing from Upstox",
  );

  await syncUpstoxInstruments(url);
}
