import { existsSync } from "node:fs";
import { resolve } from "node:path";
import dotenv from "dotenv";
import { loadEnv } from "../config/env.js";
import { getDb } from "../db/postgres/client.js";
import { syncUpstoxInstruments } from "../instruments/sync/syncUpstoxInstruments.js";
import { logger } from "../shared/logger.js";

const envPath = resolve(process.cwd(), ".env");

async function main(): Promise<void> {
  if (!existsSync(envPath)) {
    logger.error("Missing apps/backend/.env — copy from .env.example first");
    process.exit(1);
  }

  dotenv.config({ path: envPath });
  const env = loadEnv();

  getDb(env.DATABASE_URL);

  const synced = await syncUpstoxInstruments();
  logger.info({ synced }, "Instrument sync finished");
}

main().catch((error) => {
  logger.error({ error }, "Instrument sync failed");
  process.exit(1);
});
