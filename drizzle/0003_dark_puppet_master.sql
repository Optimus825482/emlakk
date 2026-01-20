CREATE TYPE "public"."smtp_encryption" AS ENUM('none', 'ssl', 'tls');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('appointment', 'contact', 'valuation', 'listing', 'system');--> statement-breakpoint
ALTER TYPE "public"."content_section_type" ADD VALUE 'page';--> statement-breakpoint
CREATE TABLE "page_contents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_slug" varchar(100) NOT NULL,
	"section_key" varchar(100) NOT NULL,
	"title" text,
	"subtitle" text,
	"description" text,
	"content" text,
	"image" text,
	"icon" varchar(50),
	"button_text" varchar(100),
	"button_link" varchar(255),
	"button_icon" varchar(50),
	"metadata" jsonb,
	"is_visible" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_slug" varchar(100) NOT NULL,
	"section_key" varchar(100) NOT NULL,
	"section_name" varchar(100) NOT NULL,
	"section_type" varchar(50) NOT NULL,
	"is_visible" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"smtp_host" varchar(255),
	"smtp_port" integer DEFAULT 587,
	"smtp_encryption" "smtp_encryption" DEFAULT 'tls',
	"smtp_username" varchar(255),
	"smtp_password" text,
	"from_email" varchar(255),
	"from_name" varchar(255) DEFAULT 'Demir Gayrimenkul',
	"reply_to_email" varchar(255),
	"is_active" boolean DEFAULT false NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"last_tested_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"entity_type" varchar(50),
	"entity_id" uuid,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_daily_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"date" varchar(10) NOT NULL,
	"views" integer DEFAULT 0,
	"unique_visitors" integer DEFAULT 0,
	"avg_duration" integer DEFAULT 0,
	"avg_scroll_depth" integer DEFAULT 0,
	"mobile_views" integer DEFAULT 0,
	"desktop_views" integer DEFAULT 0,
	"tablet_views" integer DEFAULT 0,
	"phone_clicks" integer DEFAULT 0,
	"whatsapp_clicks" integer DEFAULT 0,
	"email_clicks" integer DEFAULT 0,
	"map_clicks" integer DEFAULT 0,
	"gallery_clicks" integer DEFAULT 0,
	"share_clicks" integer DEFAULT 0,
	"favorite_adds" integer DEFAULT 0,
	"appointment_requests" integer DEFAULT 0,
	"traffic_sources" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" varchar(255) NOT NULL,
	"action" varchar(100) NOT NULL,
	"status" varchar(50) NOT NULL,
	"input" jsonb,
	"output" jsonb,
	"error" text,
	"ai_model" varchar(100),
	"tokens_used" integer,
	"processing_time" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" varchar(255) NOT NULL,
	"entity_title" varchar(500),
	"meta_title" varchar(70),
	"meta_description" text,
	"canonical_url" text,
	"og_title" varchar(95),
	"og_description" text,
	"og_image" text,
	"og_type" varchar(50) DEFAULT 'website',
	"twitter_card" varchar(50) DEFAULT 'summary_large_image',
	"twitter_title" varchar(70),
	"twitter_description" text,
	"twitter_image" text,
	"keywords" jsonb,
	"focus_keyword" varchar(100),
	"structured_data" jsonb,
	"seo_score" integer,
	"seo_analysis" jsonb,
	"is_ai_generated" boolean DEFAULT false,
	"ai_model" varchar(100),
	"last_ai_update" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_name" varchar(255),
	"site_description" text,
	"default_og_image" text,
	"twitter_handle" varchar(50),
	"facebook_app_id" varchar(100),
	"robots_txt" text,
	"sitemap_enabled" boolean DEFAULT true,
	"auto_generate_seo" boolean DEFAULT true,
	"seo_language" varchar(10) DEFAULT 'tr',
	"target_region" varchar(100) DEFAULT 'Hendek, Sakarya',
	"industry_keywords" jsonb,
	"google_site_verification" varchar(100),
	"google_analytics_id" varchar(50),
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_tasks" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "content_calendar" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "market_alerts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "visitor_analytics" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "chat_messages" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "chat_sessions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "scraped_listings" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "agent_tasks" CASCADE;--> statement-breakpoint
DROP TABLE "content_calendar" CASCADE;--> statement-breakpoint
DROP TABLE "market_alerts" CASCADE;--> statement-breakpoint
DROP TABLE "visitor_analytics" CASCADE;--> statement-breakpoint
DROP TABLE "chat_messages" CASCADE;--> statement-breakpoint
DROP TABLE "chat_sessions" CASCADE;--> statement-breakpoint
DROP TABLE "scraped_listings" CASCADE;--> statement-breakpoint
ALTER TABLE "listing_views" ADD COLUMN "visitor_id" varchar(64);--> statement-breakpoint
ALTER TABLE "listing_views" ADD COLUMN "session_id" varchar(64);--> statement-breakpoint
ALTER TABLE "listing_views" ADD COLUMN "device_type" varchar(20);--> statement-breakpoint
ALTER TABLE "listing_views" ADD COLUMN "browser" varchar(50);--> statement-breakpoint
ALTER TABLE "listing_views" ADD COLUMN "os" varchar(50);--> statement-breakpoint
ALTER TABLE "listing_views" ADD COLUMN "screen_resolution" varchar(20);--> statement-breakpoint
ALTER TABLE "listing_views" ADD COLUMN "country" varchar(100);--> statement-breakpoint
ALTER TABLE "listing_views" ADD COLUMN "city" varchar(100);--> statement-breakpoint
ALTER TABLE "listing_views" ADD COLUMN "region" varchar(100);--> statement-breakpoint
ALTER TABLE "listing_views" ADD COLUMN "utm_source" varchar(100);--> statement-breakpoint
ALTER TABLE "listing_views" ADD COLUMN "utm_medium" varchar(100);--> statement-breakpoint
ALTER TABLE "listing_views" ADD COLUMN "utm_campaign" varchar(100);--> statement-breakpoint
ALTER TABLE "listing_views" ADD COLUMN "duration" integer;--> statement-breakpoint
ALTER TABLE "listing_views" ADD COLUMN "scroll_depth" integer;--> statement-breakpoint
ALTER TABLE "listing_views" ADD COLUMN "clicked_phone" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "listing_views" ADD COLUMN "clicked_whatsapp" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "listing_views" ADD COLUMN "clicked_email" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "listing_views" ADD COLUMN "clicked_map" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "listing_views" ADD COLUMN "clicked_gallery" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "listing_views" ADD COLUMN "clicked_share" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "listing_views" ADD COLUMN "added_to_favorites" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "listing_views" ADD COLUMN "requested_appointment" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "listing_views" ADD COLUMN "viewed_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "listing_daily_stats" ADD CONSTRAINT "listing_daily_stats_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "listing_daily_stats_listing_date_idx" ON "listing_daily_stats" USING btree ("listing_id","date");--> statement-breakpoint
CREATE INDEX "listing_views_listing_id_idx" ON "listing_views" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "listing_views_visitor_id_idx" ON "listing_views" USING btree ("visitor_id");--> statement-breakpoint
CREATE INDEX "listing_views_viewed_at_idx" ON "listing_views" USING btree ("viewed_at");--> statement-breakpoint
ALTER TABLE "listing_views" DROP COLUMN "created_at";--> statement-breakpoint
DROP TYPE "public"."agent_type";--> statement-breakpoint
DROP TYPE "public"."chat_status";--> statement-breakpoint
DROP TYPE "public"."content_status";--> statement-breakpoint
DROP TYPE "public"."platform";--> statement-breakpoint
DROP TYPE "public"."scraped_listing_status";