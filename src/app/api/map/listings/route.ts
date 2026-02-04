import { db } from "@/db";
import { sahibindenListe } from "@/db/schema/crawler";
import { listings } from "@/db/schema/listings";
import { desc, and, gte, lte, sql, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { withAdminRateLimit } from "@/lib/api-auth";
import { z } from "zod";

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================

const MapListingsQuerySchema = z.object({
  swLat: z.coerce.number().min(-90).max(90).optional(),
  neLat: z.coerce.number().min(-90).max(90).optional(),
  swLng: z.coerce.number().min(-180).max(180).optional(),
  neLng: z.coerce.number().min(-180).max(180).optional(),
  category: z.string().optional(),
  transactionType: z.enum(["sale", "rent", "Satılık", "Kiralık"]).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minArea: z.coerce.number().min(0).optional(),
  maxArea: z.coerce.number().min(0).optional(),
  limit: z.coerce.number().min(1).max(5000).default(1000),
  noCache: z.enum(["true", "false"]).optional(),
});

// ============================================
// TYPES
// ============================================

interface MapMarker {
  id: string;
  position: {
    lat: number;
    lng: number;
  };
  title: string;
  price: number;
  type: string;
  transactionType: string;
  area?: number;
  thumbnail?: string;
  slug: string;
  district?: string;
  neighborhood?: string;
  category?: string;
  source: string;
}

interface MapListingsResponse {
  data: MapMarker[];
  stats: {
    total: number;
    sale: number;
    rent: number;
  };
  cached: boolean;
  timestamp: number;
}

// ============================================
// CACHE (In-Memory - Production'da Redis)
// ============================================

interface CacheEntry {
  data: MapListingsResponse;
  expiresAt: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: string): MapListingsResponse | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: MapListingsResponse, ttlMs: number): void {
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

const mapCache = new SimpleCache(100);

function getCacheKey(params: any): string {
  return `map:${JSON.stringify(params)}`;
}

// ============================================
// DISTRICT & NEIGHBORHOOD COORDINATES
// ============================================

// İlçe merkezleri
const DISTRICT_CENTERS: Record<string, { lat: number; lng: number }> = {
  Hendek: { lat: 40.795, lng: 30.745 },
  Adapazarı: { lat: 40.7569, lng: 30.4026 },
  Akyazı: { lat: 40.6853, lng: 30.6253 },
  Sapanca: { lat: 40.6889, lng: 30.2667 },
  Karasu: { lat: 41.0969, lng: 30.6944 },
  Geyve: { lat: 40.5072, lng: 30.2917 },
};

// Mahalle koordinatları (İlçe bazlı)
const NEIGHBORHOOD_LOCATIONS: Record<
  string,
  Record<string, { lat: number; lng: number }>
> = {
  // HENDEK MAHALLELERİ
  Hendek: {
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
    Dikmen: { lat: 40.7, lng: 30.85 },
    Aksu: { lat: 40.68, lng: 30.82 },
    Göksu: { lat: 40.69, lng: 30.8 },
    Kurtuluş: { lat: 40.75, lng: 30.78 },
    Martinler: { lat: 40.82, lng: 30.6 },
    Lütfiyeköşk: { lat: 40.83, lng: 30.58 },
    Kırktepe: { lat: 40.84, lng: 30.55 },
    Güldibi: { lat: 40.795, lng: 30.76 },
  },

  // ADAPAZARI MAHALLELERİ
  Adapazarı: {
    Merkez: { lat: 40.7569, lng: 30.4026 },
    Cumhuriyet: { lat: 40.7589, lng: 30.4046 },
    Yeni: { lat: 40.7549, lng: 30.4006 },
    Kemalpaşa: { lat: 40.7609, lng: 30.4086 },
    Mithatpaşa: { lat: 40.7529, lng: 30.3986 },
    Semerciler: { lat: 40.7589, lng: 30.4106 },
    Arabacıalanı: { lat: 40.7509, lng: 30.3966 },
    Arifiye: { lat: 40.7149, lng: 30.3686 },
    Erenler: { lat: 40.7789, lng: 30.4286 },
    Serdivan: { lat: 40.7889, lng: 30.3886 },
    Adapazarı: { lat: 40.7569, lng: 30.4026 },
    Yenidoğan: { lat: 40.7649, lng: 30.4146 },
    Güllük: { lat: 40.7489, lng: 30.3906 },
    Papuççular: { lat: 40.7629, lng: 30.4166 },
    Beşköprü: { lat: 40.7709, lng: 30.4206 },
    Orta: { lat: 40.7549, lng: 30.4086 },
    Yağcılar: { lat: 40.7589, lng: 30.4126 },
  },

  // AKYAZI MAHALLELERİ
  Akyazı: {
    Merkez: { lat: 40.6853, lng: 30.6253 },
    Cumhuriyet: { lat: 40.6873, lng: 30.6273 },
    Yeni: { lat: 40.6833, lng: 30.6233 },
    Kemalpaşa: { lat: 40.6893, lng: 30.6293 },
    Akyazı: { lat: 40.6853, lng: 30.6253 },
    Akpınar: { lat: 40.6913, lng: 30.6313 },
    Hasanbey: { lat: 40.6793, lng: 30.6193 },
    Yenimahalle: { lat: 40.6933, lng: 30.6333 },
    Fevzipaşa: { lat: 40.6773, lng: 30.6173 },
    Atatürk: { lat: 40.6953, lng: 30.6353 },
  },
};

function resolveCoordinates(
  koordinatlar: { lat: string; lng: string } | null,
  konum: string | null,
  ilce: string | null,
  mahalle: string | null,
): { lat: number; lng: number } {
  // 1. Öncelik: Explicit koordinatlar varsa kullan
  if (koordinatlar?.lat && koordinatlar?.lng) {
    return {
      lat: parseFloat(koordinatlar.lat),
      lng: parseFloat(koordinatlar.lng),
    };
  }

  // 2. Öncelik: İlçe + Mahalle kombinasyonu
  if (ilce && mahalle) {
    // İlçe adını normalize et (Adapazarı, Akyazı, Hendek)
    const normalizedIlce = ilce.trim();

    // İlçe mahalle haritasında ara
    if (NEIGHBORHOOD_LOCATIONS[normalizedIlce]) {
      const mahalleMap = NEIGHBORHOOD_LOCATIONS[normalizedIlce];

      // Mahalle adını normalize et ve ara
      const normalizedMahalle = mahalle.trim();

      // Tam eşleşme
      if (mahalleMap[normalizedMahalle]) {
        const coords = mahalleMap[normalizedMahalle];
        return {
          lat: coords.lat + (Math.random() - 0.5) * 0.002,
          lng: coords.lng + (Math.random() - 0.5) * 0.002,
        };
      }

      // Kısmi eşleşme (mahalle adı içinde geçiyorsa)
      for (const [key, coords] of Object.entries(mahalleMap)) {
        if (
          normalizedMahalle.includes(key) ||
          key.includes(normalizedMahalle)
        ) {
          return {
            lat: coords.lat + (Math.random() - 0.5) * 0.002,
            lng: coords.lng + (Math.random() - 0.5) * 0.002,
          };
        }
      }
    }

    // Mahalle bulunamadıysa ilçe merkezini kullan
    if (DISTRICT_CENTERS[normalizedIlce]) {
      const coords = DISTRICT_CENTERS[normalizedIlce];
      return {
        lat: coords.lat + (Math.random() - 0.5) * 0.01,
        lng: coords.lng + (Math.random() - 0.5) * 0.01,
      };
    }
  }

  // 3. Öncelik: Sadece ilçe varsa
  if (ilce) {
    const normalizedIlce = ilce.trim();
    if (DISTRICT_CENTERS[normalizedIlce]) {
      const coords = DISTRICT_CENTERS[normalizedIlce];
      return {
        lat: coords.lat + (Math.random() - 0.5) * 0.01,
        lng: coords.lng + (Math.random() - 0.5) * 0.01,
      };
    }
  }

  // 4. Öncelik: Konum string'inde mahalle adı ara (eski sistem - fallback)
  if (konum) {
    // Tüm ilçelerde ara
    for (const [districtName, mahalleMap] of Object.entries(
      NEIGHBORHOOD_LOCATIONS,
    )) {
      for (const [mahalleName, coords] of Object.entries(mahalleMap)) {
        if (konum.includes(mahalleName)) {
          return {
            lat: coords.lat + (Math.random() - 0.5) * 0.002,
            lng: coords.lng + (Math.random() - 0.5) * 0.002,
          };
        }
      }
    }
  }

  // 5. Fallback: Sakarya merkezi (Adapazarı)
  return {
    lat: 40.7569 + (Math.random() - 0.5) * 0.05,
    lng: 30.4026 + (Math.random() - 0.5) * 0.05,
  };
}

// ============================================
// GET /api/map/listings
// ============================================

export const GET = withAdminRateLimit(
  async (request, { session }) => {
    try {
      const { searchParams } = new URL(request.url);
      const rawParams = Object.fromEntries(searchParams.entries());

      // Validate with Zod
      const validationResult = MapListingsQuerySchema.safeParse(rawParams);
      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: "Geçersiz parametreler",
            details: validationResult.error.flatten(),
          },
          { status: 400 },
        );
      }

      const params = validationResult.data;
      const noCache = params.noCache === "true";

      // Check cache
      if (!noCache) {
        const cacheKey = getCacheKey(rawParams);
        const cached = mapCache.get(cacheKey);
        if (cached) {
          return NextResponse.json({
            ...cached,
            cached: true,
          });
        }
      }

      // Build query conditions
      const conditions: any[] = [];

      if (params.minPrice !== undefined) {
        conditions.push(gte(sahibindenListe.fiyat, params.minPrice));
      }
      if (params.maxPrice !== undefined) {
        conditions.push(lte(sahibindenListe.fiyat, params.maxPrice));
      }
      if (params.category) {
        conditions.push(sql`${sahibindenListe.category} = ${params.category}`);
      }
      if (params.transactionType) {
        const transactionValue =
          params.transactionType === "sale"
            ? "Satılık"
            : params.transactionType === "rent"
              ? "Kiralık"
              : params.transactionType;
        conditions.push(
          sql`${sahibindenListe.transaction} = ${transactionValue}`,
        );
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

      query.limit(params.limit).orderBy(desc(sahibindenListe.id));

      const listingsData = await query;

      // Process and filter by bounding box
      const markers: MapMarker[] = [];
      let saleCount = 0;
      let rentCount = 0;

      listingsData.forEach((item) => {
        const coords = resolveCoordinates(
          item.koordinatlar,
          item.konum,
          item.ilce,
          item.mahalle,
        );

        // Bounding box filter
        if (
          params.swLat !== undefined &&
          params.neLat !== undefined &&
          params.swLng !== undefined &&
          params.neLng !== undefined
        ) {
          if (
            coords.lat < params.swLat ||
            coords.lat > params.neLat ||
            coords.lng < params.swLng ||
            coords.lng > params.neLng
          ) {
            return;
          }
        }

        const transactionType =
          item.transaction === "Satılık" ? "sale" : "rent";
        if (transactionType === "sale") saleCount++;
        else rentCount++;

        markers.push({
          id: `sahibinden-${item.id}`,
          position: {
            lat: coords.lat,
            lng: coords.lng,
          },
          title: item.baslik || "",
          price: item.fiyat || 0,
          type: item.category || "",
          transactionType,
          area: item.m2 ? parseInt(item.m2) : undefined,
          thumbnail: item.resim || undefined,
          slug: `ilan-${item.id}`,
          district: item.ilce || undefined,
          neighborhood: item.mahalle || undefined,
          category: item.category || undefined,
          source: "sahibinden",
        });
      });

      const response: MapListingsResponse = {
        data: markers,
        stats: {
          total: markers.length,
          sale: saleCount,
          rent: rentCount,
        },
        cached: false,
        timestamp: Date.now(),
      };

      // Cache result
      if (!noCache) {
        const cacheKey = getCacheKey(rawParams);
        mapCache.set(cacheKey, response, 1000 * 60 * 5); // 5 dakika
      }

      return NextResponse.json(response);
    } catch (error) {
      console.error("Map listings API error:", error);
      return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
    }
  },
  100, // 100 requests per minute
);
