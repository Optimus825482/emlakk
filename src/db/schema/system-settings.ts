import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";

// AI Provider Enum
export const aiProviderEnum = pgEnum("ai_provider", [
  "deepseek",
  "openai",
  "anthropic",
  "google-gemini",
  "openrouter",
]);

// System Settings - AI ve sistem yapılandırması
export const systemSettings = pgTable("system_settings", {
  id: uuid("id").defaultRandom().primaryKey(),

  // AI Yapılandırması
  aiProvider: aiProviderEnum("ai_provider").notNull().default("deepseek"),
  aiModel: varchar("ai_model", { length: 100 })
    .notNull()
    .default("deepseek-chat"),
  aiApiKey: text("ai_api_key"), // Şifrelenmiş olarak saklanacak
  aiApiKeyValid: boolean("ai_api_key_valid").default(false),
  aiApiKeyLastChecked: timestamp("ai_api_key_last_checked"),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Types
export type SystemSettings = typeof systemSettings.$inferSelect;
export type NewSystemSettings = typeof systemSettings.$inferInsert;
export type AIProvider =
  | "deepseek"
  | "openai"
  | "anthropic"
  | "google-gemini"
  | "openrouter";
