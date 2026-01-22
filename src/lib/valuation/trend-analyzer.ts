import { db } from "@/db";
import { sql } from "drizzle-orm";
import { PropertyFeatures, LocationPoint } from "./types";
import { normalizeMahalle } from "./utils";

export interface PriceTrendData {
  period: string;
  avgPricePerM2: number;
  count: number;
  minPrice: number;
  maxPrice: number;
}

export interface TrendAnalysis {
  trend: "rising" | "stable" | "falling";
  trendPercentage: number;
  monthlyData: PriceTrendData[];
  weeklyData: PriceTrendData[];
  description: string;
}

export async function analyzePriceTrend(
  location: LocationPoint,
  features: PropertyFeatures,
  monthsBack: number = 6,
): Promise<TrendAnalysis> {
  try {
    const ilce = location.ilce || "";
    const mahalle = location.mahalle || "";
    const normalizedMahalle = normalizeMahalle(mahalle);

    const categoryMap: Record<PropertyFeatures["propertyType"], string[]> = {
      konut: ["konut"],
      arsa: ["arsa"],
      isyeri: ["isyeri"],
      sanayi: ["isyeri"],
      tarim: ["arsa"],
    };

    const categories = categoryMap[features.propertyType] || ["konut"];
    const categoryArray = `{${categories.join(",")}}`;

    const minArea = features.area * 0.7;
    const maxArea = features.area * 1.3;

    let locationFilter = sql``;
    if (ilce) {
      locationFilter = sql`AND ilce = ${ilce}`;
      if (normalizedMahalle) {
        locationFilter = sql`AND ilce = ${ilce} AND (
          LOWER(mahalle) ILIKE ${`%${normalizedMahalle}%`} 
          OR LOWER(mahalle) ILIKE ${`%${normalizedMahalle} mh%`}
        )`;
      }
    }

    const monthlyResults = await db.execute(sql`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', crawled_at), 'YYYY-MM') as period,
        AVG(CAST(fiyat AS BIGINT) / CAST(REGEXP_REPLACE(m2, '[^0-9]', '', 'g') AS INTEGER)) as avg_price_per_m2,
        COUNT(*) as count,
        MIN(CAST(fiyat AS BIGINT) / CAST(REGEXP_REPLACE(m2, '[^0-9]', '', 'g') AS INTEGER)) as min_price,
        MAX(CAST(fiyat AS BIGINT) / CAST(REGEXP_REPLACE(m2, '[^0-9]', '', 'g') AS INTEGER)) as max_price
      FROM sahibinden_liste
      WHERE 
        category = ANY(${sql.raw(`'${categoryArray}'::text[]`)})
        AND transaction = 'satilik'
        AND fiyat IS NOT NULL 
        AND fiyat > 0
        AND m2 IS NOT NULL
        AND CAST(REGEXP_REPLACE(m2, '[^0-9]', '', 'g') AS INTEGER) BETWEEN ${Math.floor(minArea)} AND ${Math.ceil(maxArea)}
        AND crawled_at >= NOW() - (${monthsBack} || ' months')::interval
        ${locationFilter}
      GROUP BY DATE_TRUNC('month', crawled_at)
      ORDER BY period ASC
    `);

    const weeklyResults = await db.execute(sql`
      SELECT 
        TO_CHAR(DATE_TRUNC('week', crawled_at), 'YYYY-"W"IW') as period,
        AVG(CAST(fiyat AS BIGINT) / CAST(REGEXP_REPLACE(m2, '[^0-9]', '', 'g') AS INTEGER)) as avg_price_per_m2,
        COUNT(*) as count,
        MIN(CAST(fiyat AS BIGINT) / CAST(REGEXP_REPLACE(m2, '[^0-9]', '', 'g') AS INTEGER)) as min_price,
        MAX(CAST(fiyat AS BIGINT) / CAST(REGEXP_REPLACE(m2, '[^0-9]', '', 'g') AS INTEGER)) as max_price
      FROM sahibinden_liste
      WHERE 
        category = ANY(${sql.raw(`'${categoryArray}'::text[]`)})
        AND transaction = 'satilik'
        AND fiyat IS NOT NULL 
        AND fiyat > 0
        AND m2 IS NOT NULL
        AND CAST(REGEXP_REPLACE(m2, '[^0-9]', '', 'g') AS INTEGER) BETWEEN ${Math.floor(minArea)} AND ${Math.ceil(maxArea)}
        AND crawled_at >= NOW() - '2 months'::interval
        ${locationFilter}
      GROUP BY DATE_TRUNC('week', crawled_at)
      ORDER BY period ASC
    `);

    const monthlyRows = Array.isArray(monthlyResults)
      ? monthlyResults
      : (((monthlyResults as any).rows || []) as any[]);

    const weeklyRows = Array.isArray(weeklyResults)
      ? weeklyResults
      : (((weeklyResults as any).rows || []) as any[]);

    const monthlyData: PriceTrendData[] = monthlyRows.map((row) => ({
      period: row.period,
      avgPricePerM2: Math.round(parseFloat(row.avg_price_per_m2) || 0),
      count: parseInt(row.count) || 0,
      minPrice: Math.round(parseFloat(row.min_price) || 0),
      maxPrice: Math.round(parseFloat(row.max_price) || 0),
    }));

    const weeklyData: PriceTrendData[] = weeklyRows.map((row) => ({
      period: row.period,
      avgPricePerM2: Math.round(parseFloat(row.avg_price_per_m2) || 0),
      count: parseInt(row.count) || 0,
      minPrice: Math.round(parseFloat(row.min_price) || 0),
      maxPrice: Math.round(parseFloat(row.max_price) || 0),
    }));

    const { trend, trendPercentage, description } = calculateTrend(monthlyData);

    console.log("📈 Fiyat Trendi Analizi:", {
      trend,
      trendPercentage,
      monthlyDataPoints: monthlyData.length,
      weeklyDataPoints: weeklyData.length,
    });

    return {
      trend,
      trendPercentage,
      monthlyData,
      weeklyData,
      description,
    };
  } catch (error) {
    console.error("Price trend analysis error:", error);
    return {
      trend: "stable",
      trendPercentage: 0,
      monthlyData: [],
      weeklyData: [],
      description: "Trend verisi hesaplanamadı",
    };
  }
}

