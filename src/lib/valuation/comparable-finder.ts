// Sahibinden İlanları ile Eşleştirme ve Benzerlik Skoru Hesaplama

import { db } from "@/db";
import { sahibindenListe } from "@/db/schema/crawler";
import { sql, and, eq, gte, lte, isNotNull } from "drizzle-orm";
import { LocationPoint, PropertyFeatures, ComparableProperty } from "./types";

/**
 * Benzer ilanları bul ve benzerlik skoruna göre sırala
 * Kademeli genişletme stratejisi: Dar filtreden başla, sonuç yoksa genişlet
 */
export async function findComparableProperties(
  location: LocationPoint,
  features: PropertyFeatures,
  maxDistance: number = 5, // km
): Promise<ComparableProperty[]> {
  try {
    console.log("🔍 Comparable search started:", {
      location,
      propertyType: features.propertyType,
      area: features.area,
      maxDistance,
    });

    // 1. Kategori mapping
    const categoryMap: Record<PropertyFeatures["propertyType"], string[]> = {
      konut: ["konut"],
      arsa: ["arsa"],
      isyeri: ["isyeri"],
      sanayi: ["isyeri"], // Sanayi de işyeri kategorisinde
      tarim: ["arsa"], // Tarım arsası kategorisinde
    };

    const categories = categoryMap[features.propertyType] || ["konut"];

    console.log("📂 Category mapping:", {
      propertyType: features.propertyType,
      categories,
    });

    // 2. Kademeli arama stratejisi
    const searchStrategies = [
      {
        name: "Dar Filtre (İlçe + Alan ±20%)",
        areaMultiplier: 0.2,
        includeDistrict: true,
        includeNeighbors: false,
        minResults: 10,
      },
      {
        name: "Orta Filtre (İlçe + Alan ±50%)",
        areaMultiplier: 0.5,
        includeDistrict: true,
        includeNeighbors: false,
        minResults: 5,
      },
      {
        name: "Geniş Filtre (Komşu İlçeler + Alan ±50%)",
        areaMultiplier: 0.5,
        includeDistrict: true,
        includeNeighbors: true,
        minResults: 3,
      },
      {
        name: "En Geniş Filtre (Tüm İl + Alan ±70%)",
        areaMultiplier: 0.7,
        includeDistrict: false,
        includeNeighbors: false,
        minResults: 1,
      },
    ];

    // Her stratejiyi sırayla dene
    for (const strategy of searchStrategies) {
      console.log(`🎯 Trying strategy: ${strategy.name}`);

      const results = await searchWithStrategy(
        location,
        features,
        categories,
        strategy,
      );

      if (results.length >= strategy.minResults) {
        console.log(
          `✅ Found ${results.length} results with strategy: ${strategy.name}`,
        );
        return results;
      }

      console.log(
        `⚠️ Only ${results.length} results with strategy: ${strategy.name}, trying next...`,
      );
    }

    // Hiçbir strateji sonuç vermediyse boş array döndür
    console.warn("❌ No results found with any strategy");
    return [];
  } catch (error) {
    console.error("Comparable properties search error:", error);
    return [];
  }
}

/**
 * Belirli bir strateji ile arama yap
 */
