import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/postgres/schema/index.ts",
  out: "./src/db/postgres/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/stock_alerts",
  },
});
