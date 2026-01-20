import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  jsonb,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

// SEO Metadata - Her sayfa/ilan için SEO bilgileri
export const seoMetadata = pgTable("seo_metadata", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Hangi içerik için
  entityType: varchar("entity_type", { length: 50 }).notNull(), // page, listing, blog
  entityId: varchar("entity_id", { length: 255 }).notNull(), // sayfa slug veya ilan id
  entityTitle: varchar("entity_title", { length: 500 }), // Orijinal başlık

  // Temel SEO
  metaTitle: varchar("meta_title", { length: 70 }), // Max 60-70 karakter
  metaDescription: text("meta_description"), // Max 155-160 karakter
  canonicalUrl: text("canonical_url"),

  // Open Graph (Facebook, LinkedIn)
  ogTitle: varchar("og_title", { length: 95 }),
  ogDescription: text("og_description"),
  ogImage: text("og_image"),
  ogType: varchar("og_type", { length: 50 }).default("website"),

  // Twitter Card
  twitterCard: varchar("twitter_card", { length: 50 }).default(
    "summary_large_image"
  ),
  twitterTitle: varchar("twitter_title", { length: 70 }),
  twitterDescription: text("twitter_description"),
  twitterImage: text("twitter_image"),

  // Anahtar Kelimeler
  keywords: jsonb("keywords").$type<string[]>(),
  focusKeyword: varchar("focus_keyword", { length: 100 }),

  // Structured Data (JSON-LD)
  structuredData: jsonb("structured_data").$type<Record<string, unknown>>(),

  // SEO Skoru ve Analiz
  seoScore: integer("seo_score"), // 0-100
  seoAnalysis: jsonb("seo_analysis").$type<{
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  }>(),

  // AI tarafından oluşturuldu mu
  isAiGenerated: boolean("is_ai_generated").default(false),
  aiModel: varchar("ai_model", { length: 100 }),
  lastAiUpdate: timestamp("last_ai_update"),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// SEO Logs - SEO işlem geçmişi
export const seoLogs = pgTable("seo_logs", {
  id: uuid("id").defaultRandom().primaryKey(),

  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: varchar("entity_id", { length: 255 }).notNull(),

  action: varchar("action", { length: 100 }).notNull(), // generate, update, analyze
  status: varchar("status", { length: 50 }).notNull(), // pending, success, failed

  // Detaylar
  input: jsonb("input").$type<Record<string, unknown>>(),
  output: jsonb("output").$type<Record<string, unknown>>(),
  error: text("error"),

  // AI bilgileri
  aiModel: varchar("ai_model", { length: 100 }),
  tokensUsed: integer("tokens_used"),
  processingTime: integer("processing_time"), // ms

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// SEO Ayarları - Global SEO konfigürasyonu
export const seoSettings = pgTable("seo_settings", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Site geneli
  siteName: varchar("site_name", { length: 255 }),
  siteDescription: text("site_description"),
  defaultOgImage: text("default_og_image"),

  // Sosyal medya
  twitterHandle: varchar("twitter_handle", { length: 50 }),
  facebookAppId: varchar("facebook_app_id", { length: 100 }),

  // Robots & Sitemap
  robotsTxt: text("robots_txt"),
  sitemapEnabled: boolean("sitemap_enabled").default(true),

  // AI Ayarları
  autoGenerateSeo: boolean("auto_generate_seo").default(true),
  seoLanguage: varchar("seo_language", { length: 10 }).default("tr"),
  targetRegion: varchar("target_region", { length: 100 }).default(
    "Hendek, Sakarya"
  ),
  industryKeywords: jsonb("industry_keywords").$type<string[]>(),

  // Google
  googleSiteVerification: varchar("google_site_verification", { length: 100 }),
  googleAnalyticsId: varchar("google_analytics_id", { length: 50 }),

  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Types
export type SeoMetadata = typeof seoMetadata.$inferSelect;
export type NewSeoMetadata = typeof seoMetadata.$inferInsert;
export type SeoLog = typeof seoLogs.$inferSelect;
export type SeoSettings = typeof seoSettings.$inferSelect;
