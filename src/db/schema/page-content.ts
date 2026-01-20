import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";

/**
 * Sayfa İçerikleri
 * Web sitesindeki tüm sayfaların statik içeriklerini yönetir
 */
export const pageContents = pgTable("page_contents", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Sayfa tanımlayıcı
  pageSlug: varchar("page_slug", { length: 100 }).notNull(), // anasayfa, hakkimizda, iletisim, degerleme, rehber, randevu
  sectionKey: varchar("section_key", { length: 100 }).notNull(), // hero, features, cta, form, etc.

  // İçerik
  title: text("title"),
  subtitle: text("subtitle"),
  description: text("description"),
  content: text("content"), // Uzun metin içeriği

  // Görsel
  image: text("image"),
  icon: varchar("icon", { length: 50 }),

  // Buton/Link
  buttonText: varchar("button_text", { length: 100 }),
  buttonLink: varchar("button_link", { length: 255 }),
  buttonIcon: varchar("button_icon", { length: 50 }),

  // Ek veriler (JSON)
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),

  // Durum
  isVisible: boolean("is_visible").default(true),
  sortOrder: integer("sort_order").default(0),

  // Zaman
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Sayfa Bölümleri (Sections)
 * Her sayfanın hangi bölümlerden oluştuğunu tanımlar
 */
export const pageSections = pgTable("page_sections", {
  id: uuid("id").defaultRandom().primaryKey(),

  pageSlug: varchar("page_slug", { length: 100 }).notNull(),
  sectionKey: varchar("section_key", { length: 100 }).notNull(),
  sectionName: varchar("section_name", { length: 100 }).notNull(),
  sectionType: varchar("section_type", { length: 50 }).notNull(), // hero, text, features, cta, form, gallery, stats

  // Durum
  isVisible: boolean("is_visible").default(true),
  sortOrder: integer("sort_order").default(0),

  // Zaman
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Types
export type PageContent = typeof pageContents.$inferSelect;
export type NewPageContent = typeof pageContents.$inferInsert;
export type PageSection = typeof pageSections.$inferSelect;
export type NewPageSection = typeof pageSections.$inferInsert;
