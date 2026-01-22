import {
  pgTable,
  text,
  uuid,
  timestamp,
  unique,
  integer,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const neighborhoods = pgTable(
  "neighborhoods",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    district: text("district").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    unq: unique().on(t.district, t.name),
  }),
);

// Note: Views are not directly supported in Drizzle schema definitions for migration generation efficiently yet in all versions,
// but we can define the Typescript type or just use raw SQL for the view.
// For now, we store the physical table definition.
