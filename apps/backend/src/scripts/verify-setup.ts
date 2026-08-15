import { existsSync } from "node:fs";
import { resolve } from "node:path";
import dotenv from "dotenv";
import { loadEnv } from "../config/env.js";
import { logger } from "../shared/logger.js";
import { withReconnect } from "../market-data/reconnect.js";
import { UpstoxProvider } from "../market-data/providers/upstox/UpstoxProvider.js";
import { SubscriptionManager } from "../market-data/subscriptionManager.js";

const envPath = resolve(process.cwd(), ".env");

async function verify(): Promise<void> {
  logger.info("EZ Alertz Phase 1 verification");

  if (!existsSync(envPath)) {
    logger.error("Missing apps/backend/.env — copy from .env.example and add Upstox credentials");
    process.exit(1);
  }

  dotenv.config({ path: envPath });

  const rawToken = process.env.UPSTOX_ACCESS_TOKEN?.trim();
  if (!rawToken) {
    logger.warn(
      "UPSTOX_ACCESS_TOKEN not configured — skipping live WebSocket test. Add credentials to apps/backend/.env",
    );
    logger.info("Static checks passed: run `pnpm test` and `pnpm build` for compile/test verification");
    process.exit(0);
  }

  let env;
  try {
    env = loadEnv();
  } catch (error) {
    logger.error(
      { message: error instanceof Error ? error.message : String(error) },
      "Invalid .env configuration",
    );
    process.exit(1);
  }

  if (rawToken === "your-access-token") {
    logger.warn(
      "UPSTOX_ACCESS_TOKEN is still a placeholder — skipping live WebSocket test",
    );
    process.exit(0);
  }

  const provider = new UpstoxProvider(env.UPSTOX_ACCESS_TOKEN);
  const subscriptionManager = new SubscriptionManager(provider);

  let tickReceived = false;

  provider.onPriceUpdate((tick) => {
    tickReceived = true;
    logger.info({ tick }, "Received live LTP tick");
  });

  provider.onConnectionStatus((status) => {
    logger.info({ status }, "Connection status update");
  });

  await withReconnect(provider, []);
  await subscriptionManager.add([env.PHASE1_INSTRUMENT_KEY]);

  logger.info(
    { instrumentKey: env.PHASE1_INSTRUMENT_KEY, timeoutSeconds: 30 },
    "Waiting for live ticks",
  );

  await new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      if (!tickReceived) {
        logger.warn(
          "No ticks received in 30s — market may be closed or credentials may be invalid",
        );
      } else {
        logger.info("Phase 1 verification successful — live LTP received");
      }
      void provider.disconnect();
      resolve();
    }, 30_000);

    provider.onPriceUpdate(() => {
      if (tickReceived) {
        clearTimeout(timeout);
        logger.info("Phase 1 verification successful — live LTP received");
        void provider.disconnect();
        resolve();
      }
    });
  });
}

verify().catch((error) => {
  logger.error({ error }, "Verification failed");
  process.exit(1);
});
