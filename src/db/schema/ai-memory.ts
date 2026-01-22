import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  integer,
  timestamp,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

// AI Memory Store (Long-term Memory)
export const aiMemory = pgTable(
  "ai_memory",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Memory Type
    memoryType: varchar("memory_type", { length: 50 }).notNull(),
    category: varchar("category", { length: 100 }),

    // Content
    content: text("content").notNull(),
    summary: text("summary"),
    // embedding: vector("embedding", { dimensions: 1536 }), // pgvector

    // Context
    context: jsonb("context").$type<Record<string, unknown>>().default({}),
    tags: text("tags").array().default([]),

    // Importance & Retention
    importanceScore: integer("importance_score").default(50),
    accessCount: integer("access_count").default(0),
    lastAccessedAt: timestamp("last_accessed_at"),

    // Relations
    relatedMemoryIds: uuid("related_memory_ids").array().default([]),
    sourceType: varchar("source_type", { length: 50 }),
    sourceId: uuid("source_id"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at"),
  },
  (table) => [
    index("ai_memory_type_idx").on(table.memoryType),
    index("ai_memory_category_idx").on(table.category),
    index("ai_memory_importance_idx").on(table.importanceScore),
    index("ai_memory_created_at_idx").on(table.createdAt),
  ],
);

// AI Conversations (Working Memory)
export const aiConversations = pgTable(
  "ai_conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Session Info
    sessionId: varchar("session_id", { length: 255 }).notNull(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),

    // Conversation Data
    messages: jsonb("messages")
      .$type<Array<{ role: string; content: string; timestamp: string }>>()
      .notNull()
      .default([]),
    context: jsonb("context").$type<Record<string, unknown>>().default({}),

    // Agent Info
    agentType: varchar("agent_type", { length: 50 }).notNull(),

    // Metadata
    totalMessages: integer("total_messages").default(0),
    lastMessageAt: timestamp("last_message_at").defaultNow(),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("ai_conversations_session_idx").on(table.sessionId),
    index("ai_conversations_user_idx").on(table.userId),
    index("ai_conversations_agent_idx").on(table.agentType),
  ],
);

// AI Tasks
export const aiTasks = pgTable(
  "ai_tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Task Info
    agentType: varchar("agent_type", { length: 50 }).notNull(),
    taskType: varchar("task_type", { length: 100 }).notNull(),

    // Input/Output
    input: jsonb("input").$type<Record<string, unknown>>().notNull(),
    output: jsonb("output").$type<Record<string, unknown>>(),

    // Status
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    error: text("error"),

    // Performance
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    durationMs: integer("duration_ms"),

    // Context
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    relatedEntityType: varchar("related_entity_type", { length: 50 }),
    relatedEntityId: uuid("related_entity_id"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("ai_tasks_agent_type_idx").on(table.agentType),
    index("ai_tasks_status_idx").on(table.status),
    index("ai_tasks_created_at_idx").on(table.createdAt),
  ],
);

// AI Agent Logs
export const aiAgentLogs = pgTable(
  "ai_agent_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Agent Info
    agentType: varchar("agent_type", { length: 50 }).notNull(),
    action: varchar("action", { length: 100 }).notNull(),

    // Data
    input: jsonb("input").$type<Record<string, unknown>>(),
    output: jsonb("output").$type<Record<string, unknown>>(),

    // Performance
    durationMs: integer("duration_ms"),
    success: boolean("success").default(true),
    error: text("error"),

    // Context
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    sessionId: varchar("session_id", { length: 255 }),

    // Timestamp
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("ai_agent_logs_agent_idx").on(table.agentType),
    index("ai_agent_logs_created_at_idx").on(table.createdAt),
    index("ai_agent_logs_success_idx").on(table.success),
  ],
);

// Command History
export const commandHistory = pgTable(
  "command_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // User Info
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Command
    command: text("command").notNull(),
    parameters: jsonb("parameters")
      .$type<Record<string, unknown>>()
      .default({}),

    // Result
    result: jsonb("result").$type<Record<string, unknown>>(),
    success: boolean("success").default(true),
    error: text("error"),

    // Performance
    executedAt: timestamp("executed_at").notNull().defaultNow(),
    durationMs: integer("duration_ms"),

    // Context
    pageUrl: text("page_url"),
    context: jsonb("context").$type<Record<string, unknown>>().default({}),
  },
  (table) => [
    index("command_history_user_idx").on(table.userId),
    index("command_history_executed_at_idx").on(table.executedAt),
  ],
);

// AI Insights Cache
export const aiInsightsCache = pgTable(
  "ai_insights_cache",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Cache Key
    cacheKey: varchar("cache_key", { length: 255 }).notNull().unique(),

    // Data
    insightType: varchar("insight_type", { length: 100 }).notNull(),
    data: jsonb("data").$type<Record<string, unknown>>().notNull(),

    // Metadata
    generatedAt: timestamp("generated_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at").notNull(),
    hitCount: integer("hit_count").default(0),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("ai_insights_cache_key_idx").on(table.cacheKey),
    index("ai_insights_cache_expires_idx").on(table.expiresAt),
  ],
);

// Types
export type AIMemory = typeof aiMemory.$inferSelect;
export type NewAIMemory = typeof aiMemory.$inferInsert;

export type AIConversation = typeof aiConversations.$inferSelect;
export type NewAIConversation = typeof aiConversations.$inferInsert;

export type AITask = typeof aiTasks.$inferSelect;
export type NewAITask = typeof aiTasks.$inferInsert;

export type AIAgentLog = typeof aiAgentLogs.$inferSelect;
export type NewAIAgentLog = typeof aiAgentLogs.$inferInsert;

export type CommandHistory = typeof commandHistory.$inferSelect;
export type NewCommandHistory = typeof commandHistory.$inferInsert;

export type AIInsightsCache = typeof aiInsightsCache.$inferSelect;
export type NewAIInsightsCache = typeof aiInsightsCache.$inferInsert;
