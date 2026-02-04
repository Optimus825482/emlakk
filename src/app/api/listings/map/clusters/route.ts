import { db } from "@/db";
import { sahibindenListe } from "@/db/schema/crawler";
import { and, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

// ============================================
// TYPES
// ============================================

interface ClusterParams {
  swLat: string; // South-West Latitude
  neLat: string; // North-East Latitude
  swLng: string; // South-West Longitude
  neLng: string; // North-East Longitude
  zoom: string; // Zoom level (1-20)
  gridSize?: string; // Grid cell size in degrees (optional, auto-calculated from zoom)
  category?: string;
  transaction?: string;
  minPrice?: string;
  maxPrice?: string;
}

interface Cluster {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  prices: {
    min: number;
    max: number;
    avg: number;
  };
  categories: Record<string, number>;
  sampleIds: string[];
}

// ============================================
// CACHE (Simple In-Memory)
// ============================================

interface CacheEntry {
  data: Cluster[];
  expiresAt: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: string): Cluster[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: Cluster[], ttlMs: number): void {
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

function getCacheKey(params: any): string {
  return `cluster:${JSON.stringify(params)}`;
}

// ============================================
// GRID CLUSTERING ALGORITHM
// ============================================

/**
 * Grid-based clustering for map markers
 * @param zoom - Map zoom level (1-20)
 * @returns Grid cell size in degrees
 */
function getGridSize(zoom: number): number {
  // Zoom level başına grid boyutu (daha yüksek zoom = daha küçük grid)
  const baseGridSize = 0.01; // ~1km at equator
  return baseGridSize / Math.pow(2, zoom - 10);
}

/**
 * Convert lat/lng to grid cell key
 */
function getCellKey(lat: number, lng: number, gridSize: number): string {
  const latCell = Math.floor(lat / gridSize);
  const lngCell = Math.floor(lng / gridSize);
  return `${latCell}:${lngCell}`;
}

/**
 * Get cluster center from cell key
 */
function getCellCenter(
  cellKey: string,
  gridSize: number,
): { lat: number; lng: number } {
  const [latCell, lngCell] = cellKey.split(":").map(Number);
  return {
    lat: (latCell + 0.5) * gridSize,
    lng: (lngCell + 0.5) * gridSize,
  };
}

// ============================================
// CLUSTER ENDPOINT
// ============================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const params: ClusterParams = {
      swLat: rawParams.swLat || "0",
      neLat: rawParams.neLat || "0",
      swLng: rawParams.swLng || "0",
      neLng: rawParams.neLng || "0",
      zoom: rawParams.zoom || "0",
      gridSize: rawParams.gridSize,
      category: rawParams.category,
      minPrice: rawParams.minPrice,
      maxPrice: rawParams.maxPrice,
    };

    // Validate required params
    if (
      !params.swLat ||
      !params.neLat ||
      !params.swLng ||
      !params.neLng ||
      !params.zoom
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required parameters: swLat, neLat, swLng, neLng, zoom",
        },
        { status: 400 },
      );
    }

    const swLat = parseFloat(params.swLat);
    const neLat = parseFloat(params.neLat);
    const swLng = parseFloat(params.swLng);
    const neLng = parseFloat(params.neLng);
    const zoom = parseInt(params.zoom);
    const gridSize = params.gridSize
      ? parseFloat(params.gridSize)
      : getGridSize(zoom);

    // Check cache
    const cacheKey = getCacheKey(params);
    const cached = clusterCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({
        clusters: cached,
        cached: true,
        timestamp: Date.now(),
      });
    }

    // Build query conditions
    const conditions: any[] = [];

    if (params.category) {
      conditions.push(sql`${sahibindenListe.category} = ${params.category}`);
    }
    if (params.transaction) {
      conditions.push(
        sql`${sahibindenListe.transaction} = ${params.transaction}`,
      );
    }
    if (params.minPrice) {
      conditions.push(
        sql`${sahibindenListe.fiyat} >= ${parseInt(params.minPrice)}`,
      );
    }
    if (params.maxPrice) {
      conditions.push(
        sql`${sahibindenListe.fiyat} <= ${parseInt(params.maxPrice)}`,
      );
    }

    // Get all listings (we need them for clustering)
    const query = db
      .select({
        id: sahibindenListe.id,
        fiyat: sahibindenListe.fiyat,
        koordinatlar: sahibindenListe.koordinatlar,
        konum: sahibindenListe.konum,
        category: sahibindenListe.category,
        transaction: sahibindenListe.transaction,
      })
      .from(sahibindenListe)
      .orderBy(sahibindenListe.id);

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    // Limit for performance (cluster endpoint shouldn't return too many)
    query.limit(5000);

    const listings = await query;

    // Cluster coordinates
    const cellMap = new Map<
      string,
      {
        count: number;
        prices: number[];
        categories: Record<string, number>;
        sampleIds: string[];
        latSum: number;
        lngSum: number;
      }
    >();

    listings.forEach((listing) => {
      // Resolve coordinates
      let lat: number | null = null;
      let lng: number | null = null;

      if (listing.koordinatlar?.lat && listing.koordinatlar?.lng) {
        lat = parseFloat(listing.koordinatlar.lat);
        lng = parseFloat(listing.koordinatlar.lng);
      }

      // Skip if no coordinates (could add fallback to neighborhood mapping here)
      if (lat === null || lng === null) {
        return;
      }

      // Check if within bounds
      if (lat < swLat || lat > neLat || lng < swLng || lng > neLng) {
        return;
      }

      // Get cell key
      const cellKey = getCellKey(lat, lng, gridSize);

      // Initialize cell if needed
      if (!cellMap.has(cellKey)) {
        cellMap.set(cellKey, {
          count: 0,
          prices: [],
          categories: {},
          sampleIds: [],
          latSum: 0,
          lngSum: 0,
        });
      }

      const cell = cellMap.get(cellKey)!;
      cell.count++;
      cell.prices.push(listing.fiyat || 0);
      cell.latSum += lat;
      cell.lngSum += lng;
      cell.sampleIds.push(`sahibinden-${listing.id}`);

      if (listing.category) {
        cell.categories[listing.category] =
          (cell.categories[listing.category] || 0) + 1;
      }
    });

    // Build clusters
    const clusters: Cluster[] = [];
    cellMap.forEach((cell, cellKey) => {
      const prices = cell.prices.filter((p) => p > 0).sort((a, b) => a - b);
      const minPrice = prices[0] || 0;
      const maxPrice = prices[prices.length - 1] || 0;
      const avgPrice =
        prices.length > 0
          ? Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length)
          : 0;

      clusters.push({
        id: cellKey,
        latitude: cell.latSum / cell.count,
        longitude: cell.lngSum / cell.count,
        count: cell.count,
        prices: {
          min: minPrice,
          max: maxPrice,
          avg: avgPrice,
        },
        categories: cell.categories,
        sampleIds: cell.sampleIds.slice(0, 5), // Max 5 sample IDs
      });
    });

    // Cache result
    clusterCache.set(cacheKey, clusters, 1000 * 60 * 10);

    return NextResponse.json({
      clusters,
      cached: false,
      count: clusters.length,
      totalListings: listings.length,
      gridSize,
      timestamp: Date.now(),
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
