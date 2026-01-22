// Sahibinden İlanları ile Eşleştirme ve Benzerlik Skoru Hesaplama

import { db } from "@/db";
import { sql } from "drizzle-orm";
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

  // PostgreSQL sorgusu - ARRAY literal düzeltildi
  const categoryArray = `{${categories.join(",")}}`;

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
      category = ANY(${sql.raw(`'${categoryArray}'::text[]`)})
      AND transaction = 'satilik'
      AND fiyat IS NOT NULL 
      AND fiyat > 0
      AND m2 IS NOT NULL
      ${districtFilter}
    ORDER BY distance ASC
    LIMIT 100
  `);

  // Drizzle ORM response structure - direkt results kullan
  const rows = Array.isArray(results)
    ? results
    : (((results as any).rows || []) as any[]);

  console.log("📊 SQL Query Results:", {
    hasRows: !!(results as any).rows,
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
 * Mahalle bazlı mikro-piyasa analizi
 * Aynı ilçe + mahallede satılık tüm konutların ortalama m² fiyatı
 */
export async function findNeighborhoodAverage(
  location: LocationPoint,
  propertyType: PropertyFeatures["propertyType"],
): Promise<{
  avgPricePerM2: number;
  count: number;
  priceRange: { min: number; max: number };
}> {
  try {
    console.log("🏘️ Mahalle mikro-piyasa analizi yapılıyor...", {
      ilce: location.ilce,
      mahalle: location.mahalle,
      propertyType,
    });

    // Kategori mapping
    const categoryMap: Record<PropertyFeatures["propertyType"], string[]> = {
      konut: ["konut"],
      arsa: ["arsa"],
      isyeri: ["isyeri"],
      sanayi: ["isyeri"],
      tarim: ["arsa"],
    };

    const categories = categoryMap[propertyType] || ["konut"];
    const categoryArray = `{${categories.join(",")}}`;

    // Mahalle filtresi
    const ilce = location.ilce || "";
    const mahalle = location.mahalle || "";

    if (!ilce) {
      console.warn("⚠️ İlçe bilgisi yok, mahalle analizi yapılamıyor");
      return {
        avgPricePerM2: 0,
        count: 0,
        priceRange: { min: 0, max: 0 },
      };
    }

    // Mahalle bazlı sorgu (alan filtresi YOK - tüm konutlar)
    const results = await db.execute(sql`
      SELECT 
        fiyat,
        m2,
        konum,
        ilce,
        CAST(fiyat AS BIGINT) / CAST(REGEXP_REPLACE(m2, '[^0-9]', '', 'g') AS INTEGER) as price_per_m2
      FROM sahibinden_liste
      WHERE 
        category = ANY(${sql.raw(`'${categoryArray}'::text[]`)})
        AND transaction = 'satilik'
        AND fiyat IS NOT NULL 
        AND fiyat > 0
        AND m2 IS NOT NULL
        AND ilce ILIKE ${`%${ilce}%`}
        ${mahalle ? sql`AND konum ILIKE ${`%${mahalle}%`}` : sql``}
      LIMIT 100
    `);

    const rows = Array.isArray(results)
      ? results
      : (((results as any).rows || []) as any[]);

    console.log("📊 Mahalle Mikro-Piyasa Results:", {
      rowCount: rows.length,
      ilce,
      mahalle: mahalle || "Tüm mahalleler",
    });

    if (rows.length === 0) {
      return {
        avgPricePerM2: 0,
        count: 0,
        priceRange: { min: 0, max: 0 },
      };
    }

    // m² fiyatlarını çıkar
    const pricesPerM2 = rows
      .map((row) => {
        const m2Value = parseFloat(
          row.m2?.toString().replace(/\D/g, "") || "0",
        );
        const fiyat =
          typeof row.fiyat === "number"
            ? row.fiyat
            : parseInt(row.fiyat?.toString() || "0");
        return m2Value > 0 ? Math.round(fiyat / m2Value) : 0;
      })
      .filter((p) => p > 0);

    if (pricesPerM2.length === 0) {
      return {
        avgPricePerM2: 0,
        count: 0,
        priceRange: { min: 0, max: 0 },
      };
    }

    // Outlier filtreleme (IQR)
    const sorted = [...pricesPerM2].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const filteredPrices = pricesPerM2.filter(
      (p) => p >= lowerBound && p <= upperBound,
    );

    console.log("📊 Mahalle Outlier Analysis:", {
      total: pricesPerM2.length,
      filtered: filteredPrices.length,
      outliers: pricesPerM2.length - filteredPrices.length,
    });

    const dataToUse = filteredPrices.length >= 3 ? filteredPrices : pricesPerM2;

    // Ortalama hesapla
    const avgPricePerM2 = Math.round(
      dataToUse.reduce((sum, p) => sum + p, 0) / dataToUse.length,
    );

    return {
      avgPricePerM2,
      count: dataToUse.length,
      priceRange: {
        min: Math.min(...dataToUse),
        max: Math.max(...dataToUse),
      },
    };
  } catch (error) {
    console.error("Neighborhood average error:", error);
    return {
      avgPricePerM2: 0,
      count: 0,
      priceRange: { min: 0, max: 0 },
    };
  }
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
 * İl genelinde bina yaşı ve metrekare bazlı benchmark
 * Tüm ilçelerde aynı özelliklere sahip ilanların ortalamasını alır
 */
export async function findProvinceBenchmark(
  features: PropertyFeatures,
): Promise<{
  avgPricePerM2: number;
  count: number;
  priceRange: { min: number; max: number };
}> {
  try {
    console.log("🌍 İl geneli benchmark aranıyor...", {
      propertyType: features.propertyType,
      area: features.area,
      buildingAge: features.buildingAge,
    });

    // Kategori mapping
    const categoryMap: Record<PropertyFeatures["propertyType"], string[]> = {
      konut: ["konut"],
      arsa: ["arsa"],
      isyeri: ["isyeri"],
      sanayi: ["isyeri"],
      tarim: ["arsa"],
    };

    const categories = categoryMap[features.propertyType] || ["konut"];
    const categoryArray = `{${categories.join(",")}}`;

    // Alan aralığı: ±10%
    const minArea = features.area * 0.9;
    const maxArea = features.area * 1.1;

    // Bina yaşı filtresi YOK - Tüm konutları al, amortisman faktörü ile ayarla
    // Her +5 yıl = %5 fiyat düşüşü (valuation-engine.ts'de uygulanacak)

    // İl geneli sorgu (tüm ilçeler, tüm bina yaşları)
    const results = await db.execute(sql`
      SELECT 
        fiyat,
        m2,
        ilce,
        CAST(fiyat AS BIGINT) / CAST(REGEXP_REPLACE(m2, '[^0-9]', '', 'g') AS INTEGER) as price_per_m2
      FROM sahibinden_liste
      WHERE 
        category = ANY(${sql.raw(`'${categoryArray}'::text[]`)})
        AND transaction = 'satilik'
        AND fiyat IS NOT NULL 
        AND fiyat > 0
        AND m2 IS NOT NULL
        AND CAST(REGEXP_REPLACE(m2, '[^0-9]', '', 'g') AS INTEGER) BETWEEN ${minArea} AND ${maxArea}
      LIMIT 200
    `);

    const rows = Array.isArray(results)
      ? results
      : (((results as any).rows || []) as any[]);

    console.log("📊 İl Geneli Benchmark Results:", {
      rowCount: rows.length,
      areaRange: `${Math.round(minArea)}-${Math.round(maxArea)} m²`,
      note: "Tüm bina yaşları dahil - Amortisman faktörü ile ayarlanacak",
    });

    if (rows.length === 0) {
      return {
        avgPricePerM2: 0,
        count: 0,
        priceRange: { min: 0, max: 0 },
      };
    }

    // m² fiyatlarını çıkar
    const pricesPerM2 = rows
      .map((row) => {
        const m2Value = parseFloat(
          row.m2?.toString().replace(/\D/g, "") || "0",
        );
        const fiyat =
          typeof row.fiyat === "number"
            ? row.fiyat
            : parseInt(row.fiyat?.toString() || "0");
        return m2Value > 0 ? Math.round(fiyat / m2Value) : 0;
      })
      .filter((p) => p > 0);

    if (pricesPerM2.length === 0) {
      return {
        avgPricePerM2: 0,
        count: 0,
        priceRange: { min: 0, max: 0 },
      };
    }

    // Outlier filtreleme (IQR)
    const sorted = [...pricesPerM2].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const filteredPrices = pricesPerM2.filter(
      (p) => p >= lowerBound && p <= upperBound,
    );

    console.log("📊 İl Geneli Outlier Analysis:", {
      total: pricesPerM2.length,
      filtered: filteredPrices.length,
      outliers: pricesPerM2.length - filteredPrices.length,
    });

    const dataToUse = filteredPrices.length >= 3 ? filteredPrices : pricesPerM2;

    // Ortalama hesapla
    const avgPricePerM2 = Math.round(
      dataToUse.reduce((sum, p) => sum + p, 0) / dataToUse.length,
    );

    return {
      avgPricePerM2,
      count: dataToUse.length,
      priceRange: {
        min: Math.min(...dataToUse),
        max: Math.max(...dataToUse),
      },
    };
  } catch (error) {
    console.error("Province benchmark error:", error);
    return {
      avgPricePerM2: 0,
      count: 0,
      priceRange: { min: 0, max: 0 },
    };
  }
}

/**
 * İstatistiksel analiz: Ortalama, medyan, standart sapma
 * Outlier filtreleme ile (IQR method)
 */
export function calculateMarketStatistics(comparables: ComparableProperty[]): {
  avgPricePerM2: number;
  medianPricePerM2: number;
  stdDeviation: number;
  priceRange: { min: number; max: number };
  outlierCount: number;
} {
  if (comparables.length === 0) {
    return {
      avgPricePerM2: 0,
      medianPricePerM2: 0,
      stdDeviation: 0,
      priceRange: { min: 0, max: 0 },
      outlierCount: 0,
    };
  }

  const pricesPerM2 = comparables.map((c) => c.pricePerM2);

  // Outlier filtreleme (IQR method)
  const sorted = [...pricesPerM2].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  // Outlier'ları filtrele
  const filteredPrices = pricesPerM2.filter(
    (p) => p >= lowerBound && p <= upperBound,
  );
  const outlierCount = pricesPerM2.length - filteredPrices.length;

  console.log("📊 Outlier Analysis:", {
    total: pricesPerM2.length,
    filtered: filteredPrices.length,
    outliers: outlierCount,
    bounds: { lower: Math.round(lowerBound), upper: Math.round(upperBound) },
  });

  // Filtrelenmiş verilerle istatistik hesapla
  const dataToUse = filteredPrices.length >= 3 ? filteredPrices : pricesPerM2;

  // Ortalama
  const avgPricePerM2 = Math.round(
    dataToUse.reduce((sum, p) => sum + p, 0) / dataToUse.length,
  );

  // Medyan
  const sortedFiltered = [...dataToUse].sort((a, b) => a - b);
  const mid = Math.floor(sortedFiltered.length / 2);
  const medianPricePerM2 =
    sortedFiltered.length % 2 === 0
      ? Math.round((sortedFiltered[mid - 1] + sortedFiltered[mid]) / 2)
      : sortedFiltered[mid];

  // Standart sapma
  const variance =
    dataToUse.reduce((sum, p) => sum + Math.pow(p - avgPricePerM2, 2), 0) /
    dataToUse.length;
  const stdDeviation = Math.round(Math.sqrt(variance));

  // Fiyat aralığı (filtrelenmiş veriden)
  const priceRange = {
    min: Math.min(...dataToUse),
    max: Math.max(...dataToUse),
  };

  return {
    avgPricePerM2,
    medianPricePerM2,
    stdDeviation,
    priceRange,
    outlierCount,
  };
}
