import { z } from "zod";

export const createAlertSchema = z.object({
  instrumentId: z.string().uuid(),
  condition: z.enum(["ABOVE", "BELOW"]),
  targetPrice: z.number().positive(),
  mode: z.enum(["ONE_TIME", "RECURRING"]),
});

export const updateAlertSchema = z.object({
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
  targetPrice: z.number().positive().optional(),
});

export type CreateAlertInput = z.infer<typeof createAlertSchema>;
export type UpdateAlertInput = z.infer<typeof updateAlertSchema>;
