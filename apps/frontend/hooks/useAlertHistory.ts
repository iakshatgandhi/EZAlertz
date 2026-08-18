"use client";

import { useCallback, useEffect, useState } from "react";
import type { Alert } from "@stock-alert/shared-types";
import { apiGet } from "@/lib/apiClient";

export function useAlertHistory() {
  const [history, setHistory] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<Alert[]>("/api/alerts/history");
      setHistory(data);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { history, loading, refresh };
}
