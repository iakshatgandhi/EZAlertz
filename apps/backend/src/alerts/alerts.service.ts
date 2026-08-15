import type { CreateAlertRequest, Alert } from "@stock-alert/shared-types";
import type { EngineAlert } from "../alert-engine/types.js";
import type { AlertCache } from "../db/redis/alertCache.js";
import type { SubscriptionManager } from "../market-data/subscriptionManager.js";
import { InstrumentsRepository } from "../instruments/instruments.repository.js";
import { NotFoundError, ValidationError } from "../shared/errors.js";
import { eventBus } from "../realtime/eventBus.js";
import { AlertsRepository } from "./alerts.repository.js";
import { toEngineAlert } from "./alerts.mapper.js";
import type { UpdateAlertInput } from "./alerts.validation.js";
import { getDb } from "../db/postgres/client.js";
import { alerts, instruments } from "../db/postgres/schema/index.js";
import { eq } from "drizzle-orm";

export class AlertsService {
  constructor(
    private readonly repository: AlertsRepository,
    private readonly alertCache: AlertCache,
    private readonly subscriptionManager: SubscriptionManager,
    private readonly instrumentsRepository = new InstrumentsRepository(),
  ) {}

  async listAlerts(userId: string, status?: string): Promise<Alert[]> {
    return this.repository.findByUserId(userId, status);
  }

  async createAlert(userId: string, input: CreateAlertRequest): Promise<Alert> {
    const instrument = await this.instrumentsRepository.findById(input.instrumentId);
    if (!instrument) {
      throw new NotFoundError("Instrument not found");
    }

    const alert = await this.repository.create({
      userId,
      instrumentId: input.instrumentId,
      conditionType: input.condition,
      targetPrice: input.targetPrice,
      alertMode: input.mode,
    });

    const engineAlert = await this.loadEngineAlert(alert.id);
    if (!engineAlert) {
      throw new Error("Failed to load created alert for cache");
    }

    const existingCount = await this.alertCache.countForInstrument(instrument.instrumentKey);
    await this.alertCache.upsert(engineAlert);

    if (existingCount === 0) {
      await this.subscriptionManager.add([instrument.instrumentKey]);
    }

    eventBus.emit("ALERT_CREATED", { alert });
    return alert;
  }

  async updateAlert(
    userId: string,
    alertId: string,
    input: UpdateAlertInput,
  ): Promise<Alert> {
    const existing = await this.repository.findById(alertId);
    if (!existing || existing.userId !== userId) {
      throw new NotFoundError("Alert not found");
    }

    if (input.targetPrice !== undefined && input.targetPrice <= 0) {
      throw new ValidationError("Target price must be positive");
    }

    const updated = await this.repository.update(alertId, input);
    if (!updated) {
      throw new NotFoundError("Alert not found");
    }

    const engineAlert = await this.loadEngineAlert(alertId);
    if (engineAlert) {
      await this.alertCache.upsert(engineAlert);
    }

    if (input.status === "DISABLED") {
      eventBus.emit("ALERT_DISABLED", { alertId });
    }

    return updated;
  }

  async deleteAlert(userId: string, alertId: string): Promise<void> {
    const existing = await this.repository.findById(alertId);
    if (!existing || existing.userId !== userId) {
      throw new NotFoundError("Alert not found");
    }

    const instrumentKey = existing.instrument?.instrumentKey;
    if (!instrumentKey) {
      throw new Error("Alert instrument missing");
    }

    await this.repository.delete(alertId);
    await this.alertCache.remove(alertId, instrumentKey);

    const remaining = await this.alertCache.countForInstrument(instrumentKey);
    if (remaining === 0) {
      await this.subscriptionManager.remove([instrumentKey]);
    }

    eventBus.emit("ALERT_DELETED", { alertId });
  }

  private async loadEngineAlert(alertId: string): Promise<EngineAlert | null> {
    const db = getDb(process.env.DATABASE_URL!);
    const rows = await db
      .select({ alert: alerts, instrument: instruments })
      .from(alerts)
      .innerJoin(instruments, eq(alerts.instrumentId, instruments.id))
      .where(eq(alerts.id, alertId))
      .limit(1);

    const row = rows[0];
    if (!row) {
      return null;
    }

    return toEngineAlert(row.alert, row.instrument);
  }
}
