import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

// Manifesto - Ana sayfa ve hakkımızda için
export const manifesto = pgTable("manifesto", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Kısa versiyon (ana sayfa için)
  shortTitle: varchar("short_title", { length: 255 }),
  shortText: text("short_text"),

  // Uzun versiyon (hakkımızda için)
  fullTitle: varchar("full_title", { length: 255 }),
  fullText: text("full_text"),
  signature: varchar("signature", { length: 255 }), // "— Mustafa Demir"

  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Manifesto = typeof manifesto.$inferSelect;
export type NewManifesto = typeof manifesto.$inferInsert;

// Kurucu / Founder bilgileri
export const founderProfile = pgTable("founder_profile", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Kişisel bilgiler
  name: varchar("name", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  image: text("image"),

  // Hero bölümü
  badgeText: varchar("badge_text", { length: 100 }), // "Kurucu Vizyonu"
  heroTitle: text("hero_title"), // "Hendek'in Toprağından,"
  heroTitleHighlight: text("hero_title_highlight"), // "Geleceğin Teknolojisine."

  // Narrative / Hikaye
  narrativeTitle: varchar("narrative_title", { length: 255 }), // "Amatör Ruh & Profesyonel Veri"
  narrativeParagraph1: text("narrative_paragraph_1"),
  narrativeParagraph2: text("narrative_paragraph_2"),
  narrativeDividerText: varchar("narrative_divider_text", { length: 100 }), // "Neden Hendek?"

  // Mirasımız & Vizyonumuz Kartları
  heritageTitle: varchar("heritage_title", { length: 100 }), // "Mirasımız"
  heritageText: text("heritage_text"),
  visionTitle: varchar("vision_title", { length: 100 }), // "Vizyonumuz"
  visionText: text("vision_text"),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Vizyon Temelleri / Pillars
export const visionPillars = pgTable("vision_pillars", {
  id: uuid("id").defaultRandom().primaryKey(),

  icon: varchar("icon", { length: 100 }).notNull(), // Material icon name
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),

  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Şirket İlkeleri / Principles
export const companyPrinciples = pgTable("company_principles", {
  id: uuid("id").defaultRandom().primaryKey(),

  icon: varchar("icon", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),

  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Types
export type FounderProfile = typeof founderProfile.$inferSelect;
export type NewFounderProfile = typeof founderProfile.$inferInsert;
export type VisionPillar = typeof visionPillars.$inferSelect;
export type NewVisionPillar = typeof visionPillars.$inferInsert;
export type CompanyPrinciple = typeof companyPrinciples.$inferSelect;
export type NewCompanyPrinciple = typeof companyPrinciples.$inferInsert;
