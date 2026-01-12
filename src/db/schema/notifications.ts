import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";

// Bildirim Tipi Enum
export const notificationTypeEnum = pgEnum("notification_type", [
  "appointment",
  "contact",
  "valuation",
  "listing",
  "system",
]);

// Admin Bildirimleri
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Bildirim içeriği
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),

  // İlişkili kayıt
  entityType: varchar("entity_type", { length: 50 }), // appointment, contact, valuation, listing
  entityId: uuid("entity_id"),

  // Durum
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Types
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