async function searchWithStrategy(
  location: LocationPoint,
  features: PropertyFeatures,
  categories: string[],
  strategy: {
    areaMultiplier: number;
    includeDistrict: boolean;
    includeNeighbors: boolean;
  },
): Promise<ComparableProperty[]> {
  // Alan aralığı
  const minArea = features.area * (1 - strategy.areaMultiplier);
  const maxArea = features.area * (1 + strategy.areaMultiplier);

  // İlçe bilgisi
  const ilce = location.ilce || "";

  // Komşu ilçeler (Hendek için)
  const neighborDistricts: Record<string, string[]> = {
    Hendek: ["Adapazarı", "Akyazı", "Geyve", "Karasu"],
    Adapazarı: ["Hendek", "Akyazı", "Serdivan", "Erenler"],
    Akyazı: ["Hendek", "Adapazarı", "Geyve"],
  };

  // İlçe filtresi oluştur
  let districtFilter = sql``;
  if (strategy.includeDistrict && ilce) {
    if (strategy.includeNeighbors && neighborDistricts[ilce]) {
      const allDistricts = [ilce, ...neighborDistricts[ilce]];
      const districtConditions = allDistricts
        .map((d) => `ilce ILIKE '%${d}%' OR konum ILIKE '%${d}%'`)
        .join(" OR ");
      districtFilter = sql.raw(`AND (${districtConditions})`);
    } else {
      districtFilter = sql`AND (ilce ILIKE ${`%${ilce}%`} OR konum ILIKE ${`%${ilce}%`})`;
    }
  }

  // PostgreSQL sorgusu
  const results = await db.execute(sql`
    SELECT 
      id,
      baslik,
      fiyat,
      m2,
      konum,
      category,
      transaction,
      koordinatlar,
      ozellikler,
      ek_ozellikler,
      ilce,
      -- Haversine formula ile mesafe hesaplama (km) - koordinat varsa
      CASE 
        WHEN koordinatlar IS NOT NULL THEN
          (
            6371 * acos(
              cos(radians(${location.lat})) * 
              cos(radians((koordinatlar->>'lat')::float)) * 
              cos(radians((koordinatlar->>'lng')::float) - radians(${location.lng})) + 
              sin(radians(${location.lat})) * 
              sin(radians((koordinatlar->>'lat')::float))
            )
          )
        ELSE 999999 -- Koordinat yoksa çok büyük değer (en sona sıralanır)
      END as distance
    FROM sahibinden_liste
    WHERE 
      category = ANY(ARRAY[${sql.raw(categories.map((c) => `'${c}'`).join(","))}])
      AND transaction = 'satilik'
      AND fiyat IS NOT NULL 
      AND fiyat > 0
      AND m2 IS NOT NULL
      ${districtFilter}
    ORDER BY distance ASC
    LIMIT 100
  `);

  // Drizzle ORM response structure kontrol et
  const rows = (results.rows || results) as any[];

  console.log("📊 SQL Query Results:", {
    hasRows: !!results.rows,
    isArray: Array.isArray(results),
    rowCount: rows?.length || 0,
    firstRow: rows?.[0] || null,
  });

  if (!rows || rows.length === 0) {
    return [];
  }

  // Her ilan için benzerlik skoru hesapla ve filtrele
  const comparables: ComparableProperty[] = (rows || [])
    .map((row) => {
      const m2Value = parseFloat(row.m2?.toString().replace(/\D/g, "") || "0");
      const fiyat =
        typeof row.fiyat === "number"
          ? row.fiyat
          : parseInt(row.fiyat?.toString() || "0");
      const distance = parseFloat(row.distance);

      // Alan filtresi
      if (m2Value < minArea || m2Value > maxArea) {
        return null;
      }

      // Koordinat yoksa mesafe 999999 olur, bu ilanları kabul et ama düşük skor ver
      const hasCoordinates = distance < 999999;

      // Benzerlik skoru hesapla
      const similarity = calculateSimilarityScore(
        features,
        {
          area: m2Value,
          distance: hasCoordinates ? distance : 50, // Koordinat yoksa orta mesafe varsay
          ilce: row.ilce,
          mahalle: extractMahalle(row.konum),
          ozellikler: row.ozellikler,
          ekOzellikler: row.ek_ozellikler,
        },
        location,
      );

      return {
        id: row.id,
        baslik: row.baslik || "",
        fiyat,
        m2: m2Value,
        konum: row.konum || "",
        distance: hasCoordinates ? Math.round(distance * 100) / 100 : 0,
        pricePerM2: Math.round(fiyat / m2Value),
        similarity,
      };
    })
    .filter((c): c is ComparableProperty => c !== null && c.similarity >= 30) // Minimum %30 benzerlik
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 20); // En iyi 20 sonuç

  return comparables;
}

/**
 * Benzerlik skoru hesaplama algoritması
 * Faktörler: Alan, Mesafe, Konum, Özellikler
 */
