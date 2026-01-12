import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { listings } from "./listings";
import { contentStatusEnum, platformEnum } from "./ai-agents";

// Content Calendar - Content Agent scheduling
export const contentCalendar = pgTable("content_calendar", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id").references(() => listings.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  platform: platformEnum("platform").notNull(),
  status: contentStatusEnum("status").default("draft").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  seoTags: jsonb("seo_tags").$type<string[]>(),
  hashtags: jsonb("hashtags").$type<string[]>(),
  mediaUrls: jsonb("media_urls").$type<string[]>(),
  aiGenerated: boolean("ai_generated").default(true),
  engagementMetrics: jsonb("engagement_metrics").$type<{
    likes?: number;
    comments?: number;
    shares?: number;
    views?: number;
    clicks?: number;
  }>(),
  externalPostId: text("external_post_id"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Market Alerts - Miner Agent alerts
export const marketAlerts = pgTable("market_alerts", {
  id: uuid("id").defaultRandom().primaryKey(),
  alertType: text("alert_type").notNull(), // new_listing, price_drop, price_increase, removed
  title: text("title").notNull(),
  description: text("description"),
  scrapedListingId: uuid("scraped_listing_id"),
  severity: text("severity").default("info"), // info, warning, critical
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Agent Tasks - Background job tracking
export const agentTasks = pgTable("agent_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  agentType: text("agent_type").notNull(), // demir_agent, miner_agent, content_agent
  taskType: text("task_type").notNull(),
  status: text("status").default("pending").notNull(), // pending, running, completed, failed
  input: jsonb("input").$type<Record<string, unknown>>(),
  output: jsonb("output").$type<Record<string, unknown>>(),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Visitor Analytics - For Demir Agent insights
export const visitorAnalytics = pgTable("visitor_analytics", {
  id: uuid("id").defaultRandom().primaryKey(),
  visitorId: text("visitor_id").notNull(),
  sessionId: text("session_id"),
  pageUrl: text("page_url").notNull(),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  country: text("country"),
  city: text("city"),
  device: text("device"), // desktop, mobile, tablet
  browser: text("browser"),
  searchQuery: text("search_query"),
  listingViewed: uuid("listing_viewed"),
  timeOnPage: integer("time_on_page"), // seconds
  actions: jsonb("actions").$type<{ type: string; timestamp: string }[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const contentCalendarRelations = relations(
  contentCalendar,
  ({ one }) => ({
    listing: one(listings, {
      fields: [contentCalendar.listingId],
      references: [listings.id],
    }),
  })
);
