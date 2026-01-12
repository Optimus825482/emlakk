import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  integer,
  decimal,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";

// Hendek İstatistikleri - Genel bilgiler
export const hendekStats = pgTable("hendek_stats", {
  id: uuid("id").defaultRandom().primaryKey(),

  key: varchar("key", { length: 100 }).notNull().unique(), // population, osb_employment, university_students, etc.
  label: varchar("label", { length: 255 }).notNull(),
  value: varchar("value", { length: 100 }).notNull(),
  numericValue: integer("numeric_value"), // Sıralama ve karşılaştırma için
  unit: varchar("unit", { length: 50 }), // kişi, hektar, %, etc.
  description: text("description"),
  icon: varchar("icon", { length: 50 }), // Material icon name
  color: varchar("color", { length: 50 }), // terracotta, forest, blue, etc.

  // Kaynak bilgisi
  source: varchar("source", { length: 255 }),
  sourceUrl: text("source_url"),
  year: integer("year"),

  // Görünürlük
  isActive: boolean("is_active").notNull().default(true),
  showOnHomepage: boolean("show_on_homepage").notNull().default(true),
  sortOrder: integer("sort_order").default(0),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Hendek Nüfus Geçmişi - Yıllara göre
export const hendekPopulationHistory = pgTable("hendek_population_history", {
  id: uuid("id").defaultRandom().primaryKey(),

  year: integer("year").notNull().unique(),
  totalPopulation: integer("total_population").notNull(),
  malePopulation: integer("male_population"),
  femalePopulation: integer("female_population"),
  growthRate: decimal("growth_rate", { precision: 5, scale: 2 }), // Yıllık artış oranı %

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Hendek OSB Verileri
export const hendekOsbStats = pgTable("hendek_osb_stats", {
  id: uuid("id").defaultRandom().primaryKey(),

  year: integer("year").notNull(),
  totalArea: integer("total_area"), // Hektar
  totalParcels: integer("total_parcels"),
  allocatedParcels: integer("allocated_parcels"),
  activeCompanies: integer("active_companies"),
  productionParcels: integer("production_parcels"),
  currentEmployment: integer("current_employment"),
  targetEmployment: integer("target_employment"),

  // Ek bilgiler
  notes: text("notes"),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Types
export type HendekStat = typeof hendekStats.$inferSelect;
export type NewHendekStat = typeof hendekStats.$inferInsert;
export type HendekPopulationHistory =
  typeof hendekPopulationHistory.$inferSelect;
export type HendekOsbStats = typeof hendekOsbStats.$inferSelect;
