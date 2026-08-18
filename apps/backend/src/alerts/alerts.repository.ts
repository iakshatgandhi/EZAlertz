import { and, desc, eq, gte, lt } from "drizzle-orm";
import type { Alert, CreateAlertRequest } from "@stock-alert/shared-types";
import type { EngineAlert } from "../alert-engine/types.js";
import { getDb } from "../db/postgres/client.js";
import { alerts, instruments } from "../db/postgres/schema/index.js";
import type { UpdateAlertInput } from "./alerts.validation.js";
import { mapAlertRow, toEngineAlert } from "./alerts.mapper.js";

export interface CreateAlertRecord {
  userId: string;
  instrumentId: string;
  conditionType: CreateAlertRequest["condition"];
  targetPrice: number;
  alertMode: CreateAlertRequest["mode"];
}

export interface PriceStateUpdate {
  lastPrice: number;
  previousPrice: number;
  status: Alert["status"];
  triggeredAt?: Date;
}

export class AlertsRepository {
  private readonly db = getDb(process.env.DATABASE_URL!);

  async findTriggeredHistory(userId: string, since: Date): Promise<Alert[]> {
    const rows = await this.db
      .select({ alert: alerts, instrument: instruments })
      .from(alerts)
      .innerJoin(instruments, eq(alerts.instrumentId, instruments.id))
      .where(
        and(
          eq(alerts.userId, userId),
          eq(alerts.status, "TRIGGERED"),
          gte(alerts.triggeredAt, since),
        ),
      )
      .orderBy(desc(alerts.triggeredAt));

    return rows.map(({ alert, instrument }) => mapAlertRow(alert, instrument));
  }

  async deleteTriggeredOlderThan(before: Date): Promise<number> {
    const result = await this.db
      .delete(alerts)
      .where(and(eq(alerts.status, "TRIGGERED"), lt(alerts.triggeredAt, before)))
      .returning({ id: alerts.id });

    return result.length;
  }

  async findByUserId(userId: string, status?: string): Promise<Alert[]> {
    const conditions = [eq(alerts.userId, userId)];
    if (status) {
      conditions.push(eq(alerts.status, status as Alert["status"]));
    }

    const rows = await this.db
      .select({ alert: alerts, instrument: instruments })
      .from(alerts)
      .innerJoin(instruments, eq(alerts.instrumentId, instruments.id))
      .where(and(...conditions))
      .orderBy(desc(alerts.createdAt));

    return rows.map(({ alert, instrument }) => mapAlertRow(alert, instrument));
  }

  async findById(id: string): Promise<Alert | null> {
    const rows = await this.db
      .select({ alert: alerts, instrument: instruments })
      .from(alerts)
      .innerJoin(instruments, eq(alerts.instrumentId, instruments.id))
      .where(eq(alerts.id, id))
      .limit(1);

    const row = rows[0];
    if (!row) {
      return null;
    }

    return mapAlertRow(row.alert, row.instrument);
  }

  async findActiveEngineAlerts(): Promise<EngineAlert[]> {
    const rows = await this.db
      .select({ alert: alerts, instrument: instruments })
      .from(alerts)
      .innerJoin(instruments, eq(alerts.instrumentId, instruments.id))
      .where(eq(alerts.status, "ACTIVE"));

    return rows.map(({ alert, instrument }) => toEngineAlert(alert, instrument));
  }

  async create(input: CreateAlertRecord): Promise<Alert> {
    const [row] = await this.db
      .insert(alerts)
      .values({
        userId: input.userId,
        instrumentId: input.instrumentId,
        conditionType: input.conditionType,
        targetPrice: input.targetPrice.toString(),
        alertMode: input.alertMode,
        status: "ACTIVE",
      })
      .returning();

    const created = await this.findById(row.id);
    if (!created) {
      throw new Error("Failed to load created alert");
    }
    return created;
  }

  async update(id: string, input: UpdateAlertInput): Promise<Alert | null> {
    const values: Partial<typeof alerts.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.status) {
      values.status = input.status;
    }
    if (input.targetPrice !== undefined) {
      values.targetPrice = input.targetPrice.toString();
    }

    await this.db.update(alerts).set(values).where(eq(alerts.id, id));
    return this.findById(id);
  }

  async updatePriceState(
    id: string,
    input: PriceStateUpdate,
  ): Promise<EngineAlert | null> {
    const values: Partial<typeof alerts.$inferInsert> = {
      lastPrice: input.lastPrice.toString(),
      previousPrice: input.previousPrice.toString(),
      status: input.status,
      updatedAt: new Date(),
    };

    if (input.triggeredAt) {
      values.triggeredAt = input.triggeredAt;
    }

    await this.db.update(alerts).set(values).where(eq(alerts.id, id));

    const rows = await this.db
      .select({ alert: alerts, instrument: instruments })
      .from(alerts)
      .innerJoin(instruments, eq(alerts.instrumentId, instruments.id))
      .where(eq(alerts.id, id))
      .limit(1);

    const row = rows[0];
    if (!row) {
      return null;
    }

    return toEngineAlert(row.alert, row.instrument);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(alerts).where(eq(alerts.id, id)).returning();
    return result.length > 0;
  }
}