function calculateSimilarityScore(
  targetFeatures: PropertyFeatures,
  comparable: {
    area: number;
    distance: number;
    ilce?: string;
    mahalle?: string;
    ozellikler?: any;
    ekOzellikler?: any;
  },
  targetLocation: LocationPoint,
): number {
  let score = 0;

  // 1. Alan benzerliği (0-30 puan)
  const areaDiff =
    Math.abs(targetFeatures.area - comparable.area) / targetFeatures.area;
  if (areaDiff <= 0.1)
    score += 30; // %10 fark
  else if (areaDiff <= 0.2)
    score += 25; // %20 fark
  else if (areaDiff <= 0.3)
    score += 20; // %30 fark
  else score += 10;

  // 2. Mesafe benzerliği (0-25 puan)
  if (comparable.distance <= 0.5)
    score += 25; // 500m içinde
  else if (comparable.distance <= 1)
    score += 20; // 1km içinde
  else if (comparable.distance <= 2)
    score += 15; // 2km içinde
  else if (comparable.distance <= 3)
    score += 10; // 3km içinde
  else if (comparable.distance <= 5) score += 5; // 5km içinde

  // 3. İlçe/Mahalle eşleşmesi (0-20 puan)
  if (targetLocation.ilce && comparable.ilce) {
    if (
      comparable.ilce.toLowerCase().includes(targetLocation.ilce.toLowerCase())
    ) {
      score += 10;
    }
  }
  if (targetLocation.mahalle && comparable.mahalle) {
    if (
      comparable.mahalle
        .toLowerCase()
        .includes(targetLocation.mahalle.toLowerCase())
    ) {
      score += 10;
    }
  }

  // 4. Özellik benzerliği (0-25 puan)
  if (targetFeatures.propertyType === "konut") {
    const ozellikler = comparable.ozellikler || {};
    const ekOzellikler = comparable.ekOzellikler || {};

    // Oda sayısı
    if (targetFeatures.roomCount && ozellikler.odaSayisi) {
      const roomDiff = Math.abs(
        targetFeatures.roomCount - parseInt(ozellikler.odaSayisi),
      );
      if (roomDiff === 0) score += 8;
      else if (roomDiff === 1) score += 5;
      else if (roomDiff === 2) score += 3;
    }

    // Bina yaşı
    if (targetFeatures.buildingAge && ozellikler.binaYasi) {
      const ageDiff = Math.abs(
        targetFeatures.buildingAge - parseInt(ozellikler.binaYasi),
      );
      if (ageDiff <= 2) score += 7;
      else if (ageDiff <= 5) score += 5;
      else if (ageDiff <= 10) score += 3;
    }

    // Kat
    if (targetFeatures.floor && ozellikler.bulunduguKat) {
      const floorDiff = Math.abs(
        targetFeatures.floor - parseInt(ozellikler.bulunduguKat),
      );
      if (floorDiff === 0) score += 5;
      else if (floorDiff <= 2) score += 3;
    }

    // Ekstra özellikler (asansör, otopark, balkon)
    if (targetFeatures.hasElevator && ekOzellikler.asansor) score += 2;
    if (targetFeatures.hasParking && ekOzellikler.otopark) score += 2;
    if (targetFeatures.hasBalcony && ekOzellikler.balkon) score += 1;
  }

  return Math.min(Math.round(score), 100);
}

/**
 * Konum string'inden mahalle çıkar
 */
function extractMahalle(konum: string): string {
  if (!konum) return "";

  // "İl, İlçe, Mahalle" formatından mahalle çıkar
  const parts = konum.split(",").map((p) => p.trim());
  if (parts.length >= 3) {
    return parts[2];
  }

  return "";
}

/**
 * İstatistiksel analiz: Ortalama, medyan, standart sapma
 */
export function calculateMarketStatistics(comparables: ComparableProperty[]): {
  avgPricePerM2: number;
  medianPricePerM2: number;
  stdDeviation: number;
  priceRange: { min: number; max: number };
} {
  if (comparables.length === 0) {
    return {
      avgPricePerM2: 0,
      medianPricePerM2: 0,
      stdDeviation: 0,
      priceRange: { min: 0, max: 0 },
    };
  }

  const pricesPerM2 = comparables.map((c) => c.pricePerM2);

  // Ortalama
  const avgPricePerM2 = Math.round(
    pricesPerM2.reduce((sum, p) => sum + p, 0) / pricesPerM2.length,
  );

  // Medyan
  const sorted = [...pricesPerM2].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const medianPricePerM2 =
    sorted.length % 2 === 0
      ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
      : sorted[mid];

  // Standart sapma
  const variance =
    pricesPerM2.reduce((sum, p) => sum + Math.pow(p - avgPricePerM2, 2), 0) /
    pricesPerM2.length;
  const stdDeviation = Math.round(Math.sqrt(variance));

  // Fiyat aralığı
  const priceRange = {
    min: Math.min(...pricesPerM2),
    max: Math.max(...pricesPerM2),
  };

  return {
    avgPricePerM2,
    medianPricePerM2,
    stdDeviation,
    priceRange,
  };
}
