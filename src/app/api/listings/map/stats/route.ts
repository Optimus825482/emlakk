import { db } from "@/db";
import { sahibindenListe } from "@/db/schema/crawler";
import { sql, and, gte, lte } from "drizzle-orm";
import { NextResponse } from "next/server";

// ============================================
// CACHE (Simple In-Memory)
// ============================================

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: string): unknown | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: unknown, ttlMs: number): void {
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }
}

const statsCache = new SimpleCache(20);

// ============================================
// STATS ENDPOINT
// ============================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bounds = {
      swLat: searchParams.get("swLat"),
      neLat: searchParams.get("neLat"),
      swLng: searchParams.get("swLng"),
      neLng: searchParams.get("neLng"),
    };
    const noCache = searchParams.get("noCache") === "true";

    // Check cache
    const cacheKey = `stats:${JSON.stringify(bounds)}`;
    if (!noCache) {
      const cached = statsCache.get(cacheKey);
      if (cached) {
        return NextResponse.json({
          ...cached,
          cached: true,
        });
      }
    }

    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sahibindenListe);
    const totalCount = totalCountResult[0]?.count || 0;

    // Get price stats
    const priceStatsResult = await db
      .select({
        min: sql<number>`min(${sahibindenListe.fiyat})::int`,
        max: sql<number>`max(${sahibindenListe.fiyat})::int`,
        avg: sql<number>`avg(${sahibindenListe.fiyat})::int`,
      })
      .from(sahibindenListe);
    const priceStats = priceStatsResult[0] || { min: 0, max: 0, avg: 0 };

    // Get category breakdown
    const categoryBreakdown = await db
      .select({
        category: sahibindenListe.category,
        count: sql<number>`count(*)::int`,
      })
      .from(sahibindenListe)
      .groupBy(sahibindenListe.category);

    // Get transaction type breakdown
    const transactionBreakdown = await db
      .select({
        transaction: sahibindenListe.transaction,
        count: sql<number>`count(*)::int`,
      })
      .from(sahibindenListe)
      .groupBy(sahibindenListe.transaction);

    // Get listings with coordinates
    const withCoordsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sahibindenListe)
      .where(sql`${sahibindenListe.koordinatlar} is not null`);
    const withCoords = withCoordsResult[0]?.count || 0;

    // Get listings by district (ilce)
    const districtBreakdown = await db
      .select({
        district: sahibindenListe.ilce,
        count: sql<number>`count(*)::int`,
        avgPrice: sql<number>`avg(${sahibindenListe.fiyat})::int`,
      })
      .from(sahibindenListe)
      .where(sql`${sahibindenListe.ilce} is not null`)
      .groupBy(sahibindenListe.ilce)
      .orderBy(sql`count(*) desc`)
      .limit(10);

    // Calculate price distribution
    const priceRanges = [
      { label: "0 - 1M", min: 0, max: 1000000 },
      { label: "1M - 5M", min: 1000000, max: 5000000 },
      { label: "5M - 10M", min: 5000000, max: 10000000 },
      { label: "10M - 20M", min: 10000000, max: 20000000 },
      { label: "20M+", min: 20000000, max: null },
    ];

    const priceDistribution = await Promise.all(
      priceRanges.map(async (range) => {
        const conditions = [gte(sahibindenListe.fiyat, range.min)];
        if (range.max !== null) {
          conditions.push(lte(sahibindenListe.fiyat, range.max));
        }

        const result = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(sahibindenListe)
          .where(and(...conditions));

        return {
          label: range.label,
          count: result[0]?.count || 0,
        };
      })
    );

    const response = {
      total: totalCount,
      withCoordinates: withCoords,
      withoutCoordinates: totalCount - withCoords,
      priceStats: {
        min: priceStats.min || 0,
        max: priceStats.max || 0,
        avg: priceStats.avg || 0,
      },
      priceDistribution,
      categoryBreakdown,
      transactionBreakdown,
      districtBreakdown,
      timestamp: Date.now(),
    };

    // Cache result
    if (!noCache) {
      statsCache.set(cacheKey, response, 1000 * 60 * 15);
    }

    return NextResponse.json({
      ...response,
      cached: false,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
