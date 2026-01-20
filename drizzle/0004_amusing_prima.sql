CREATE TYPE "public"."collected_category" AS ENUM('konut', 'isyeri', 'arsa', 'bina');--> statement-breakpoint
CREATE TYPE "public"."collected_status" AS ENUM('pending', 'approved', 'rejected', 'duplicate');--> statement-breakpoint
CREATE TYPE "public"."collected_transaction" AS ENUM('satilik', 'kiralik', 'devren-satilik', 'devren-kiralik', 'kat-karsiligi');--> statement-breakpoint
CREATE TABLE "collected_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" varchar(50) NOT NULL,
	"source_url" text NOT NULL,
	"title" varchar(500) NOT NULL,
	"price" varchar(100),
	"price_value" numeric(15, 2),
	"location" text,
	"date" varchar(50),
	"category" "collected_category" NOT NULL,
	"transaction_type" "collected_transaction" NOT NULL,
	"status" "collected_status" DEFAULT 'pending' NOT NULL,
	"thumbnail" text,
	"images" jsonb DEFAULT '[]'::jsonb,
	"description" text,
	"features" jsonb,
	"area" integer,
	"crawled_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"approved_at" timestamp,
	"listing_id" uuid,
	"notes" text
);
