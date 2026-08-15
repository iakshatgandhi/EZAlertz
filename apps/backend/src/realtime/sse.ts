import type { Request, Response } from "express";
import type { SSEEvent } from "@stock-alert/shared-types";
import { eventBus } from "./eventBus.js";

export function handleSse(req: Request, res: Response): void {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const sendEvent = (event: SSEEvent) => {
    res.write(`event: ${event.type}\n`);
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  eventBus.onAny(sendEvent);

  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 30_000);

  req.on("close", () => {
    clearInterval(heartbeat);
    eventBus.off("CONNECTION_STATUS", sendEvent);
  });
}
