import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { Sql } from "postgres";
import * as schema from "./schema";
import { env } from "@/lib/env";

const globalForDb = globalThis as unknown as {
  queryClient: Sql | undefined;
};

// Localhost için SSL kapalı, uzak sunucu için de kapalı (self-signed cert sorunu)
const requireSSL = false;

const queryClient =
  globalForDb.queryClient ??
  postgres(env.DATABASE_URL, {
    ssl: requireSSL,
    max: 10,
    idle_timeout: 20,
    connect_timeout: 60,
    max_lifetime: 60 * 10,
    prepare: false,
    connection: {
      application_name: "demir-gayrimenkul-nextjs",
    },
  });

if (env.NODE_ENV !== "production") {
  globalForDb.queryClient = queryClient;
}

// Graceful shutdown - only in Node.js runtime (not Edge)
if (typeof process !== "undefined" && process.on) {
  const shutdown = async () => {
    if (globalForDb.queryClient) {
      await globalForDb.queryClient.end();
      process.exit(0);
    }
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

export const db = drizzle(queryClient, { schema });
export { schema };
