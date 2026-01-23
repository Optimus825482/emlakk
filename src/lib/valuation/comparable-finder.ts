import { db } from "@/db";
import { sql } from "drizzle-orm";
import { LocationPoint, PropertyFeatures, ComparableProperty } from "./types";
import { normalizeMahalle, mahalleMatches, normalizeIlce } from "./utils";

export async function findComparableProperties(
  location: LocationPoint,
  features: PropertyFeatures,
  maxDistance: number = 5,
): Promise<ComparableProperty[]> {
  try {
    const categoryMap: Record<PropertyFeatures["propertyType"], string[]> = {
      konut: ["konut"], arsa: ["arsa"], isyeri: ["isyeri"], sanayi: ["isyeri"], tarim: ["arsa"],
    };
    const categories = categoryMap[features.propertyType] || ["konut"];
    const searchStrategies = [
      { name: "Dar Filtre (Mahalle + Alan ±10%)", areaMultiplier: 0.1, includeDistrict: true, includeMahalle: true, includeNeighbors: false, minResults: 3 },
      { name: "Orta Filtre (Mahalle + Alan ±20%)", areaMultiplier: 0.2, includeDistrict: true, includeMahalle: true, includeNeighbors: false, minResults: 3 },
      { name: "Geniş Filtre (İlçe + Alan ±30%)", areaMultiplier: 0.3, includeDistrict: true, includeMahalle: false, includeNeighbors: false, minResults: 3 },
    ];

    for (const strategy of searchStrategies) {
      const results = await searchWithStrategy(location, features, categories, strategy);
      if (results.length >= strategy.minResults) return results;
    }
    return [];
  } catch (error) {
    console.error("Comparable properties search error:", error);
    return [];
  }
}

async function searchWithStrategy(
  location: LocationPoint,
  features: PropertyFeatures,
  categories: string[],
  strategy: { areaMultiplier: number; includeDistrict: boolean; includeMahalle?: boolean; includeNeighbors: boolean },
): Promise<ComparableProperty[]> {
  const minArea = features.area * (1 - strategy.areaMultiplier);
  const maxArea = features.area * (1 + strategy.areaMultiplier);
  const ilce = location.ilce || "";
  const mahalle = location.mahalle || "";
  let locationFilter = sql``;
  const normalizedMahalle = normalizeMahalle(mahalle);
  
  if (strategy.includeMahalle && normalizedMahalle && ilce) {
    locationFilter = sql`AND ilce = ${ilce} AND (LOWER(mahalle) ILIKE ${`%${normalizedMahalle}%`} OR LOWER(konum) ILIKE ${`%${normalizedMahalle}%`})`;
  } else if (strategy.includeDistrict && ilce) {
    locationFilter = sql`AND ilce = ${ilce}`;
  }

  const categoryArray = `{${categories.join(",")}}`;
  const results = await db.execute(sql`
    WITH all_listings AS (
      SELECT id::text, baslik, fiyat, m2, konum, category, transaction, koordinatlar, ozellikler, ek_ozellikler, ilce, mahalle, crawled_at, 'active' as status FROM sahibinden_liste WHERE transaction = 'satilik'
      UNION ALL
      SELECT listing_id::text as id, baslik, last_price as fiyat, COALESCE(m2, '0') as m2, konum, category, transaction, NULL as koordinatlar, NULL as ozellikler, NULL as ek_ozellikler, ilce, mahalle, removed_at as crawled_at, 'archived' as status FROM removed_listings WHERE transaction = 'satilik' AND removed_at >= NOW() - INTERVAL '180 days'
    )
    SELECT * FROM all_listings
    WHERE category = ANY(${sql.raw(`'${categoryArray}'::text[]`)}) AND fiyat > 10000 AND m2 IS NOT NULL AND m2 != ''
    AND CAST(REGEXP_REPLACE(NULLIF(m2, '0'), '[^0-9]', '', 'g') AS INTEGER) BETWEEN ${Math.floor(minArea)} AND ${Math.ceil(maxArea)}
    ${locationFilter}
    ORDER BY (status = 'active') DESC, crawled_at DESC LIMIT 100
  `);

  const rows = Array.isArray(results) ? results : (((results as any).rows || []) as any[]);
  if (!rows || rows.length === 0) return [];

  const rawComparables = (rows || [])
    .map((row) => {
      const m2Value = parseInt(row.m2?.toString().replace(/\D/g, "") || "0") || 1;
      const fiyat = Number(row.fiyat) || 0;
      if (m2Value < minArea || m2Value > maxArea) return null;
      let similarity = calculateSimilarityScore(features, { area: m2Value, ilce: row.ilce, mahalle: row.mahalle, ozellikler: row.ozellikler }, location);
      if (!row.koordinatlar) similarity = Math.max(0, similarity - 15);
      if (row.status === 'archived') similarity = Math.max(0, similarity - 5);
      const pricePerM2 = Math.round(fiyat / m2Value);
      if (pricePerM2 > 200000 || pricePerM2 < 1000) return null;
      return { id: row.id, baslik: row.baslik || "", fiyat, m2: m2Value, konum: row.konum || "", distance: 0, pricePerM2, similarity, status: row.status as "active" | "archived" } as ComparableProperty;
    })
    .filter((c): c is ComparableProperty => c !== null && c.similarity >= 25);

  if (rawComparables.length >= 4) {
    const sortedPrices = [...rawComparables].map(c => c.pricePerM2).sort((a, b) => a - b);
    const q1 = sortedPrices[Math.floor(sortedPrices.length * 0.25)];
    const q3 = sortedPrices[Math.floor(sortedPrices.length * 0.75)];
    const iqr = q3 - q1;
    return rawComparables
      .filter(c => c.pricePerM2 >= (q1 - 1.5 * iqr) && c.pricePerM2 <= (q3 + 1.5 * iqr))
      .sort((a, b) => b.similarity - a.similarity).slice(0, 20);
  }
  return rawComparables.sort((a, b) => b.similarity - a.similarity).slice(0, 20);
}

