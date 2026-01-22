-- Migration: Add page_seo table for site-wide SEO management
-- Created: 2026-01-21

CREATE TABLE IF NOT EXISTS "page_seo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_path" varchar(255) NOT NULL,
	"page_title" varchar(255) NOT NULL,
	"meta_title" varchar(255),
	"meta_description" text,
	"meta_keywords" text,
	"canonical_url" text,
	"og_title" varchar(255),
	"og_description" text,
	"og_image" text,
	"og_type" varchar(50) DEFAULT 'website',
	"twitter_card" varchar(50) DEFAULT 'summary_large_image',
	"twitter_title" varchar(255),
	"twitter_description" text,
	"twitter_image" text,
	"structured_data" jsonb,
	"focus_keyword" varchar(100),
	"seo_score" integer,
	"seo_analysis" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_ai_generated" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "page_seo_page_path_unique" UNIQUE("page_path")
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS "page_seo_path_idx" ON "page_seo" ("page_path");
CREATE INDEX IF NOT EXISTS "page_seo_active_idx" ON "page_seo" ("is_active");

-- Insert default pages
INSERT INTO "page_seo" ("page_path", "page_title", "is_active") VALUES
	('/', 'Anasayfa', true),
	('/hakkimizda', 'Hakkımızda', true),
	('/iletisim', 'İletişim', true),
	('/ilanlar', 'İlanlar', true),
	('/degerleme', 'Değerleme', true),
	('/randevu', 'Randevu', true),
	('/rehber', 'Hendek Yatırım Rehberi', true)
ON CONFLICT ("page_path") DO NOTHING;
