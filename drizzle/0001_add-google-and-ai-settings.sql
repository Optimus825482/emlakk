CREATE TYPE "public"."ai_provider" AS ENUM('deepseek', 'openai', 'anthropic', 'google-gemini', 'openrouter');--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ai_provider" "ai_provider" DEFAULT 'deepseek' NOT NULL,
	"ai_model" varchar(100) DEFAULT 'deepseek-chat' NOT NULL,
	"ai_api_key" text,
	"ai_api_key_valid" boolean DEFAULT false,
	"ai_api_key_last_checked" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "google_analytics_id" varchar(50);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "google_search_console_code" varchar(100);