import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { log, captureError } from "@/lib/monitoring";
import { env } from "@/lib/env";

const RETENTION_DAYS = 30;

export async function GET(request: NextRequest) {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");

  if (env.CRON_SECRET && authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  log("info", "Temizlik başlatıldı", { module: "cron-cleanup" });

  const results = {
    deletedRejected: 0,
    deletedDuplicates: 0,
    deletedOldLogs: 0,
  };

  try {
    const rejectedResult = await db.execute(sql`
      DELETE FROM collected_listings 
      WHERE status = 'rejected' 
        AND processed_at < NOW() - INTERVAL '30 days'
      RETURNING id
    `);
    results.deletedRejected = rejectedResult.length;
    
    const duplicateResult = await db.execute(sql`
      DELETE FROM collected_listings a
      USING collected_listings b
      WHERE a.source_id = b.source_id
        AND a.crawled_at < b.crawled_at
        AND a.id != b.id
      RETURNING a.id
    `);
    results.deletedDuplicates = duplicateResult.length;

    const logsResult = await db.execute(sql`
      DELETE FROM mining_logs 
      WHERE created_at < NOW() - INTERVAL '30 days'
      RETURNING id
    `);
    results.deletedOldLogs = logsResult.length;

    const statsResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE description IS NOT NULL) as with_details
      FROM collected_listings
    `);

    const duration = Math.round((Date.now() - startTime) / 1000);
    log("info", "Temizlik tamamlandı", { 
      module: "cron-cleanup", 
      duration,
      results 
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}s`,
      cleaned: results,
      stats: statsResult[0] || {},
    });
  } catch (error) {
    if (error instanceof Error) {
      await captureError(error, { module: "cron-cleanup" });
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
