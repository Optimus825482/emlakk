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
} from "drizzle-orm/pg-core";

// Enums
export const valuationPropertyTypeEnum = pgEnum("valuation_property_type", [
  "sanayi",
  "tarim",
  "konut",
  "ticari",
  "arsa",
]);

// AI Valuations table
export const valuations = pgTable("valuations", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Contact info (optional - for lead generation)
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),

  // Property info
  propertyType: valuationPropertyTypeEnum("property_type").notNull(),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull().default("Hendek"),
  district: varchar("district", { length: 100 }),
  area: integer("area").notNull(), // m²

  // Additional details
  details: jsonb("details").$type<{
    rooms?: string;
    buildingAge?: number;
    floor?: number;
    totalFloors?: number;
    heating?: string;
    // Tarım
    treeCount?: number;
    soilQuality?: string;
    irrigation?: boolean;
    // Sanayi
    infrastructure?: boolean;
    roadAccess?: string;
  }>(),

  // AI Results
  estimatedValue: decimal("estimated_value", { precision: 15, scale: 2 }),
  minValue: decimal("min_value", { precision: 15, scale: 2 }),
  maxValue: decimal("max_value", { precision: 15, scale: 2 }),
  pricePerSqm: decimal("price_per_sqm", { precision: 10, scale: 2 }),
  confidenceScore: integer("confidence_score"), // 0-100

  // AI Analysis
  marketAnalysis: text("market_analysis"),
  comparables: jsonb("comparables").$type<
    {
      address: string;
      price: number;
      area: number;
      soldDate?: string;
    }[]
  >(),
  trends: jsonb("trends").$type<{
    sixMonthChange: number;
    yearChange: number;
    forecast: string;
  }>(),

  // Tracking
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Types
export type Valuation = typeof valuations.$inferSelect;
export type NewValuation = typeof valuations.$inferInsert;
