/**
 * CRON: İlan Doğrulama
 * Schedule: 04:00 (günde 1 kez)
 *
 * Aktif ilanların hala Sahibinden'de olup olmadığını kontrol eder.
 * Kaldırılmış ilanları "removed" olarak işaretler.
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { collectedListings } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

const CRON_SECRET = process.env.CRON_SECRET;
const MAX_VERIFY_PER_RUN = 100;
const VERIFY_DELAY_MS = 2000; // Rate limiting

export async function GET(_request: NextRequest) {
  // Auth kontrolü
  const headersList = await headers();
  const authHeader = headersList.get("authorization");

  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  console.log("[CRON] İlan doğrulama başlatıldı:", new Date().toISOString());

  let verified = 0;
  let removed = 0;
  let errors = 0;

  try {
    // Doğrulanacak ilanları al (pending veya approved, son 7 günde doğrulanmamış)
    const listings = await db
      .select({
        id: collectedListings.id,
        sourceUrl: collectedListings.sourceUrl,
        sourceId: collectedListings.sourceId,
      })
      .from(collectedListings)
      .where(
        and(
          sql`${collectedListings.status} IN ('pending', 'approved')`,
          sql`(${collectedListings.processedAt} IS NULL OR ${collectedListings.processedAt} < NOW() - INTERVAL '7 days')`
        )
      )
      .limit(MAX_VERIFY_PER_RUN);

    console.log(`[CRON] ${listings.length} ilan doğrulanacak`);

    for (const listing of listings) {
      try {
        // HEAD request ile kontrol (daha hızlı)
        const response = await fetch(listing.sourceUrl, {
          method: "HEAD",
          signal: AbortSignal.timeout(10000),
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });

        if (
          response.status === 404 ||
          response.status === 410 ||
          response.status === 301
        ) {
          // İlan kaldırılmış
          await db
            .update(collectedListings)
            .set({
              status: "rejected",
              notes: `İlan sahibinden.com'dan kaldırılmış (HTTP ${response.status})`,
              processedAt: new Date(),
            })
            .where(eq(collectedListings.id, listing.id));

          removed++;
          console.log(`[CRON] Kaldırılmış: ${listing.sourceId}`);
        } else {
          // İlan hala aktif
          await db
            .update(collectedListings)
            .set({ processedAt: new Date() })
            .where(eq(collectedListings.id, listing.id));

          verified++;
        }

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, VERIFY_DELAY_MS));
      } catch (error) {
        errors++;
        console.error(`[CRON] Doğrulama hatası (${listing.sourceId}):`, error);
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(
      `[CRON] İlan doğrulama tamamlandı: ${verified} aktif, ${removed} kaldırılmış, ${errors} hata, ${duration}s`
    );

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}s`,
      checked: listings.length,
      verified,
      removed,
      errors,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[CRON] İlan doğrulama hatası:", errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
