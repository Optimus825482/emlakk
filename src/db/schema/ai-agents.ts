import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const agentTypeEnum = pgEnum("agent_type", [
  "demir_agent",
  "miner_agent",
  "content_agent",
]);

export const chatStatusEnum = pgEnum("chat_status", [
  "active",
  "resolved",
  "escalated",
  "archived",
]);

export const contentStatusEnum = pgEnum("content_status", [
  "draft",
  "scheduled",
  "published",
  "failed",
]);

export const platformEnum = pgEnum("platform", [
  "instagram",
  "twitter",
  "linkedin",
  "facebook",
  "tiktok",
]);

export const scrapedListingStatusEnum = pgEnum("scraped_listing_status", [
  "new",
  "updated",
  "removed",
  "archived",
]);

// Chat Sessions - Demir Agent conversations
export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  visitorId: text("visitor_id").notNull(),
  visitorName: text("visitor_name"),
  visitorEmail: text("visitor_email"),
  visitorPhone: text("visitor_phone"),
  visitorLocation: text("visitor_location"),
  status: chatStatusEnum("status").default("active").notNull(),
  leadScore: integer("lead_score").default(0),
  sentiment: text("sentiment"), // positive, neutral, negative
  intentCategory: text("intent_category"), // buy, sell, rent, valuation, info
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Chat Messages
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .references(() => chatSessions.id, { onDelete: "cascade" })
    .notNull(),
  role: text("role").notNull(), // user, assistant, system
  content: text("content").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Scraped Listings - Miner Agent data
export const scrapedListings = pgTable("scraped_listings", {
  id: uuid("id").defaultRandom().primaryKey(),
  externalId: text("external_id").notNull(),
  source: text("source").notNull(), // sahibinden, hepsiemlak, emlakjet
  sourceUrl: text("source_url").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  price: integer("price"),
  currency: text("currency").default("TRY"),
  propertyType: text("property_type"), // arsa, daire, villa, tarla
  listingType: text("listing_type"), // sale, rent
  location: text("location"),
  city: text("city"),
  district: text("district"),
  neighborhood: text("neighborhood"),
  area: integer("area"), // m2
  roomCount: text("room_count"),
  features: jsonb("features").$type<string[]>(),
  images: jsonb("images").$type<string[]>(),
  sellerName: text("seller_name"),
  sellerPhone: text("seller_phone"),
  status: scrapedListingStatusEnum("status").default("new").notNull(),
  priceHistory:
    jsonb("price_history").$type<{ price: number; date: string }[]>(),
  firstSeenAt: timestamp("first_seen_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  removedAt: timestamp("removed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
