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

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { alerts, loading, refresh };
}
