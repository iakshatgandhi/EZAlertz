import type { AlertsRepository } from "../alerts/alerts.repository.js";
import type { AlertCache } from "../db/redis/alertCache.js";
import type { MarketDataProvider } from "../market-data/MarketDataProvider.js";
import type { SubscriptionManager } from "../market-data/subscriptionManager.js";
import { logger } from "../shared/logger.js";

export interface RecoverStateDeps {
  alertCache: AlertCache;
  alertsRepository: AlertsRepository;
  marketDataProvider: MarketDataProvider;
  subscriptionManager: SubscriptionManager;
}

export async function recoverState(deps: RecoverStateDeps): Promise<void> {
  logger.info("Recovering active alerts state on startup");

  const activeAlerts = await deps.alertsRepository.findActiveEngineAlerts();
  await deps.alertCache.rebuild(activeAlerts);

  const instrumentKeys = [...new Set(activeAlerts.map((alert) => alert.instrumentKey))];
  if (instrumentKeys.length > 0) {
    await deps.subscriptionManager.sync(instrumentKeys);
  }

  logger.info(
    { alertCount: activeAlerts.length, instrumentCount: instrumentKeys.length },
    "State recovery complete",
  );
}
