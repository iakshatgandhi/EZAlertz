import { Router, type NextFunction, type Request, type Response } from "express";
import type { SubscriptionManager } from "../market-data/subscriptionManager.js";
import { InstrumentsService } from "./instruments.service.js";
import { InstrumentsRepository } from "./instruments.repository.js";
import { UpstoxInstrumentSearchClient } from "./upstox/UpstoxInstrumentSearchClient.js";
import { UpstoxQuoteClient } from "./upstox/UpstoxQuoteClient.js";

function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    void handler(req, res, next).catch(next);
  };
}

export function createInstrumentsRouter(
  accessToken: string,
  subscriptionManager: SubscriptionManager,
): Router {
  const instrumentsService = new InstrumentsService(
    new InstrumentsRepository(),
    new UpstoxInstrumentSearchClient(accessToken),
    new UpstoxQuoteClient(accessToken),
    subscriptionManager,
  );

  const router = Router();

  router.get(
    "/search",
    asyncHandler(async (req, res) => {
      const query = typeof req.query.q === "string" ? req.query.q : "";
      const results = await instrumentsService.search(query);
      res.json({ data: results });
    }),
  );

  router.get(
    "/:instrumentId/ltp",
    asyncHandler(async (req, res) => {
      const quote = await instrumentsService.getLtp(String(req.params.instrumentId));
      res.json({ data: quote });
    }),
  );

  router.get(
    "/:instrumentId",
    asyncHandler(async (req, res) => {
      const instrument = await instrumentsService.getById(String(req.params.instrumentId));
      res.json({ data: instrument });
    }),
  );

  return router;
}
