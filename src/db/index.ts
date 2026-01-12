import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Supabase pooler için optimize edilmiş connection
const queryClient = postgres(connectionString, {
  ssl: "require",
  max: 10, // Connection pool size
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, { schema });

// Export schema for use in other files
export { schema };
