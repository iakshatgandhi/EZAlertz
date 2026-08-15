import type { NormalizedTick } from "@stock-alert/shared-types";
import type { AlertCache } from "../db/redis/alertCache.js";
import type { AlertsRepository } from "../alerts/alerts.repository.js";
import type { NotificationsService } from "../notifications/notifications.service.js";
import { eventBus } from "../realtime/eventBus.js";
import { logger } from "../shared/logger.js";
import { detectCrossing } from "./crossingDetector.js";
import { nextAlertStatus } from "./stateTransitions.js";

export class AlertEngine {
  constructor(
    private readonly alertCache: AlertCache,
    private readonly alertsRepository: AlertsRepository,
    private readonly notifications: Pick<NotificationsService, "notify">,
  ) {}

  async onTick(tick: NormalizedTick): Promise<void> {
    const activeAlerts = await this.alertCache.getActiveByInstrumentKey(
      tick.instrumentKey,
    );

    if (activeAlerts.length === 0) {
      return;
    }

    for (const alert of activeAlerts) {
      await this.evaluateAlert(alert, tick);
    }
  }

  private async evaluateAlert(
    alert: Awaited<ReturnType<AlertCache["getActiveByInstrumentKey"]>>[number],
    tick: NormalizedTick,
  ): Promise<void> {
    const currentPrice = tick.ltp;
    const previousPrice = alert.previousPrice;

    if (previousPrice === null) {
      await this.persistPriceState(alert, currentPrice, currentPrice, alert.status);
      return;
    }

    const crossed = detectCrossing({
      conditionType: alert.conditionType,
      targetPrice: alert.targetPrice,
      previousPrice,
      currentPrice,
    });

    if (crossed) {
      const acquired = await this.alertCache.tryAcquireTriggerLock(
        alert.id,
        previousPrice,
        currentPrice,
      );

      if (!acquired) {
        logger.debug({ alertId: alert.id }, "Duplicate trigger suppressed");
        await this.persistPriceState(alert, currentPrice, currentPrice, alert.status);
        return;
      }

      const nextStatus = nextAlertStatus(alert.status, alert.alertMode, true);
      const triggeredAt = new Date();

      await this.persistPriceState(alert, currentPrice, currentPrice, nextStatus, triggeredAt);

      const message = `${alert.symbol} crossed ${alert.conditionType === "BELOW" ? "below" : "above"} ₹${alert.targetPrice}. Current price: ₹${currentPrice}.`;

      logger.info(
        {
          alertId: alert.id,
          symbol: alert.symbol,
          conditionType: alert.conditionType,
          targetPrice: alert.targetPrice,
          currentPrice,
          alertMode: alert.alertMode,
          nextStatus,
        },
        "Alert triggered",
      );

      await this.notifications.notify({
        alertId: alert.id,
        userId: alert.userId,
        message,
      });

      eventBus.emit("ALERT_TRIGGERED", {
        alertId: alert.id,
        symbol: alert.symbol,
        conditionType: alert.conditionType,
        targetPrice: alert.targetPrice,
        currentPrice,
        status: nextStatus,
      });

      return;
    }

    await this.persistPriceState(alert, currentPrice, currentPrice, alert.status);
  }

  private async persistPriceState(
    alert: Awaited<ReturnType<AlertCache["getActiveByInstrumentKey"]>>[number],
    lastPrice: number,
    previousPrice: number,
    status: typeof alert.status,
    triggeredAt?: Date,
  ): Promise<void> {
    const updated = await this.alertsRepository.updatePriceState(alert.id, {
      lastPrice,
      previousPrice,
      status,
      triggeredAt,
    });

    if (!updated) {
      return;
    }

    await this.alertCache.upsert(updated);
  }
}
