import { describe, expect, it, vi } from "vitest";
import type { NormalizedTick } from "@stock-alert/shared-types";
import { AlertEngine } from "../../src/alert-engine/evaluator.js";
import type { EngineAlert } from "../../src/alert-engine/types.js";
import type { AlertCache } from "../../src/db/redis/alertCache.js";
import type { AlertsRepository } from "../../src/alerts/alerts.repository.js";

function makeAlert(overrides: Partial<EngineAlert> = {}): EngineAlert {
  return {
    id: "alert-1",
    userId: "user-1",
    instrumentId: "inst-1",
    instrumentKey: "NSE_EQ|INE002A01018",
    symbol: "RELIANCE",
    companyName: "Reliance Industries Ltd",
    conditionType: "BELOW",
    targetPrice: 1450,
    alertMode: "ONE_TIME",
    status: "ACTIVE",
    previousPrice: 1450.1,
    lastPrice: 1450.1,
    ...overrides,
  };
}

function makeTick(ltp: number): NormalizedTick {
  return {
    instrumentKey: "NSE_EQ|INE002A01018",
    symbol: "RELIANCE",
    exchange: "NSE",
    ltp,
    timestamp: new Date().toISOString(),
  };
}

function createMocks() {
  const alerts: EngineAlert[] = [];
  const notifications: string[] = [];

  const alertCache = {
    getActiveByInstrumentKey: vi.fn(async () => [...alerts]),
    tryAcquireTriggerLock: vi.fn(async () => true),
    upsert: vi.fn(async (alert: EngineAlert) => {
      const index = alerts.findIndex((item) => item.id === alert.id);
      if (index >= 0) {
        alerts[index] = alert;
      }
    }),
  } as unknown as AlertCache;

  const alertsRepository = {
    updatePriceState: vi.fn(async (id: string, input) => {
      const alert = alerts.find((item) => item.id === id);
      if (!alert) {
        return null;
      }
      const updated = {
        ...alert,
        previousPrice: input.previousPrice,
        lastPrice: input.lastPrice,
        status: input.status,
      };
      const index = alerts.findIndex((item) => item.id === id);
      alerts[index] = updated;
      return updated;
    }),
  } as unknown as AlertsRepository;

  const notificationsService = {
    notify: vi.fn(async (payload: { message: string }) => {
      notifications.push(payload.message);
    }),
  };

  const engine = new AlertEngine(alertCache, alertsRepository, notificationsService as never);

  return { engine, alerts, notifications, alertCache, alertsRepository, notificationsService };
}

describe("AlertEngine", () => {
  it("triggers on first tick when condition is already met", async () => {
    const { engine, alerts, notifications } = createMocks();
    alerts.push(makeAlert({ previousPrice: null, lastPrice: null }));

    await engine.onTick(makeTick(1449.9));

    expect(notifications).toHaveLength(1);
    expect(alerts[0]?.status).toBe("TRIGGERED");
  });

  it("sets baseline price on first tick without triggering", async () => {
    const { engine, alerts, notifications } = createMocks();
    alerts.push(makeAlert({ previousPrice: null, lastPrice: null }));

    await engine.onTick(makeTick(1482.3));

    expect(notifications).toHaveLength(0);
    expect(alerts[0]?.previousPrice).toBe(1482.3);
  });

  it("triggers BELOW crossing and marks ONE_TIME alert as TRIGGERED", async () => {
    const { engine, alerts, notifications } = createMocks();
    alerts.push(makeAlert());

    await engine.onTick(makeTick(1449.9));

    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toContain("RELIANCE");
    expect(alerts[0]?.status).toBe("TRIGGERED");
  });

  it("does not retrigger while price remains below target", async () => {
    const { engine, alerts, notifications } = createMocks();
    alerts.push(makeAlert());

    await engine.onTick(makeTick(1449.9));
    await engine.onTick(makeTick(1448.5));

    expect(notifications).toHaveLength(1);
  });

  it("keeps RECURRING alert ACTIVE after trigger", async () => {
    const { engine, alerts, notifications } = createMocks();
    alerts.push(makeAlert({ alertMode: "RECURRING" }));

    await engine.onTick(makeTick(1449.9));

    expect(notifications).toHaveLength(1);
    expect(alerts[0]?.status).toBe("ACTIVE");
  });
});
