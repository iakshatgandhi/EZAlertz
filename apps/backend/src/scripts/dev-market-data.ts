import { loadEnv } from "../config/env.js";
import { withReconnect } from "../market-data/reconnect.js";
import { UpstoxProvider } from "../market-data/providers/upstox/UpstoxProvider.js";
import { SubscriptionManager } from "../market-data/subscriptionManager.js";
import { logger } from "../shared/logger.js";

const env = loadEnv();

async function main(): Promise<void> {
  const provider = new UpstoxProvider(env.UPSTOX_ACCESS_TOKEN);
  const subscriptionManager = new SubscriptionManager(provider);

  provider.onConnectionStatus((status) => {
    logger.info({ status }, "Market data connection status");
  });

  provider.onPriceUpdate((tick) => {
    logger.info(
      {
        instrumentKey: tick.instrumentKey,
        symbol: tick.symbol,
        exchange: tick.exchange,
        ltp: tick.ltp,
        timestamp: tick.timestamp,
      },
      "LTP tick",
    );
  });

  await withReconnect(provider, []);
  await subscriptionManager.add([env.PHASE1_INSTRUMENT_KEY]);

  logger.info(
    { instrumentKey: env.PHASE1_INSTRUMENT_KEY },
    "Market data dev script running — press Ctrl+C to stop",
  );
}

main().catch((error) => {
  logger.error({ error }, "Market data dev script failed");
  process.exit(1);
});
