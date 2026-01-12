CREATE TYPE "public"."listing_status" AS ENUM('active', 'sold', 'pending', 'draft');--> statement-breakpoint
CREATE TYPE "public"."listing_type" AS ENUM('sanayi', 'tarim', 'konut', 'ticari', 'arsa');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('sale', 'rent');--> statement-breakpoint
CREATE TYPE "public"."appointment_status" AS ENUM('pending', 'confirmed', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."appointment_type" AS ENUM('kahve', 'property_visit', 'valuation', 'consultation');--> statement-breakpoint
CREATE TYPE "public"."valuation_property_type" AS ENUM('sanayi', 'tarim', 'konut', 'ticari', 'arsa');--> statement-breakpoint
CREATE TYPE "public"."contact_source" AS ENUM('website', 'listing', 'valuation', 'whatsapp', 'phone');--> statement-breakpoint
CREATE TYPE "public"."contact_status" AS ENUM('new', 'read', 'replied', 'archived');--> statement-breakpoint
CREATE TYPE "public"."agent_type" AS ENUM('demir_agent', 'miner_agent', 'content_agent');--> statement-breakpoint
CREATE TYPE "public"."chat_status" AS ENUM('active', 'resolved', 'escalated', 'archived');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('draft', 'scheduled', 'published', 'failed');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('instagram', 'twitter', 'linkedin', 'facebook', 'tiktok');--> statement-breakpoint
CREATE TYPE "public"."scraped_listing_status" AS ENUM('new', 'updated', 'removed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."content_section_type" AS ENUM('hero', 'about', 'services', 'team', 'testimonials', 'faq', 'cta', 'stats', 'features');--> statement-breakpoint
CREATE TABLE "agent_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_type" text NOT NULL,
	"task_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"input" jsonb,
	"output" jsonb,
	"error_message" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_calendar" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"platform" "platform" NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"scheduled_at" timestamp,
	"published_at" timestamp,
	"seo_tags" jsonb,
	"hashtags" jsonb,
	"media_urls" jsonb,
	"ai_generated" boolean DEFAULT true,
	"engagement_metrics" jsonb,
	"external_post_id" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alert_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"scraped_listing_id" uuid,
	"severity" text DEFAULT 'info',
	"metadata" jsonb,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visitor_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visitor_id" text NOT NULL,
	"session_id" text,
	"page_url" text NOT NULL,
	"referrer" text,
	"user_agent" text,
	"ip_address" text,
	"country" text,
	"city" text,
	"device" text,
	"browser" text,
	"search_query" text,
	"listing_viewed" uuid,
	"time_on_page" integer,
	"actions" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'user' NOT NULL,
	"phone" varchar(20),
	"avatar" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "listing_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"referrer" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"type" "listing_type" NOT NULL,
	"status" "listing_status" DEFAULT 'draft' NOT NULL,
	"transaction_type" "transaction_type" DEFAULT 'sale' NOT NULL,
	"address" text NOT NULL,
	"city" varchar(100) DEFAULT 'Hendek' NOT NULL,
	"district" varchar(100),
	"neighborhood" varchar(100),
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"area" integer NOT NULL,
	"price" numeric(15, 2) NOT NULL,
	"price_per_sqm" numeric(10, 2),
	"features" jsonb,
	"ai_score" integer,
	"ai_insight" text,
	"roi_estimate" numeric(5, 2),
	"images" jsonb DEFAULT '[]'::jsonb,
	"thumbnail" text,
	"video_url" text,
	"meta_title" varchar(255),
	"meta_description" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_new" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp,
	"sold_at" timestamp,
	CONSTRAINT "listings_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"type" "appointment_type" NOT NULL,
	"status" "appointment_status" DEFAULT 'pending' NOT NULL,
	"date" date NOT NULL,
	"time" time NOT NULL,
	"listing_id" uuid,
	"message" text,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "valuations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255),
	"email" varchar(255),
	"phone" varchar(20),
	"property_type" "valuation_property_type" NOT NULL,
	"address" text NOT NULL,
	"city" varchar(100) DEFAULT 'Hendek' NOT NULL,
	"district" varchar(100),
	"area" integer NOT NULL,
	"details" jsonb,
	"estimated_value" numeric(15, 2),
	"min_value" numeric(15, 2),
	"max_value" numeric(15, 2),
	"price_per_sqm" numeric(10, 2),
	"confidence_score" integer,
	"market_analysis" text,
	"comparables" jsonb,
	"trends" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"subject" varchar(255),
	"message" text NOT NULL,
	"source" "contact_source" DEFAULT 'website' NOT NULL,
	"status" "contact_status" DEFAULT 'new' NOT NULL,
	"listing_id" uuid,
	"admin_reply" text,
	"replied_at" timestamp,
	"ip_address" varchar(45),
	"user_agent" text,
	"is_spam" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visitor_id" text NOT NULL,
	"visitor_name" text,
	"visitor_email" text,
	"visitor_phone" text,
	"visitor_location" text,
	"status" "chat_status" DEFAULT 'active' NOT NULL,
	"lead_score" integer DEFAULT 0,
	"sentiment" text,
	"intent_category" text,
	"metadata" jsonb,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scraped_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" text NOT NULL,
	"source" text NOT NULL,
	"source_url" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"price" integer,
	"currency" text DEFAULT 'TRY',
	"property_type" text,
	"listing_type" text,
	"location" text,
	"city" text,
	"district" text,
	"neighborhood" text,
	"area" integer,
	"room_count" text,
	"features" jsonb,
	"images" jsonb,
	"seller_name" text,
	"seller_phone" text,
	"status" "scraped_listing_status" DEFAULT 'new' NOT NULL,
	"price_history" jsonb,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"removed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"type" "content_section_type" NOT NULL,
	"title" varchar(255),
	"subtitle" text,
	"content" text,
	"image" text,
	"images" jsonb,
	"data" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" varchar(10) DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "content_sections_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "homepage_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_visible" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "homepage_sections_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_name" varchar(255) DEFAULT 'Demir Gayrimenkul' NOT NULL,
	"site_tagline" varchar(500),
	"logo" text,
	"favicon" text,
	"phone" varchar(20),
	"email" varchar(255),
	"whatsapp" varchar(20),
	"address" text,
	"map_embed_url" text,
	"social_media" jsonb,
	"working_hours" jsonb,
	"meta_title" varchar(255),
	"meta_description" text,
	"meta_keywords" text,
	"footer_text" text,
	"copyright_text" varchar(255),
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"bio" text,
	"image" text,
	"phone" varchar(20),
	"email" varchar(255),
	"social_media" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" varchar(10) DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hendek_osb_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" integer NOT NULL,
	"total_area" integer,
	"total_parcels" integer,
	"allocated_parcels" integer,
	"active_companies" integer,
	"production_parcels" integer,
	"current_employment" integer,
	"target_employment" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hendek_population_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" integer NOT NULL,
	"total_population" integer NOT NULL,
	"male_population" integer,
	"female_population" integer,
	"growth_rate" numeric(5, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hendek_population_history_year_unique" UNIQUE("year")
);
--> statement-breakpoint
CREATE TABLE "hendek_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"label" varchar(255) NOT NULL,
	"value" varchar(100) NOT NULL,
	"numeric_value" integer,
	"unit" varchar(50),
	"description" text,
	"icon" varchar(50),
	"color" varchar(50),
	"source" varchar(255),
	"source_url" text,
	"year" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"show_on_homepage" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hendek_stats_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "company_principles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"icon" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "founder_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"image" text,
	"badge_text" varchar(100),
	"hero_title" text,
	"hero_title_highlight" text,
	"narrative_title" varchar(255),
	"narrative_paragraph_1" text,
	"narrative_paragraph_2" text,
	"narrative_divider_text" varchar(100),
	"heritage_title" varchar(100),
	"heritage_text" text,
	"vision_title" varchar(100),
	"vision_text" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manifesto" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"short_title" varchar(255),
	"short_text" text,
	"full_title" varchar(255),
	"full_text" text,
	"signature" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vision_pillars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"icon" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_calendar" ADD CONSTRAINT "content_calendar_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_views" ADD CONSTRAINT "listing_views_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;