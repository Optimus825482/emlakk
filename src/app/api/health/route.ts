import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  const status: Record<string, any> = {
    timestamp: new Date().toISOString(),
    services: {
      database: "unknown",
    },
  };

  try {
    await db.execute(sql`SELECT 1`);
    status.services.database = "healthy";
  } catch (error) {
    status.services.database = "unhealthy";
    status.services.dbError =
      error instanceof Error ? error.message : "Unknown";
  }

  const isHealthy = status.services.database === "healthy";

  return NextResponse.json(status, {
    status: isHealthy ? 200 : 503,
  });
}
