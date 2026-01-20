import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  integer,
  decimal,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

// Enums
export const valuationPropertyTypeEnum = pgEnum("valuation_property_type", [
  "sanayi",
  "tarim",
  "konut",
  "arsa",
  "isyeri",
  "diger",
]);

// AI tabanlı değerleme talepleri
export const valuations = pgTable(
  "valuations",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Kullanıcı bilgileri
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),

    // Gayrimenkul temel özellikleri
    propertyType: valuationPropertyTypeEnum("property_type")
      .notNull()
      .default("konut"),
    address: text("address").notNull(),
    city: varchar("city", { length: 100 }).notNull().default("Sakarya"),
    district: varchar("district", { length: 100 }).notNull().default("Hendek"),
    area: integer("area").notNull(), // metrekare

    // Detaylar (oda sayısı, bina yaşı, kat vb. JSON olarak)
    details: jsonb("details").$type<Record<string, any>>().default({}),

    // AI Tahmin sonuçları
    estimatedValue: decimal("estimated_value", { precision: 15, scale: 2 }),
    minValue: decimal("min_value", { precision: 15, scale: 2 }),
    maxValue: decimal("max_value", { precision: 15, scale: 2 }),
    pricePerSqm: decimal("price_per_sqm", { precision: 12, scale: 2 }),
    confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }), // 0.00 - 1.00

    // Analiz detayları
    marketAnalysis: text("market_analysis"),
    comparables: jsonb("comparables").$type<any[]>().default([]),
    trends: jsonb("trends").$type<Record<string, any>>().default({}),

    // İzleme verileri
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),

    // Zaman damgaları
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("valuations_property_type_idx").on(table.propertyType),
    index("valuations_created_at_idx").on(table.createdAt),
  ],
);

// Types
export type Valuation = typeof valuations.$inferSelect;
export type NewValuation = typeof valuations.$inferInsert;
export type ValuationPropertyType =
  | "sanayi"
  | "tarim"
  | "konut"
  | "arsa"
  | "isyeri"
  | "diger";
