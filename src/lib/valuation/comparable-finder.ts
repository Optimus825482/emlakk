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

  // 2. Kademeli arama stratejisi (Mahalle bazlı, ±30% max alan toleransı)
    const searchStrategies = [
      {
        name: "Dar Filtre (Mahalle + Alan ±10%)",
        areaMultiplier: 0.1,
        includeDistrict: true,
        includeMahalle: true,
        includeNeighbors: false,
        minResults: 5,
      },
      {
        name: "Orta Filtre (Mahalle + Alan ±20%)",
        areaMultiplier: 0.2,
        includeDistrict: true,
        includeMahalle: true,
        includeNeighbors: false,
        minResults: 5,
      },
      {
        name: "Geniş Filtre (İlçe + Alan ±30%)",
        areaMultiplier: 0.3,
        includeDistrict: true,
        includeMahalle: false,
        includeNeighbors: false,
        minResults: 5,
      },
      {
        name: "En Geniş Filtre (Komşu İlçeler + Alan ±30%)",
        areaMultiplier: 0.3,
        includeDistrict: true,
        includeMahalle: false,
        includeNeighbors: true,
        minResults: 5,
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
    includeMahalle?: boolean;
    includeNeighbors: boolean;
  },
): Promise<ComparableProperty[]> {
  const minArea = features.area * (1 - strategy.areaMultiplier);
  const maxArea = features.area * (1 + strategy.areaMultiplier);

  const ilce = location.ilce || "";
  const mahalle = location.mahalle || "";

  const neighborDistricts: Record<string, string[]> = {
    Hendek: ["Adapazarı", "Akyazı", "Geyve", "Karasu"],
    Adapazarı: ["Hendek", "Akyazı", "Serdivan", "Erenler"],
    Akyazı: ["Hendek", "Adapazarı", "Geyve"],
  };

  let locationFilter = sql``;
  
  if (strategy.includeMahalle && mahalle && ilce) {
    locationFilter = sql`AND ilce ILIKE ${`%${ilce}%`} AND konum ILIKE ${`%${mahalle}%`}`;
  } else if (strategy.includeDistrict && ilce) {
    if (strategy.includeNeighbors && neighborDistricts[ilce]) {
      const allDistricts = [ilce, ...neighborDistricts[ilce]];
      const districtConditions = allDistricts
        .map((d) => `ilce ILIKE '%${d}%' OR konum ILIKE '%${d}%'`)
        .join(" OR ");
      locationFilter = sql.raw(`AND (${districtConditions})`);
    } else {
      locationFilter = sql`AND (ilce ILIKE ${`%${ilce}%`} OR konum ILIKE ${`%${ilce}%`})`;
    }
  }

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
      ilce
    FROM sahibinden_liste
    WHERE 
      category = ANY(${sql.raw(`'${categoryArray}'::text[]`)})
      AND transaction = 'satilik'
      AND fiyat IS NOT NULL 
      AND fiyat > 0
      AND m2 IS NOT NULL
      AND CAST(REGEXP_REPLACE(m2, '[^0-9]', '', 'g') AS INTEGER) BETWEEN ${Math.floor(minArea)} AND ${Math.ceil(maxArea)}
      ${locationFilter}
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

  const comparables: ComparableProperty[] = (rows || [])
    .map((row) => {
      const m2Value = parseFloat(row.m2?.toString().replace(/\D/g, "") || "0");
      const fiyat =
        typeof row.fiyat === "number"
          ? row.fiyat
          : parseInt(row.fiyat?.toString() || "0");

      if (m2Value < minArea || m2Value > maxArea) {
        return null;
      }

      const ozellikler = row.ozellikler || {};
      const emlakTipi = ozellikler["Emlak Tipi"]?.toString().toLowerCase() || "";
      
      if (features.propertyType === "konut") {
        const isDaire = emlakTipi.includes("daire") || emlakTipi.includes("apartman");
        const isMustakil = emlakTipi.includes("müstakil") || emlakTipi.includes("villa") || emlakTipi.includes("dubleks");
        
        const targetIsDaire = features.area <= 200;
        
        if (targetIsDaire && isMustakil) {
          return null;
        }
        if (!targetIsDaire && isDaire) {
          return null;
        }
      }

      const similarity = calculateSimilarityScore(
        features,
        {
          area: m2Value,
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
        distance: 0,
        pricePerM2: Math.round(fiyat / m2Value),
        similarity,
      };
    })
    .filter((c): c is ComparableProperty => c !== null && c.similarity >= 40)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 20);

  return comparables;
}

/**
 * Benzerlik skoru - Mahalle bazlı (koordinat kullanılmıyor)
 */
