import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  boolean,
  integer,
  decimal,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const listingTypeEnum = pgEnum("listing_type", [
  "sanayi",
  "tarim",
  "konut",
  "ticari",
  "arsa",
]);

export const listingStatusEnum = pgEnum("listing_status", [
  "active",
  "sold",
  "pending",
  "draft",
]);

export const transactionTypeEnum = pgEnum("transaction_type", ["sale", "rent"]);

// Main listings table
export const listings = pgTable("listings", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Basic info
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),

  // Type & Status
  type: listingTypeEnum("type").notNull(),
  status: listingStatusEnum("status").notNull().default("draft"),
  transactionType: transactionTypeEnum("transaction_type")
    .notNull()
    .default("sale"),

  // Location
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull().default("Hendek"),
  district: varchar("district", { length: 100 }),
  neighborhood: varchar("neighborhood", { length: 100 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),

  // Property details
  area: integer("area").notNull(), // m²
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  pricePerSqm: decimal("price_per_sqm", { precision: 10, scale: 2 }),

  // Additional details (JSON for flexibility)
  features: jsonb("features").$type<{
    rooms?: string;
    bathrooms?: number;
    floors?: number;
    buildingAge?: number;
    heating?: string;
    parking?: boolean;
    garden?: boolean;
    pool?: boolean;
    furnished?: boolean;
    // Sanayi specific
    infrastructure?: boolean;
    roadAccess?: string;
    // Tarım specific
    treeCount?: number;
    soilType?: string;
    irrigation?: boolean;
    organic?: boolean;
    // Konut specific
    elevator?: boolean;
    security?: boolean;
  }>(),

  // AI Insights
  aiScore: integer("ai_score"), // 0-100
  aiInsight: text("ai_insight"),
  roiEstimate: decimal("roi_estimate", { precision: 5, scale: 2 }),

  // Media
  images: jsonb("images").$type<string[]>().default([]),
  thumbnail: text("thumbnail"),
  videoUrl: text("video_url"),

  // SEO & Meta
  metaTitle: varchar("meta_title", { length: 255 }),
  metaDescription: text("meta_description"),

  // Flags
  isFeatured: boolean("is_featured").notNull().default(false),
  isNew: boolean("is_new").notNull().default(true),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  publishedAt: timestamp("published_at"),
  soldAt: timestamp("sold_at"),
});

// Listing views for analytics
export const listingViews = pgTable("listing_views", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const listingsRelations = relations(listings, ({ many }) => ({
  views: many(listingViews),
}));

export const listingViewsRelations = relations(listingViews, ({ one }) => ({
  listing: one(listings, {
    fields: [listingViews.listingId],
    references: [listings.id],
  }),
}));

// Types
export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;
export type ListingType = "sanayi" | "tarim" | "konut" | "ticari" | "arsa";
export type ListingStatus = "active" | "sold" | "pending" | "draft";
