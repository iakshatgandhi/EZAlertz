"use client";

import { useCallback, useEffect, useState } from "react";
import type { Alert } from "@stock-alert/shared-types";
import { apiGet } from "@/lib/apiClient";

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<Alert[]>("/api/alerts?status=ACTIVE");
      setAlerts(data);
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLivePrice = useCallback((instrumentKey: string, ltp: number) => {
    setAlerts((current) => {
      let changed = false;
      const next = current.map((alert) => {
        if (alert.instrument?.instrumentKey !== instrumentKey) {
          return alert;
        }
        if (alert.lastPrice === ltp) {
          return alert;
        }
        changed = true;
        return { ...alert, lastPrice: ltp };
      });
      return changed ? next : current;
    });
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { alerts, loading, refresh, updateLivePrice };
}
