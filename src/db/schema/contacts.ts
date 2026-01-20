import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  boolean,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { listings } from "./listings";

// Enums
export const contactStatusEnum = pgEnum("contact_status", [
  "new",
  "read",
  "replied",
  "archived",
]);

export const contactSourceEnum = pgEnum("contact_source", [
  "website",
  "listing",
  "valuation",
  "whatsapp",
  "phone",
]);

// Contact messages table
export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Contact info
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),

    // Message
    subject: varchar("subject", { length: 255 }),
    message: text("message").notNull(),

    // Source & Status
    source: contactSourceEnum("source").notNull().default("website"),
    status: contactStatusEnum("status").notNull().default("new"),

    // Related listing (optional)
    listingId: uuid("listing_id").references(() => listings.id, {
      onDelete: "set null",
    }),

    // Admin response
    adminReply: text("admin_reply"),
    repliedAt: timestamp("replied_at"),

    // Tracking
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),

    // Flags
    isSpam: boolean("is_spam").notNull().default(false),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("contacts_status_idx").on(table.status),
    index("contacts_created_at_idx").on(table.createdAt),
  ],
);

// Relations
export const contactsRelations = relations(contacts, ({ one }) => ({
  listing: one(listings, {
    fields: [contacts.listingId],
    references: [listings.id],
  }),
}));

// Types
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type ContactStatus = "new" | "read" | "replied" | "archived";
