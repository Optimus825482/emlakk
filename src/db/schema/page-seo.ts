import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  boolean,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

// Page SEO Management Table
export const pageSeo = pgTable(
  "page_seo",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Page Identifier
    pagePath: varchar("page_path", { length: 255 }).notNull().unique(), // e.g., "/", "/hakkimizda", "/iletisim"
    pageTitle: varchar("page_title", { length: 255 }).notNull(), // e.g., "Anasayfa", "Hakkımızda"

    // SEO Meta Tags
    metaTitle: varchar("meta_title", { length: 255 }),
    metaDescription: text("meta_description"),
    metaKeywords: text("meta_keywords"),
    canonicalUrl: text("canonical_url"),

    // Open Graph (Facebook, LinkedIn)
    ogTitle: varchar("og_title", { length: 255 }),
    ogDescription: text("og_description"),
    ogImage: text("og_image"),
    ogType: varchar("og_type", { length: 50 }).default("website"),

    // Twitter Card
    twitterCard: varchar("twitter_card", { length: 50 }).default(
      "summary_large_image",
    ),
    twitterTitle: varchar("twitter_title", { length: 255 }),
    twitterDescription: text("twitter_description"),
    twitterImage: text("twitter_image"),

    // Structured Data (JSON-LD)
    structuredData: jsonb("structured_data").$type<{
      "@context"?: string;
      "@type"?: string;
      [key: string]: any;
    }>(),

    // SEO Analysis
    focusKeyword: varchar("focus_keyword", { length: 100 }),
    seoScore: integer("seo_score"), // 0-100
    seoAnalysis: jsonb("seo_analysis").$type<{
      strengths?: string[];
      weaknesses?: string[];
      suggestions?: string[];
    }>(),

    // Flags
    isActive: boolean("is_active").notNull().default(true),
    isAiGenerated: boolean("is_ai_generated").default(false),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("page_seo_path_idx").on(table.pagePath),
    index("page_seo_active_idx").on(table.isActive),
  ],
);

// Types
export type PageSeo = typeof pageSeo.$inferSelect;
export type NewPageSeo = typeof pageSeo.$inferInsert;

// Default pages configuration
export const DEFAULT_PAGES = [
  { path: "/", title: "Anasayfa" },
  { path: "/hakkimizda", title: "Hakkımızda" },
  { path: "/iletisim", title: "İletişim" },
  { path: "/ilanlar", title: "İlanlar" },
  { path: "/degerleme", title: "Değerleme" },
  { path: "/randevu", title: "Randevu" },
  { path: "/rehber", title: "Hendek Yatırım Rehberi" },
] as const;
