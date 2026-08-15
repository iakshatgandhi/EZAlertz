"use client";

import { useEffect, useRef } from "react";
import type { SSEEvent } from "@stock-alert/shared-types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function useRealtimeEvents(
  onEvent: (event: SSEEvent) => void,
): void {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    const source = new EventSource(`${API_BASE}/api/events`);

    const handleMessage = (event: MessageEvent<string>) => {
      try {
        const parsed = JSON.parse(event.data) as SSEEvent;
        handlerRef.current(parsed);
      } catch {
        // ignore malformed events
      }
    };

    source.onmessage = handleMessage;

    for (const type of [
      "PRICE_UPDATE",
      "ALERT_CREATED",
      "ALERT_TRIGGERED",
      "ALERT_DISABLED",
      "ALERT_DELETED",
      "CONNECTION_STATUS",
    ]) {
      source.addEventListener(type, handleMessage);
    }

    return () => {
      source.close();
    };
  }, []);
}
