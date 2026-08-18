"use client";

import { useCallback, useEffect, useState } from "react";
import type { MarketCalendarStatus } from "@stock-alert/shared-types";
import { apiGet, ApiError } from "@/lib/apiClient";

const REFRESH_MS = 60_000;

export function useMarketCalendar() {
  const [calendar, setCalendar] = useState<MarketCalendarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await apiGet<MarketCalendarStatus>("/api/market/calendar");
      setCalendar(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not load market calendar",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => {
      void refresh();
    }, REFRESH_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  return { calendar, loading, error, refresh };
}
