import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  // Optional for Phase 1 — needed later for OAuth token refresh
  UPSTOX_CLIENT_ID: z.string().optional().default(""),
  UPSTOX_CLIENT_SECRET: z.string().optional().default(""),
  UPSTOX_ACCESS_TOKEN: z.string().trim().min(1, "Required for live market data"),
  DATABASE_URL: z
    .string()
    .url()
    .default("postgresql://postgres:postgres@localhost:5432/stock_alerts"),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  SESSION_SECRET: z.string().min(16).default("dev-session-secret-change-me"),
  PORT: z.coerce.number().default(4000),
  PHASE1_INSTRUMENT_KEY: z.string().default("NSE_EQ|INE002A01018"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  WHATSAPP_API_TOKEN: z.string().optional().default(""),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional().default(""),
  WHATSAPP_RECIPIENT_PHONE: z.string().optional().default(""),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const formatted = parsed.error.flatten().fieldErrors;
    const missing = Object.entries(formatted)
      .map(([key, errors]) => `  ${key}: ${errors?.join(", ")}`)
      .join("\n");

    throw new Error(
      `Invalid apps/backend/.env configuration:\n${missing}\n\n` +
        "Phase 1 requires UPSTOX_ACCESS_TOKEN (from Upstox developer portal → your app → Generate access token).\n" +
        "Edit apps/backend/.env and set UPSTOX_ACCESS_TOKEN=your_token_here",
    );
  }
  return parsed.data;
}
