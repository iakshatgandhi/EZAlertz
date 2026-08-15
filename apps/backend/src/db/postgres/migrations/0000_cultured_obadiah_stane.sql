CREATE TYPE "public"."alert_condition" AS ENUM('ABOVE', 'BELOW');--> statement-breakpoint
CREATE TYPE "public"."alert_mode" AS ENUM('ONE_TIME', 'RECURRING');--> statement-breakpoint
CREATE TYPE "public"."alert_status" AS ENUM('ACTIVE', 'TRIGGERED', 'DISABLED', 'ERROR');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('WHATSAPP', 'EMAIL', 'PUSH', 'TELEGRAM');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('PENDING', 'SENT', 'FAILED');--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"instrument_id" uuid NOT NULL,
	"condition_type" "alert_condition" NOT NULL,
	"target_price" numeric(18, 4) NOT NULL,
	"alert_mode" "alert_mode" NOT NULL,
	"status" "alert_status" DEFAULT 'ACTIVE' NOT NULL,
	"previous_price" numeric(18, 4),
	"last_price" numeric(18, 4),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"triggered_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instruments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"symbol" text NOT NULL,
	"company_name" text NOT NULL,
	"exchange" text NOT NULL,
	"instrument_key" text NOT NULL,
	"instrument_type" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alert_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"status" "notification_status" DEFAULT 'PENDING' NOT NULL,
	"provider_message_id" text,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_alert_id_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."alerts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alerts_user_status_idx" ON "alerts" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "alerts_instrument_status_idx" ON "alerts" USING btree ("instrument_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "instruments_instrument_key_idx" ON "instruments" USING btree ("instrument_key");--> statement-breakpoint
CREATE INDEX "instruments_symbol_idx" ON "instruments" USING btree ("symbol");--> statement-breakpoint
CREATE INDEX "instruments_company_name_idx" ON "instruments" USING btree ("company_name");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");