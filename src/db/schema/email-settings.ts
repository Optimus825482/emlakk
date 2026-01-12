import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";

// SMTP Encryption Enum
export const smtpEncryptionEnum = pgEnum("smtp_encryption", [
  "none",
  "ssl",
  "tls",
]);

// E-posta Ayarları (SMTP)
export const emailSettings = pgTable("email_settings", {
  id: uuid("id").defaultRandom().primaryKey(),

  // SMTP Sunucu Ayarları
  smtpHost: varchar("smtp_host", { length: 255 }),
  smtpPort: integer("smtp_port").default(587),
  smtpEncryption: smtpEncryptionEnum("smtp_encryption").default("tls"),
  smtpUsername: varchar("smtp_username", { length: 255 }),
  smtpPassword: text("smtp_password"), // Şifrelenmiş saklanmalı

  // Gönderici Bilgileri
  fromEmail: varchar("from_email", { length: 255 }),
  fromName: varchar("from_name", { length: 255 }).default("Demir Gayrimenkul"),
  replyToEmail: varchar("reply_to_email", { length: 255 }),

  // Durum
  isActive: boolean("is_active").notNull().default(false),
  isVerified: boolean("is_verified").notNull().default(false),
  lastTestedAt: timestamp("last_tested_at"),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Types
export type EmailSettings = typeof emailSettings.$inferSelect;
export type NewEmailSettings = typeof emailSettings.$inferInsert;
