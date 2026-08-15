import type { Alert, Instrument } from "@stock-alert/shared-types";
import type { EngineAlert } from "../alert-engine/types.js";
import type { alerts, instruments } from "../db/postgres/schema/index.js";

type AlertRow = typeof alerts.$inferSelect;
type InstrumentRow = typeof instruments.$inferSelect;

function parseNumeric(value: string | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function mapInstrumentRow(row: InstrumentRow): Instrument {
  return {
    id: row.id,
    symbol: row.symbol,
    companyName: row.companyName,
    exchange: row.exchange,
    instrumentKey: row.instrumentKey,
    instrumentType: row.instrumentType,
    isActive: row.isActive,
  };
}

export function mapAlertRow(
  row: AlertRow,
  instrument?: InstrumentRow,
): Alert {
  return {
    id: row.id,
    userId: row.userId,
    instrumentId: row.instrumentId,
    conditionType: row.conditionType,
    targetPrice: Number(row.targetPrice),
    alertMode: row.alertMode,
    status: row.status,
    previousPrice: parseNumeric(row.previousPrice),
    lastPrice: parseNumeric(row.lastPrice),
    createdAt: row.createdAt.toISOString(),
    triggeredAt: row.triggeredAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
    instrument: instrument ? mapInstrumentRow(instrument) : undefined,
  };
}

export function toEngineAlert(
  row: AlertRow,
  instrument: InstrumentRow,
): EngineAlert {
  return {
    id: row.id,
    userId: row.userId,
    instrumentId: row.instrumentId,
    instrumentKey: instrument.instrumentKey,
    symbol: instrument.symbol,
    companyName: instrument.companyName,
    conditionType: row.conditionType,
    targetPrice: Number(row.targetPrice),
    alertMode: row.alertMode,
    status: row.status,
    previousPrice: parseNumeric(row.previousPrice),
    lastPrice: parseNumeric(row.lastPrice),
  };
}
