import type { AlertsService } from "../alerts/alerts.service.js";
import { ALERT_HISTORY_CLEANUP_INTERVAL_MS } from "../config/constants.js";
import { logger } from "../shared/logger.js";

export function startAlertHistoryCleanup(alertsService: AlertsService): void {
  const runCleanup = async () => {
    try {
      const removed = await alertsService.purgeExpiredTriggeredAlerts();
      if (removed > 0) {
        logger.info({ removed }, "Purged expired triggered alerts from history");
      }
    } catch (error) {
      logger.error({ error }, "Failed to purge expired alert history");
    }
  };

  void runCleanup();
  setInterval(() => {
    void runCleanup();
  }, ALERT_HISTORY_CLEANUP_INTERVAL_MS);
}
