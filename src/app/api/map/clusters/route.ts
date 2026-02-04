import { db } from "@/db";
import { sahibindenListe } from "@/db/schema/crawler";
import { and, sql, gte, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { withAdminRateLimit } from "@/lib/api-auth";
import { z } from "zod";

// ============================================
// ZOD VALIDATION
// ============================================

const MapClustersQuerySchema = z.object({
  swLat: z.coerce.number().min(-90).max(90),
  neLat: z.coerce.number().min(-90).max(90),
  swLng: z.coerce.number().min(-180).max(180),
  neLng: z.coerce.number().min(-180).max(180),
  zoom: z.coerce.number().min(1).max(20).default(10),
  gridSize: z.coerce.number().positive().optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
});

// ============================================
// TYPES
// ============================================

interface Cluster {
  position: {
    lat: number;
    lng: number;
  };
  count: number;
  bounds: {
    swLat: number;
    neLat: number;
    swLng: number;
    neLng: number;
  };
  prices: {
    min: number;
    max: number;
    avg: number;
  };
}

interface MapClustersResponse {
  clusters: Cluster[];
  cached: boolean;
  timestamp: number;
}

// ============================================
// GRID CLUSTERING
// ============================================

function getGridSize(zoom: number): number {
  const baseGridSize = 0.01;
  return baseGridSize / Math.pow(2, zoom - 10);
}

function getCellKey(lat: number, lng: number, gridSize: number): string {
  const latCell = Math.floor(lat / gridSize);
  const lngCell = Math.floor(lng / gridSize);
  return `${latCell}:${lngCell}`;
}

function getCellBounds(cellKey: string, gridSize: number) {
  const [latCell, lngCell] = cellKey.split(":").map(Number);
  return {
    swLat: latCell * gridSize,
    neLat: (latCell + 1) * gridSize,
    swLng: lngCell * gridSize,
    neLng: (lngCell + 1) * gridSize,
  };
}

// ============================================
// CACHE
// ============================================

interface CacheEntry {
  data: MapClustersResponse;
  expiresAt: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: string): MapClustersResponse | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: MapClustersResponse, ttlMs: number): void {
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

const clusterCache = new SimpleCache(50);

// ============================================
// GET /api/map/clusters
// ============================================

export const GET = withAdminRateLimit(
  async (request) => {
    try {
      const { searchParams } = new URL(request.url);
      const rawParams = Object.fromEntries(searchParams.entries());

      // Validate
      const validationResult = MapClustersQuerySchema.safeParse(rawParams);
      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: "Geçersiz parametreler",
            details: validationResult.error.flatten(),
          },
          { status: 400 }
        );
      }

      const params = validationResult.data;
      const gridSize = params.gridSize || getGridSize(params.zoom);

      // Check cache
      const cacheKey = `clusters:${JSON.stringify(rawParams)}`;
      const cached = clusterCache.get(cacheKey);
      if (cached) {
        return NextResponse.json({
          ...cached,
          cached: true,
        });
      }

      // Build conditions
      const conditions: any[] = [];
      if (params.category) {
        conditions.push(sql`${sahibindenListe.category} = ${params.category}`);
      }
      if (params.minPrice !== undefined) {
        conditions.push(gte(sahibindenListe.fiyat, params.minPrice));
      }
      if (params.maxPrice !== undefined) {
        conditions.push(lte(sahibindenListe.fiyat, params.maxPrice));
      }

      // Query
      const query = db
        .select({
          id: sahibindenListe.id,
          fiyat: sahibindenListe.fiyat,
          koordinatlar: sahibindenListe.koordinatlar,
          konum: sahibindenListe.konum,
        })
        .from(sahibindenListe)
        .limit(5000);

      if (conditions.length > 0) {
        query.where(and(...conditions));
      }

      const listings = await query;

      // Cluster
      const cellMap = new Map<string, {
        count: number;
        prices: number[];
        latSum: number;
        lngSum: number;
      }>();

      listings.forEach((listing) => {
        let lat: number | null = null;
        let lng: number | null = null;

        if (listing.koordinatlar?.lat && listing.koordinatlar?.lng) {
          lat = parseFloat(listing.koordinatlar.lat);
          lng = parseFloat(listing.koordinatlar.lng);
        }

        if (lat === null || lng === null) return;

        // Bounds check
        if (
          lat < params.swLat ||
          lat > params.neLat ||
          lng < params.swLng ||
          lng > params.neLng
        ) {
          return;
        }

        const cellKey = getCellKey(lat, lng, gridSize);

        if (!cellMap.has(cellKey)) {
          cellMap.set(cellKey, {
            count: 0,
            prices: [],
            latSum: 0,
            lngSum: 0,
          });
        }

        const cell = cellMap.get(cellKey)!;
        cell.count++;
        cell.prices.push(listing.fiyat || 0);
        cell.latSum += lat;
        cell.lngSum += lng;
      });

      // Build clusters
      const clusters: Cluster[] = [];
      cellMap.forEach((cell, cellKey) => {
        const prices = cell.prices.filter((p) => p > 0).sort((a, b) => a - b);
        const bounds = getCellBounds(cellKey, gridSize);

        clusters.push({
          position: {
            lat: cell.latSum / cell.count,
            lng: cell.lngSum / cell.count,
          },
          count: cell.count,
          bounds,
          prices: {
            min: prices[0] || 0,
            max: prices[prices.length - 1] || 0,
            avg: prices.length > 0
              ? Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length)
              : 0,
          },
        });
      });

      const response: MapClustersResponse = {
        clusters,
        cached: false,
        timestamp: Date.now(),
      };

      // Cache
      clusterCache.set(cacheKey, response, 1000 * 60 * 10);

      return NextResponse.json(response);
    } catch (error) {
      console.error("Map clusters API error:", error);
      return NextResponse.json(
        { error: "Bir hata oluştu" },
        { status: 500 }
      );
    }
  },
  100
);
