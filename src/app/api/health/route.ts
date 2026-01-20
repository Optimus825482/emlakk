import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { checkCrawlerHealth } from "@/lib/monitoring";

export async function GET() {
  const status: Record<string, any> = {
    timestamp: new Date().toISOString(),
    services: {
      database: "unknown",
      crawler: "unknown",
    },
  };

  try {
    await db.execute(sql`SELECT 1`);
    status.services.database = "healthy";
  } catch (error) {
    status.services.database = "unhealthy";
    status.services.dbError = error instanceof Error ? error.message : "Unknown";
  }

  const crawlerHealth = await checkCrawlerHealth();
  status.services.crawler = crawlerHealth.healthy ? "healthy" : "unhealthy";
  status.services.crawlerDetails = crawlerHealth.details;

  const isHealthy = status.services.database === "healthy" && status.services.crawler === "healthy";

  return NextResponse.json(status, {
    status: isHealthy ? 200 : 503,
  });
}