function calculateTrend(data: PriceTrendData[]): {
  trend: "rising" | "stable" | "falling";
  trendPercentage: number;
  description: string;
} {
  if (data.length < 2) {
    return {
      trend: "stable",
      trendPercentage: 0,
      description: "Yeterli veri yok",
    };
  }

  const recentMonths = data.slice(-3);
  const olderMonths = data.slice(0, Math.max(1, data.length - 3));

  const recentAvg =
    recentMonths.reduce((sum, d) => sum + d.avgPricePerM2, 0) /
    recentMonths.length;
  const olderAvg =
    olderMonths.reduce((sum, d) => sum + d.avgPricePerM2, 0) /
    olderMonths.length;

  if (olderAvg === 0) {
    return {
      trend: "stable",
      trendPercentage: 0,
      description: "Karşılaştırma verisi yok",
    };
  }

  const changePercentage = ((recentAvg - olderAvg) / olderAvg) * 100;

  let trend: "rising" | "stable" | "falling";
  let description: string;

  if (changePercentage > 5) {
    trend = "rising";
    description = `Son ${recentMonths.length} ayda fiyatlar %${changePercentage.toFixed(1)} arttı`;
  } else if (changePercentage < -5) {
    trend = "falling";
    description = `Son ${recentMonths.length} ayda fiyatlar %${Math.abs(changePercentage).toFixed(1)} düştü`;
  } else {
    trend = "stable";
    description = `Fiyatlar son ${data.length} ayda stabil seyrediyor`;
  }

  return {
    trend,
    trendPercentage: Math.round(changePercentage * 10) / 10,
    description,
  };
}

export async function getMarketSummary(
  location: LocationPoint,
  features: PropertyFeatures,
): Promise<{
  totalListings: number;
  avgDaysOnMarket: number;
  pricePerM2Range: { min: number; max: number; avg: number };
  trendAnalysis: TrendAnalysis;
}> {
  const trendAnalysis = await analyzePriceTrend(location, features);

  const ilce = location.ilce || "";
  const categoryMap: Record<PropertyFeatures["propertyType"], string[]> = {
    konut: ["konut"],
    arsa: ["arsa"],
    isyeri: ["isyeri"],
    sanayi: ["isyeri"],
    tarim: ["arsa"],
  };

  const categories = categoryMap[features.propertyType] || ["konut"];
  const categoryArray = `{${categories.join(",")}}`;

  const minArea = features.area * 0.7;
  const maxArea = features.area * 1.3;

  let locationFilter = sql``;
  if (ilce) {
    locationFilter = sql`AND ilce = ${ilce}`;
  }

  const summaryResults = await db.execute(sql`
    SELECT 
      COUNT(*) as total_listings,
      AVG(EXTRACT(EPOCH FROM (NOW() - crawled_at)) / 86400) as avg_days,
      MIN(CAST(fiyat AS BIGINT) / CAST(REGEXP_REPLACE(m2, '[^0-9]', '', 'g') AS INTEGER)) as min_price_per_m2,
      MAX(CAST(fiyat AS BIGINT) / CAST(REGEXP_REPLACE(m2, '[^0-9]', '', 'g') AS INTEGER)) as max_price_per_m2,
      AVG(CAST(fiyat AS BIGINT) / CAST(REGEXP_REPLACE(m2, '[^0-9]', '', 'g') AS INTEGER)) as avg_price_per_m2
    FROM sahibinden_liste
    WHERE 
      category = ANY(${sql.raw(`'${categoryArray}'::text[]`)})
      AND transaction = 'satilik'
      AND fiyat IS NOT NULL 
      AND fiyat > 0
      AND m2 IS NOT NULL
      AND CAST(REGEXP_REPLACE(m2, '[^0-9]', '', 'g') AS INTEGER) BETWEEN ${Math.floor(minArea)} AND ${Math.ceil(maxArea)}
      ${locationFilter}
  `);

  const rows = Array.isArray(summaryResults)
    ? summaryResults
    : (((summaryResults as any).rows || []) as any[]);

  const row = rows[0] || {};

  return {
    totalListings: parseInt(row.total_listings) || 0,
    avgDaysOnMarket: Math.round(parseFloat(row.avg_days) || 0),
    pricePerM2Range: {
      min: Math.round(parseFloat(row.min_price_per_m2) || 0),
      max: Math.round(parseFloat(row.max_price_per_m2) || 0),
      avg: Math.round(parseFloat(row.avg_price_per_m2) || 0),
    },
    trendAnalysis,
  };
}
