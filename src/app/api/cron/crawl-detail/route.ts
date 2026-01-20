/**
 * CRON: Detay Crawler
 * Schedule: 08:00, 16:00, 00:00 (günde 3 kez)
 *
 * Detayı çekilmemiş ilanların detaylarını toplar.
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { sql } from "drizzle-orm";

const CRAWLER_API_URL = process.env.CRAWLER_API_URL || "http://localhost:8000";
const CRON_SECRET = process.env.CRON_SECRET;
const MAX_DETAILS_PER_RUN = 50;

export async function GET(request: NextRequest) {
  // Auth kontrolü
  const headersList = await headers();
  const authHeader = headersList.get("authorization");

  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  console.log("[CRON] Detay crawler başlatıldı:", new Date().toISOString());

  try {
    // Detayı çekilmemiş ilanları bul
    const pendingListings = await db.execute(sql`
      SELECT id, source_id, source_url 
      FROM collected_listings 
      WHERE description IS NULL 
        AND status = 'pending'
      ORDER BY crawled_at DESC
      LIMIT ${MAX_DETAILS_PER_RUN}
    `);

    if (!pendingListings || pendingListings.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Detay çekilecek ilan yok",
        processed: 0,
      });
    }

    console.log(
      `[CRON] ${pendingListings.length} ilan için detay çekilecek`
    );

    // Python detay crawler'ı çağır
    const response = await fetch(`${CRAWLER_API_URL}/detail-batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        maxListings: MAX_DETAILS_PER_RUN,
      }),
      signal: AbortSignal.timeout(240000), // 4 dakika
    });

    if (!response.ok) {
      throw new Error(`Crawler API hatası: ${response.status}`);
    }

    const data = await response.json();
    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log(
      `[CRON] Detay crawler tamamlandı: ${
        data.processed || 0
      } ilan, ${duration}s`
    );

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}s`,
      pending: pendingListings.length,
      processed: data.processed || 0,
      errors: data.errors || 0,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[CRON] Detay crawler hatası:", errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
