import { Router, type Request, type Response } from "express";
import type { MarketCalendarService } from "./marketCalendar.service.js";

export function createMarketCalendarRouter(
  marketCalendarService: MarketCalendarService,
): Router {
  const router = Router();

  router.get("/calendar", async (_req: Request, res: Response) => {
    const status = await marketCalendarService.getStatus();
    res.json({ data: status });
  });

  return router;
}