function calculateSimilarityScore(
  targetFeatures: PropertyFeatures,
  comparable: {
    area: number;
    ilce?: string;
    mahalle?: string;
    ozellikler?: any;
    ekOzellikler?: any;
  },
  targetLocation: LocationPoint,
): number {
  let score = 0;

  const areaDiff =
    Math.abs(targetFeatures.area - comparable.area) / targetFeatures.area;
  if (areaDiff <= 0.1) score += 35;
  else if (areaDiff <= 0.2) score += 28;
  else if (areaDiff <= 0.3) score += 20;
  else score += 10;

  if (targetLocation.mahalle && comparable.mahalle) {
    if (
      comparable.mahalle
        .toLowerCase()
        .includes(targetLocation.mahalle.toLowerCase())
    ) {
      score += 30;
    }
  }

  if (targetLocation.ilce && comparable.ilce) {
    if (
      comparable.ilce.toLowerCase().includes(targetLocation.ilce.toLowerCase())
    ) {
      score += 15;
    }
  }

  // 4. Özellik benzerliği (0-25 puan)
  if (targetFeatures.propertyType === "konut") {
    const ozellikler = comparable.ozellikler || {};
    const ekOzellikler = comparable.ekOzellikler || {};

    // Oda sayısı (veritabanında "Oda Sayısı" olarak saklanıyor)
    if (targetFeatures.roomCount && ozellikler["Oda Sayısı"]) {
      // "3+1" formatını parse et
      const roomStr = ozellikler["Oda Sayısı"].toString();
      const roomMatch = roomStr.match(/^(\d+)/); // İlk sayıyı al (3+1 → 3)
      if (roomMatch) {
        const comparableRooms = parseInt(roomMatch[1]);
        const roomDiff = Math.abs(targetFeatures.roomCount - comparableRooms);
        if (roomDiff === 0) score += 8;
        else if (roomDiff === 1) score += 5;
        else if (roomDiff === 2) score += 3;
      }
    }

    // Bina yaşı (veritabanında "Bina Yaşı" olarak saklanıyor)
    if (targetFeatures.buildingAge && ozellikler["Bina Yaşı"]) {
      // "11-15 arası" formatını parse et
      const ageStr = ozellikler["Bina Yaşı"].toString();
      const ageMatch = ageStr.match(/^(\d+)/); // İlk sayıyı al
      if (ageMatch) {
        const comparableAge = parseInt(ageMatch[1]);
        const ageDiff = Math.abs(targetFeatures.buildingAge - comparableAge);
        if (ageDiff <= 2) score += 7;
        else if (ageDiff <= 5) score += 5;
        else if (ageDiff <= 10) score += 3;
      }
    }

    // Kat (veritabanında "Bulunduğu Kat" olarak saklanıyor)
    if (targetFeatures.floor && ozellikler["Bulunduğu Kat"]) {
      const floorStr = ozellikler["Bulunduğu Kat"].toString();
      const floorMatch = floorStr.match(/^(\d+)/); // İlk sayıyı al
      if (floorMatch) {
        const comparableFloor = parseInt(floorMatch[1]);
        const floorDiff = Math.abs(targetFeatures.floor - comparableFloor);
        if (floorDiff === 0) score += 5;
        else if (floorDiff <= 2) score += 3;
      }
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

    const minArea = features.area * 0.8;
    const maxArea = features.area * 1.2;

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
 * MAD (Median Absolute Deviation) tabanlı outlier filtreleme
 * IQR'dan daha robust - küçük veri setlerinde daha iyi çalışır
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
  const sorted = [...pricesPerM2].sort((a, b) => a - b);
  
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];

  const absoluteDeviations = pricesPerM2.map((p) => Math.abs(p - median));
  const sortedDeviations = [...absoluteDeviations].sort((a, b) => a - b);
  const madMid = Math.floor(sortedDeviations.length / 2);
  const mad = sortedDeviations.length % 2 === 0
    ? (sortedDeviations[madMid - 1] + sortedDeviations[madMid]) / 2
    : sortedDeviations[madMid];

  const k = 2.5;
  const lowerBound = median - k * mad * 1.4826;
  const upperBound = median + k * mad * 1.4826;

  const filteredPrices = pricesPerM2.filter(
    (p) => p >= lowerBound && p <= upperBound,
  );
  const outlierCount = pricesPerM2.length - filteredPrices.length;

  console.log("📊 MAD Outlier Analysis:", {
    total: pricesPerM2.length,
    filtered: filteredPrices.length,
    outliers: outlierCount,
    median: Math.round(median),
    mad: Math.round(mad),
    bounds: { lower: Math.round(lowerBound), upper: Math.round(upperBound) },
  });

  const dataToUse = filteredPrices.length >= 3 ? filteredPrices : pricesPerM2;

  const avgPricePerM2 = Math.round(
    dataToUse.reduce((sum, p) => sum + p, 0) / dataToUse.length,
  );

  const sortedFiltered = [...dataToUse].sort((a, b) => a - b);
  const filteredMid = Math.floor(sortedFiltered.length / 2);
  const medianPricePerM2 =
    sortedFiltered.length % 2 === 0
      ? Math.round((sortedFiltered[filteredMid - 1] + sortedFiltered[filteredMid]) / 2)
      : sortedFiltered[filteredMid];

  const variance =
    dataToUse.reduce((sum, p) => sum + Math.pow(p - avgPricePerM2, 2), 0) /
    dataToUse.length;
  const stdDeviation = Math.round(Math.sqrt(variance));

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
