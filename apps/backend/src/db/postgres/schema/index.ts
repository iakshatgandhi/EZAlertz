import {
  boolean,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const alertConditionEnum = pgEnum("alert_condition", ["ABOVE", "BELOW"]);
export const alertModeEnum = pgEnum("alert_mode", ["ONE_TIME", "RECURRING"]);
export const alertStatusEnum = pgEnum("alert_status", [
  "ACTIVE",
  "TRIGGERED",
  "DISABLED",
  "ERROR",
]);
export const notificationChannelEnum = pgEnum("notification_channel", [
  "WHATSAPP",
  "EMAIL",
  "PUSH",
  "TELEGRAM",
]);
export const notificationStatusEnum = pgEnum("notification_status", [
  "PENDING",
  "SENT",
  "FAILED",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  whatsappPhone: text("whatsapp_phone"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex("users_email_idx").on(table.email),
}));

export const instruments = pgTable("instruments", {
  id: uuid("id").defaultRandom().primaryKey(),
  symbol: text("symbol").notNull(),
  companyName: text("company_name").notNull(),
  exchange: text("exchange").notNull(),
  instrumentKey: text("instrument_key").notNull(),
  instrumentType: text("instrument_type").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  instrumentKeyIdx: uniqueIndex("instruments_instrument_key_idx").on(table.instrumentKey),
  symbolIdx: index("instruments_symbol_idx").on(table.symbol),
  companyNameIdx: index("instruments_company_name_idx").on(table.companyName),
}));

export const alerts = pgTable("alerts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  instrumentId: uuid("instrument_id").notNull().references(() => instruments.id),
  conditionType: alertConditionEnum("condition_type").notNull(),
  targetPrice: numeric("target_price", { precision: 18, scale: 4 }).notNull(),
  alertMode: alertModeEnum("alert_mode").notNull(),
  status: alertStatusEnum("status").notNull().default("ACTIVE"),
  previousPrice: numeric("previous_price", { precision: 18, scale: 4 }),
  lastPrice: numeric("last_price", { precision: 18, scale: 4 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  triggeredAt: timestamp("triggered_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userStatusIdx: index("alerts_user_status_idx").on(table.userId, table.status),
  instrumentStatusIdx: index("alerts_instrument_status_idx").on(table.instrumentId, table.status),
}));

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  alertId: uuid("alert_id").notNull().references(() => alerts.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  channel: notificationChannelEnum("channel").notNull(),
  status: notificationStatusEnum("status").notNull().default("PENDING"),
  providerMessageId: text("provider_message_id"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});
