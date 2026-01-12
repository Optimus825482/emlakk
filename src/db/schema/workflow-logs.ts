import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

// Workflow Status Enum
export const workflowStatusEnum = pgEnum("workflow_status", [
  "pending",
  "running",
  "completed",
  "failed",
]);

// Workflow Logs - Workflow çalışma kayıtları
export const workflowLogs = pgTable("workflow_logs", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Workflow bilgileri
  workflowName: varchar("workflow_name", { length: 100 }).notNull(),
  workflowId: varchar("workflow_id", { length: 255 }), // Workflow DevKit run ID
  status: workflowStatusEnum("status").notNull().default("pending"),

  // İlişkili kayıt
  entityType: varchar("entity_type", { length: 50 }), // appointment, valuation, listing
  entityId: uuid("entity_id"),

  // Sonuç
  result: jsonb("result").$type<Record<string, unknown>>(),
  error: text("error"),

  // Timestamps
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Types
export type WorkflowLog = typeof workflowLogs.$inferSelect;
export type NewWorkflowLog = typeof workflowLogs.$inferInsert;
