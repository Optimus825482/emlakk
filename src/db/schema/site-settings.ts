import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  jsonb,
  boolean,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";

// Site Settings - Tek satır, tüm site ayarları
export const siteSettings = pgTable("site_settings", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Genel Bilgiler
  siteName: varchar("site_name", { length: 255 })
    .notNull()
    .default("Demir Gayrimenkul"),
  siteTagline: varchar("site_tagline", { length: 500 }),
  logo: text("logo"),
  favicon: text("favicon"),

  // İletişim Bilgileri
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  whatsapp: varchar("whatsapp", { length: 20 }),
  address: text("address"),
  mapEmbedUrl: text("map_embed_url"),

  // Sosyal Medya
  socialMedia: jsonb("social_media").$type<{
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
  }>(),

  // Çalışma Saatleri
  workingHours: jsonb("working_hours").$type<{
    weekdays?: string;
    saturday?: string;
    sunday?: string;
  }>(),

  // SEO
  metaTitle: varchar("meta_title", { length: 255 }),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),

  // Google Entegrasyonları
  googleAnalyticsId: varchar("google_analytics_id", { length: 50 }), // G-XXXXXXXXXX
  googleSearchConsoleCode: varchar("google_search_console_code", {
    length: 100,
  }), // Doğrulama meta tag içeriği

  // Footer
  footerText: text("footer_text"),
  copyrightText: varchar("copyright_text", { length: 255 }),

  // Timestamps
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Homepage Sections - Ana sayfa bölüm ayarları
export const homepageSections = pgTable("homepage_sections", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Section tanımı
  key: varchar("key", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),

  // Durum
  isVisible: boolean("is_visible").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Content Sections - Dinamik içerik blokları
export const contentSectionTypeEnum = pgEnum("content_section_type", [
  "hero",
  "about",
  "services",
  "team",
  "testimonials",
  "faq",
  "cta",
  "stats",
  "features",
  "page", // Sayfa içerikleri için
]);

export const contentSections = pgTable("content_sections", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Section tanımı
  key: varchar("key", { length: 100 }).notNull().unique(), // hero_main, about_page, etc.
  type: contentSectionTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }),
  subtitle: text("subtitle"),

  // İçerik
  content: text("content"), // Ana metin
  image: text("image"),
  images: jsonb("images").$type<string[]>(),

  // Ek veriler (esnek yapı)
  data: jsonb("data").$type<Record<string, unknown>>(),

  // Durum
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: varchar("sort_order", { length: 10 }).default("0"),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Team Members - Ekip üyeleri
export const teamMembers = pgTable("team_members", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: varchar("name", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  bio: text("bio"),
  image: text("image"),

  // İletişim
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),

  // Sosyal medya
  socialMedia: jsonb("social_media").$type<{
    linkedin?: string;
    instagram?: string;
    twitter?: string;
  }>(),

  // Durum
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: varchar("sort_order", { length: 10 }).default("0"),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Types
export type SiteSettings = typeof siteSettings.$inferSelect;
export type NewSiteSettings = typeof siteSettings.$inferInsert;
export type ContentSection = typeof contentSections.$inferSelect;
export type NewContentSection = typeof contentSections.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type HomepageSection = typeof homepageSections.$inferSelect;
export type NewHomepageSection = typeof homepageSections.$inferInsert;
