/**
 * CRON: Liste Crawler
 * Schedule: 06:00, 14:00, 22:00 (günde 3 kez)
 *
 * Tüm kategorileri sırayla tarar ve yeni ilanları toplar.
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

const CRAWLER_API_URL = process.env.CRAWLER_API_URL || "http://localhost:8000";
const CRON_SECRET = process.env.CRON_SECRET;

// Kategoriler ve öncelikleri
const CATEGORIES = [
  {
    key: "konut_satilik",
    category: "konut",
    transaction: "satilik",
    maxPages: 10,
  },
  {
    key: "arsa_satilik",
    category: "arsa",
    transaction: "satilik",
    maxPages: 5,
  },
  {
    key: "konut_kiralik",
    category: "konut",
    transaction: "kiralik",
    maxPages: 5,
  },
  {
    key: "isyeri_satilik",
    category: "isyeri",
    transaction: "satilik",
    maxPages: 3,
  },
  {
    key: "isyeri_kiralik",
    category: "isyeri",
    transaction: "kiralik",
    maxPages: 3,
  },
];

export async function GET(request: NextRequest) {
  // Vercel Cron auth kontrolü
  const headersList = await headers();
  const authHeader = headersList.get("authorization");

  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const results: Array<{
    category: string;
    success: boolean;
    found?: number;
    saved?: number;
    error?: string;
  }> = [];

  console.log("[CRON] Liste crawler başlatıldı:", new Date().toISOString());

  for (const cat of CATEGORIES) {
    try {
      const response = await fetch(`${CRAWLER_API_URL}/crawl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: cat.key,
          maxPages: cat.maxPages,
        }),
        signal: AbortSignal.timeout(120000), // 2 dakika timeout per category
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      results.push({
        category: cat.key,
        success: true,
        found: data.total || 0,
        saved: data.new_count || 0,
      });

      console.log(`[CRON] ${cat.key}: ${data.new_count || 0} yeni ilan`);

      // Kategoriler arası bekleme (rate limiting)
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      results.push({
        category: cat.key,
        success: false,
        error: errorMessage,
      });
      console.error(`[CRON] ${cat.key} hatası:`, errorMessage);
    }
  }

  const duration = Math.round((Date.now() - startTime) / 1000);
  const totalSaved = results.reduce((sum, r) => sum + (r.saved || 0), 0);
  const failedCount = results.filter((r) => !r.success).length;

  console.log(
    `[CRON] Liste crawler tamamlandı: ${totalSaved} yeni ilan, ${duration}s, ${failedCount} hata`
  );

  return NextResponse.json({
    success: failedCount === 0,
    timestamp: new Date().toISOString(),
    duration: `${duration}s`,
    totalSaved,
    failedCategories: failedCount,
    results,
  });
}

// POST da destekle (manuel tetikleme için)
export async function POST(request: NextRequest) {
  return GET(request);
}
