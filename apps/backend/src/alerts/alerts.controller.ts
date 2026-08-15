import { Router, type Request, type Response } from "express";
import type { AlertsService } from "./alerts.service.js";
import { createAlertSchema, updateAlertSchema } from "./alerts.validation.js";
import { ValidationError } from "../shared/errors.js";

export function createAlertsRouter(alertsService: AlertsService): Router {
  const router = Router();

  router.get("/", async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const alerts = await alertsService.listAlerts(userId, status);
    res.json({ data: alerts });
  });

  router.post("/", async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const parsed = createAlertSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.message);
    }

    const alert = await alertsService.createAlert(userId, parsed.data);
    res.status(201).json({ data: alert });
  });

  router.patch("/:id", async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const parsed = updateAlertSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.message);
    }

    const alert = await alertsService.updateAlert(
      userId,
      String(req.params.id),
      parsed.data,
    );
    res.json({ data: alert });
  });

  router.delete("/:id", async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    await alertsService.deleteAlert(userId, String(req.params.id));
    res.status(204).send();
  });

  return router;
}
