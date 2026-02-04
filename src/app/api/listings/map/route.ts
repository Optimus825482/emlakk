import { db } from "@/db";
import { sahibindenListe } from "@/db/schema/crawler";
import { listings } from "@/db/schema/listings";
import { desc, and, gte, lte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

// ============================================
// CACHE SYSTEM (In-Memory - Production'da Redis kullanılacak)
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
    // Eviction if max size exceeded (remove oldest)
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

const mapCache = new SimpleCache(100);
const clusterCache = new SimpleCache(50);

function getCacheKey(endpoint: string, params: any): string {
  return `${endpoint}:${JSON.stringify(params)}`;
}

function getCached(cache: SimpleCache, key: string): unknown | null {
  return cache.get(key);
}

function setCached(cache: SimpleCache, key: string, data: unknown, ttl: number = 1000 * 60 * 5): void {
  cache.set(key, data, ttl);
}

// ============================================
// HENDEK NEIGHBORHOOD COORDINATES
// ============================================

const HENDEK_LOCATIONS: Record<string, { lat: number; lng: number }> = {
  // Merkez Mahalleler
  Başpınar: { lat: 40.793, lng: 30.742 },
  Kemaliye: { lat: 40.796, lng: 30.748 },
  "Yeni Mah": { lat: 40.801, lng: 30.735 },
  Yeni: { lat: 40.801, lng: 30.735 },
  Rasimpaşa: { lat: 40.798, lng: 30.755 },
  Mahmutbey: { lat: 40.8, lng: 30.745 },
  Turanlar: { lat: 40.805, lng: 30.72 },
  Akova: { lat: 40.81, lng: 30.71 },
  Dereboğazı: { lat: 40.79, lng: 30.75 },
  Köprübaşı: { lat: 40.785, lng: 30.76 },
  Sarıdede: { lat: 40.792, lng: 30.73 },
  Bayraktepe: { lat: 40.788, lng: 30.74 },
  Büyükdere: { lat: 40.785, lng: 30.73 },
  Yeşilköy: { lat: 40.815, lng: 30.725 },

  // Belde/Büyük Köyler
  Çamlıca: { lat: 40.82, lng: 30.8 },
  Yeşilyurt: { lat: 40.85, lng: 30.85 },
  Puna: { lat: 40.83, lng: 30.7 },
  Ortaköy: { lat: 40.83, lng: 30.7 },
  Kargalı: { lat: 40.77, lng: 30.7 },
  Uzuncaorman: { lat: 40.76, lng: 30.68 },
  Nuriye: { lat: 40.815, lng: 30.68 },
  Kazımiye: { lat: 40.825, lng: 30.65 },
  Sivritepe: { lat: 40.84, lng: 30.62 },
  Kurtköy: { lat: 40.85, lng: 30.72 },
  Yukarıhüseyinşeyh: { lat: 40.85, lng: 30.75 },
  Çağlayan: { lat: 40.86, lng: 30.76 },
  Hacıkışla: { lat: 40.87, lng: 30.77 },
  Sümbüllü: { lat: 40.88, lng: 30.78 },
  Kocatöngel: { lat: 40.9, lng: 30.8 },
  Soğuksu: { lat: 40.89, lng: 30.75 },

  // Diğer Köyler
  Dikmen: { lat: 40.7, lng: 30.85 },
  Aksu: { lat: 40.68, lng: 30.82 },
  Göksu: { lat: 40.69, lng: 30.8 },
  Kurtuluş: { lat: 40.75, lng: 30.78 },
  Martinler: { lat: 40.82, lng: 30.6 },
  Lütfiyeköşk: { lat: 40.83, lng: 30.58 },
  Kırktepe: { lat: 40.84, lng: 30.55 },
  Güldibi: { lat: 40.795, lng: 30.76 },
};

// ============================================
// COORDINATE RESOLVER
// ============================================

function resolveCoordinates(
  koordinatlar: { lat: string; lng: string } | null,
  konum: string | null,
): { lat: number; lng: number; isExact: boolean } {
  // 1. Check explicit coordinates
  if (koordinatlar?.lat && koordinatlar?.lng) {
    return {
      lat: parseFloat(koordinatlar.lat),
      lng: parseFloat(koordinatlar.lng),
      isExact: true,
    };
  }

  // 2. Fallback to Neighborhood Mapping
  if (konum) {
    for (const [key, coords] of Object.entries(HENDEK_LOCATIONS)) {
      if (konum.includes(key)) {
        return {
          lat: coords.lat + (Math.random() - 0.5) * 0.002,
          lng: coords.lng + (Math.random() - 0.5) * 0.002,
          isExact: false,
        };
      }
    }
  }

  // 3. Fallback to Hendek Center
  return {
    lat: 40.795 + (Math.random() - 0.5) * 0.05,
    lng: 30.745 + (Math.random() - 0.5) * 0.05,
    isExact: false,
  };
}

// ============================================
// QUERY PARAMETERS
// ============================================

interface MapQueryParams {
  swLat?: string; // South-West Latitude (Bounding box)
  neLat?: string; // North-East Latitude
  swLng?: string; // South-West Longitude
  neLng?: string; // North-East Longitude
  zoom?: string; // Zoom level (1-20)
  category?: string; // Filter by category
  transaction?: string; // Filter by transaction type
  minPrice?: string; // Minimum price
  maxPrice?: string; // Maximum price
  source?: string; // 'sahibinden' | 'database' | 'all'
  limit?: string; // Max results
  noCache?: string; // Bypass cache
}

// ============================================
// GET /api/listings/map
// ============================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params: MapQueryParams = Object.fromEntries(searchParams.entries());

    // Parse parameters
    const swLat = params.swLat ? parseFloat(params.swLat) : null;
    const neLat = params.neLat ? parseFloat(params.neLat) : null;
    const swLng = params.swLng ? parseFloat(params.swLng) : null;
    const neLng = params.neLng ? parseFloat(params.neLng) : null;
    const zoom = params.zoom ? parseInt(params.zoom) : 10;
    const category = params.category || null;
    const transaction = params.transaction || null;
    const minPrice = params.minPrice ? parseInt(params.minPrice) : null;
    const maxPrice = params.maxPrice ? parseInt(params.maxPrice) : null;
    const source = params.source || "sahibinden";
    const limit = params.limit ? parseInt(params.limit) : 1000;
    const noCache = params.noCache === "true";

    // Check cache
    if (!noCache) {
      const cacheKey = getCacheKey("map", params);
      const cached = getCached(mapCache, cacheKey);
      if (cached) {
        return NextResponse.json({
          data: cached,
          cached: true,
          timestamp: Date.now(),
        });
      }
    }

    // Determine which table to query
    const useSahibinden = source === "all" || source === "sahibinden";

    let resultListings: any[] = [];

    if (useSahibinden) {
      // Build query conditions
      const conditions: any[] = [];

      // Price filter
      if (minPrice !== null) {
        conditions.push(gte(sahibindenListe.fiyat, minPrice));
      }
      if (maxPrice !== null) {
        conditions.push(lte(sahibindenListe.fiyat, maxPrice));
      }

      // Category filter
      if (category) {
        conditions.push(sql`${sahibindenListe.category} = ${category}`);
      }

      // Transaction filter
      if (transaction) {
        conditions.push(sql`${sahibindenListe.transaction} = ${transaction}`);
      }

      // Execute query
      const query = db
        .select({
          id: sahibindenListe.id,
          baslik: sahibindenListe.baslik,
          fiyat: sahibindenListe.fiyat,
          konum: sahibindenListe.konum,
          resim: sahibindenListe.resim,
          koordinatlar: sahibindenListe.koordinatlar,
          category: sahibindenListe.category,
          transaction: sahibindenListe.transaction,
          m2: sahibindenListe.m2,
          ilce: sahibindenListe.ilce,
          semt: sahibindenListe.semt,
          mahalle: sahibindenListe.mahalle,
        })
        .from(sahibindenListe);

      if (conditions.length > 0) {
        query.where(and(...conditions));
      }

      query.limit(limit).orderBy(desc(sahibindenListe.id));

      const listingsData = await query;

      // Process coordinates and filter by bounding box
      resultListings = listingsData
        .map((item) => {
          const coords = resolveCoordinates(item.koordinatlar, item.konum);

          return {
            id: `sahibinden-${item.id}`,
            source: "sahibinden",
            title: item.baslik,
            price: item.fiyat,
            latitude: coords.lat,
            longitude: coords.lng,
            thumbnail: item.resim,
            location: item.konum,
            type: item.transaction || "Satılık",
            category: item.category,
            slug: `ilan-${item.id}`,
            isExact: coords.isExact,
            m2: item.m2,
            ilce: item.ilce,
            semt: item.semt,
            mahalle: item.mahalle,
          };
        })
        .filter((item) => {
          // Bounding box filter
          if (
            swLat !== null &&
            neLat !== null &&
            swLng !== null &&
            neLng !== null
          ) {
            return (
              item.latitude >= swLat &&
              item.latitude <= neLat &&
              item.longitude >= swLng &&
              item.longitude <= neLng
            );
          }
          return true;
        });
    }

    // Cache result
    if (!noCache && resultListings.length > 0) {
      const cacheKey = getCacheKey("map", params);
      setCached(mapCache, cacheKey, resultListings);
    }

    return NextResponse.json({
      data: resultListings,
      cached: false,
      count: resultListings.length,
      timestamp: Date.now(),
      bounds: { swLat, neLat, swLng, neLng },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