function calculateSimilarityScore(targetFeatures: PropertyFeatures, comparable: any, targetLocation: LocationPoint): number {
  let score = 0;
  const areaDiff = Math.abs(targetFeatures.area - comparable.area) / targetFeatures.area;
  if (areaDiff <= 0.1) score += 30; else if (areaDiff <= 0.2) score += 24; else if (areaDiff <= 0.3) score += 18; else score += 10;
  if (targetLocation.mahalle && comparable.mahalle) {
    const matchResult = mahalleMatches(targetLocation.mahalle, comparable.mahalle);
    if (matchResult.type === "exact") score += 35; else if (matchResult.type === "partial") score += 25;
  }
  if (targetLocation.ilce && comparable.ilce && normalizeIlce(targetLocation.ilce) === normalizeIlce(comparable.ilce)) score += 15;
  return Math.min(Math.round(score), 100);
}

export async function findNeighborhoodAverage(location: LocationPoint, propertyType: PropertyFeatures["propertyType"]) {
  try {
    const ilce = location.ilce || "";
    const mahalle = location.mahalle || "";
    const normalizedMahalle = normalizeMahalle(mahalle);
    if (!ilce) return { avgPricePerM2: 0, count: 0, priceRange: { min: 0, max: 0 } };
    const results = await db.execute(sql`
      WITH all_listings AS (
        SELECT fiyat, m2, ilce, mahalle, konum FROM sahibinden_liste WHERE transaction = 'satilik' AND fiyat > 10000
        UNION ALL
        SELECT last_price as fiyat, m2, ilce, mahalle, konum FROM removed_listings WHERE transaction = 'satilik' AND last_price > 10000 AND removed_at >= NOW() - INTERVAL '180 days'
      )
      SELECT CAST(fiyat AS BIGINT) / CAST(REGEXP_REPLACE(NULLIF(m2, '0'), '[^0-9]', '', 'g') AS INTEGER) as price_per_m2
      FROM all_listings WHERE ilce = ${ilce} AND (LOWER(mahalle) ILIKE ${`%${normalizedMahalle}%`} OR LOWER(konum) ILIKE ${`%${normalizedMahalle}%` food})
    `);
    const rows = Array.isArray(results) ? results : (((results as any).rows || []) as any[]);
    const prices = rows.map((r: any) => Number(r.price_per_m2)).filter((p) => p > 1000 && p < 200000);
    if (prices.length === 0) return { avgPricePerM2: 0, count: 0, priceRange: { min: 0, max: 0 } };
    const sorted = [...prices].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const filtered = prices.filter(p => p >= (q1 - 1.5 * iqr) && p <= (q3 + 1.5 * iqr));
    const data = filtered.length >= 2 ? filtered : prices;
    const avg = Math.round(data.reduce((s, p) => s + p, 0) / data.length);
    return { avgPricePerM2: avg, count: data.length, priceRange: { min: Math.min(...data), max: Math.max(...data) } };
  } catch (e) { return { avgPricePerM2: 0, count: 0, priceRange: { min: 0, max: 0 } }; }
}

export async function findProvinceBenchmark(features: PropertyFeatures) {
  try {
    const results = await db.execute(sql`
      SELECT CAST(fiyat AS BIGINT) / CAST(REGEXP_REPLACE(NULLIF(m2, '0'), '[^0-9]', '', 'g') AS INTEGER) as price_per_m2
      FROM sahibinden_liste WHERE transaction = 'satilik' AND fiyat > 50000 AND m2 IS NOT NULL AND m2 != ''
      AND CAST(REGEXP_REPLACE(NULLIF(m2, '0'), '[^0-9]', '', 'g') AS INTEGER) BETWEEN ${features.area * 0.7} AND ${features.area * 1.3}
    `);
    const rows = Array.isArray(results) ? results : (((results as any).rows || []) as any[]);
    const prices = rows.map((r: any) => Number(r.price_per_m2)).filter((p) => p > 1000 && p < 150000);
    if (prices.length === 0) return { avgPricePerM2: 0, count: 0, priceRange: { min: 0, max: 0 } };
    const sorted = [...prices].sort((a, b) => a - b);
    const avg = Math.round(sorted.reduce((s, p) => s + p, 0) / sorted.length);
    return { avgPricePerM2: avg, count: sorted.length, priceRange: { min: Math.min(...sorted), max: Math.max(...sorted) } };
  } catch (e) { return { avgPricePerM2: 0, count: 0, priceRange: { min: 0, max: 0 } }; }
}

export function calculateMarketStatistics(comparables: ComparableProperty[]) {
  if (comparables.length === 0) return { avgPricePerM2: 0, medianPricePerM2: 0, stdDeviation: 0, priceRange: { min: 0, max: 0 }, outlierCount: 0 };
  const prices = comparables.map((c) => c.pricePerM2);
  const avg = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);
  const sorted = [...prices].sort((a, b) => a - b);
  const variance = prices.reduce((s, p) => s + Math.pow(p - avg, 2), 0) / prices.length;
  return { avgPricePerM2: avg, medianPricePerM2: sorted[Math.floor(sorted.length / 2)], stdDeviation: Math.sqrt(variance), priceRange: { min: Math.min(...prices), max: Math.max(...prices) }, outlierCount: 0 };
}
