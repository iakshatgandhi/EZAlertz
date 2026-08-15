import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import { AlertEngine } from "./alert-engine/evaluator.js";
import { createAlertsRouter } from "./alerts/alerts.routes.js";
import { AlertsRepository } from "./alerts/alerts.repository.js";
import { AlertsService } from "./alerts/alerts.service.js";
import { createAuthRouter } from "./auth/auth.controller.js";
import { createSessionMiddleware } from "./auth/auth.middleware.js";
import { AuthService } from "./auth/auth.service.js";
import { SessionStore } from "./auth/session.store.js";
import { loadEnv } from "./config/env.js";
import { AlertCache } from "./db/redis/alertCache.js";
import { AlertIndex } from "./db/redis/alertIndex.js";
import { getRedis } from "./db/redis/client.js";
import { getDb } from "./db/postgres/client.js";
import { createInstrumentsRouter } from "./instruments/instruments.controller.js";
import { validateUpstoxAccessToken } from "./instruments/upstox/upstoxAuth.js";
import { MarketDataReconnectManager } from "./market-data/marketDataReconnectManager.js";
import { UpstoxProvider } from "./market-data/providers/upstox/UpstoxProvider.js";
import { SubscriptionManager } from "./market-data/subscriptionManager.js";
import { createNotificationSystem } from "./notifications/index.js";
import { eventBus } from "./realtime/eventBus.js";
import { handleSse } from "./realtime/sse.js";
import { recoverState } from "./startup/recoverState.js";
import { seedDatabase } from "./startup/seed.js";
import { AppError } from "./shared/errors.js";
import { logger } from "./shared/logger.js";

const env = loadEnv();
const startedAt = Date.now();

getDb(env.DATABASE_URL);
const redis = getRedis(env.REDIS_URL);
const alertIndex = new AlertIndex(redis);
const alertCache = new AlertCache(redis, alertIndex);
const alertsRepository = new AlertsRepository();
const sessionStore = new SessionStore(redis);
const authService = new AuthService();
const requireAuth = createSessionMiddleware(sessionStore);

const marketDataProvider = new UpstoxProvider(env.UPSTOX_ACCESS_TOKEN);
const subscriptionManager = new SubscriptionManager(marketDataProvider);
const alertsService = new AlertsService(
  alertsRepository,
  alertCache,
  subscriptionManager,
);

const notificationSystem = createNotificationSystem(
  env.REDIS_URL,
  env.WHATSAPP_API_TOKEN,
  env.WHATSAPP_PHONE_NUMBER_ID,
);

const alertEngine = new AlertEngine(
  alertCache,
  alertsRepository,
  notificationSystem.service,
);

const marketDataReconnect = new MarketDataReconnectManager(marketDataProvider, {
  canReconnect: async () => validateUpstoxAccessToken(env.UPSTOX_ACCESS_TOKEN),
});

let latestTick: {
  instrumentKey: string;
  ltp: number;
  timestamp: string;
} | null = null;

const app = express();
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

marketDataProvider.onPriceUpdate((tick) => {
  latestTick = {
    instrumentKey: tick.instrumentKey,
    ltp: tick.ltp,
    timestamp: tick.timestamp,
  };

  logger.info(
    {
      instrumentKey: tick.instrumentKey,
      symbol: tick.symbol,
      exchange: tick.exchange,
      ltp: tick.ltp,
      timestamp: tick.timestamp,
    },
    "LTP update",
  );

  eventBus.emit("PRICE_UPDATE", {
    instrumentKey: tick.instrumentKey,
    symbol: tick.symbol,
    exchange: tick.exchange,
    ltp: tick.ltp,
  });

  void alertEngine.onTick(tick);
});

marketDataProvider.onConnectionStatus((status) => {
  eventBus.emit("CONNECTION_STATUS", { marketData: status });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/status", (_req, res) => {
  res.json({
    data: {
      marketData: marketDataProvider.getConnectionStatus(),
      subscribedInstruments: marketDataProvider.getSubscribedInstruments().length,
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
      latestTick,
      whatsappEnabled: Boolean(
        env.WHATSAPP_API_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID,
      ),
    },
  });
});

app.get("/api/events", handleSse);
app.use("/api/auth", createAuthRouter(authService, sessionStore, env));
app.use("/api/alerts", requireAuth, createAlertsRouter(alertsService));
app.use("/api/stocks", requireAuth, createInstrumentsRouter(env.UPSTOX_ACCESS_TOKEN, subscriptionManager));

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, code: err.code });
    return;
  }

  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
});

async function bootstrap(): Promise<void> {
  await redis.connect();

  await seedDatabase(
    "dev@ezalertz.local",
    env.WHATSAPP_RECIPIENT_PHONE || undefined,
  );

  if (notificationSystem.worker) {
    logger.info("WhatsApp notification worker started");
  } else {
    logger.warn(
      "WhatsApp not configured — set WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID",
    );
  }

  await recoverState({
    alertCache,
    alertsRepository,
    marketDataProvider,
    subscriptionManager,
  });

  const upstoxTokenValid = await validateUpstoxAccessToken(env.UPSTOX_ACCESS_TOKEN);
  if (!upstoxTokenValid) {
    logger.error(
      "UPSTOX_ACCESS_TOKEN is invalid or expired. " +
        "Regenerate it in the Upstox developer portal and update apps/backend/.env. " +
        "Stock search and live prices will not work until fixed.",
    );
  } else {
    try {
      const keysToSubscribe = subscriptionManager.getActiveKeys();
      await marketDataReconnect.connectAndSubscribe(
        keysToSubscribe.length > 0 ? keysToSubscribe : [],
      );

      if (subscriptionManager.getActiveKeys().length === 0) {
        logger.info(
          { instrumentKey: env.PHASE1_INSTRUMENT_KEY },
          "No active alerts — subscribing to default instrument for feed testing",
        );
        await subscriptionManager.add([env.PHASE1_INSTRUMENT_KEY]);
      }
    } catch (error) {
      logger.error(
        { error },
        "Market data WebSocket failed to connect — reconnect manager will keep trying",
      );
    }
  }

  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, frontendUrl: env.FRONTEND_URL }, "Backend server started");
  });
}

bootstrap().catch((error) => {
  logger.error({ error }, "Failed to start server");
  process.exit(1);
});

process.on("SIGINT", () => {
  marketDataReconnect.stop();
  void notificationSystem.close().finally(() => process.exit(0));
});

process.on("SIGTERM", () => {
  marketDataReconnect.stop();
  void notificationSystem.close().finally(() => process.exit(0));
});
