// Ana Değerleme Motoru - Tüm Bileşenleri Birleştir

import {
  LocationPoint,
  PropertyFeatures,
  ValuationResult,
  LocationScore,
} from "./types";
import { detectNearbyPOIs, calculateLocationScore } from "./poi-detector";
import {
  findComparableProperties,
  calculateMarketStatistics,
} from "./comparable-finder";

/**
 * Mülk değerleme - Ana fonksiyon
 */
export async function performValuation(
  location: LocationPoint,
  features: PropertyFeatures,
): Promise<ValuationResult> {
  try {
    // 1. Yakındaki önemli noktaları tespit et (POI)
    console.log("🔍 POI tespiti yapılıyor...");
    const nearbyPOIs = await detectNearbyPOIs(location);

    // 2. Konum skoru hesapla
    console.log("📊 Konum skoru hesaplanıyor...");
    const locationScoreData = calculateLocationScore(nearbyPOIs);
    const locationScore: LocationScore = {
      total: locationScoreData.total,
      breakdown: {
        proximity: locationScoreData.breakdown.proximity || 0,
        transportation: locationScoreData.breakdown.transportation || 0,
        amenities: locationScoreData.breakdown.amenities || 0,
        education: locationScoreData.breakdown.education || 0,
        health: locationScoreData.breakdown.health || 0,
        environment: locationScoreData.breakdown.environment || 0,
      },
      advantages: locationScoreData.advantages,
      disadvantages: locationScoreData.disadvantages,
    };

    // 3. Benzer ilanları bul
    console.log("🏘️ Benzer ilanlar aranıyor...");
    const comparableProperties = await findComparableProperties(
      location,
      features,
    );

    if (comparableProperties.length === 0) {
      throw new Error("Yeterli karşılaştırma verisi bulunamadı");
    }

    // 4. Piyasa istatistikleri hesapla
    console.log("📈 Piyasa analizi yapılıyor...");
    const marketStats = calculateMarketStatistics(comparableProperties);

    // 5. Temel değerleme hesapla (ortalama + konum skoru etkisi)
    const baseValue = marketStats.avgPricePerM2 * features.area;

    // Konum skoru etkisi: %0 ile %20 arasında artış/azalış
    const locationMultiplier = 1 + ((locationScore.total - 50) / 100) * 0.2;
    const adjustedValue = baseValue * locationMultiplier;

    // 6. Standart sapma ile fiyat aralığı belirle
    const priceRange = {
      min: Math.round(adjustedValue - marketStats.stdDeviation * features.area),
      max: Math.round(adjustedValue + marketStats.stdDeviation * features.area),
    };

    // 7. Güven skoru hesapla
    const confidenceScore = calculateConfidenceScore(
      comparableProperties.length,
      marketStats.stdDeviation,
      marketStats.avgPricePerM2,
      locationScore.total,
    );

    // 8. AI insights oluştur
    const aiInsights = generateAIInsights(
      adjustedValue,
      marketStats,
      locationScore,
      comparableProperties.length,
    );

    // 9. Metodoloji açıklaması
    const methodology = generateMethodology(
      comparableProperties.length,
      marketStats,
      locationScore,
    );

    return {
      estimatedValue: Math.round(adjustedValue),
      priceRange,
      confidenceScore,
      pricePerM2: Math.round(adjustedValue / features.area),
      locationScore,
      marketAnalysis: {
        avgPricePerM2: marketStats.avgPricePerM2,
        medianPricePerM2: marketStats.medianPricePerM2,
        stdDeviation: marketStats.stdDeviation,
        totalComparables: comparableProperties.length,
        priceRange: {
          min: marketStats.priceRange.min * features.area,
          max: marketStats.priceRange.max * features.area,
        },
        trend: determineTrend(comparableProperties),
        trendPercentage: 0, // TODO: Zaman serisi analizi ile hesaplanabilir
      },
      comparableProperties: comparableProperties.slice(0, 10), // İlk 10 sonuç
      nearbyPOIs,
      aiInsights,
      methodology,
    };
  } catch (error) {
    console.error("Valuation error:", error);
    throw error;
  }
}

/**
 * Güven skoru hesapla (0-100)
 */
function calculateConfidenceScore(
  comparableCount: number,
  stdDeviation: number,
  avgPrice: number,
  locationScore: number,
): number {
  let score = 0;

  // 1. Karşılaştırma sayısı (0-40 puan)
  if (comparableCount >= 15) score += 40;
  else if (comparableCount >= 10) score += 35;
  else if (comparableCount >= 5) score += 25;
  else score += 15;

  // 2. Veri tutarlılığı - Standart sapma (0-30 puan)
  const coefficientOfVariation = stdDeviation / avgPrice;
  if (coefficientOfVariation <= 0.15)
    score += 30; // %15 varyasyon
  else if (coefficientOfVariation <= 0.25)
    score += 25; // %25 varyasyon
  else if (coefficientOfVariation <= 0.35)
    score += 20; // %35 varyasyon
  else score += 10;

  // 3. Konum skoru (0-30 puan)
  score += (locationScore / 100) * 30;

  return Math.min(Math.round(score), 100);
}

/**
 * Piyasa trendi belirle
 */
function determineTrend(comparables: any[]): "rising" | "stable" | "falling" {
  // TODO: Tarih bazlı analiz yapılabilir
  // Şimdilik stable döndür
  return "stable";
}

/**
 * AI insights oluştur
 */
function generateAIInsights(
  estimatedValue: number,
  marketStats: any,
  locationScore: LocationScore,
  comparableCount: number,
): string {
  const insights: string[] = [];

  // Değerleme özeti
  insights.push(
    `${comparableCount} benzer ilan analiz edilerek ${(estimatedValue / 1000000).toFixed(2)}M TL değerleme yapıldı.`,
  );

  // Piyasa durumu
  const avgValue = marketStats.avgPricePerM2;
  const deviation = ((estimatedValue / avgValue - 1) * 100).toFixed(1);
  if (Math.abs(parseFloat(deviation)) < 5) {
    insights.push("Değerleme piyasa ortalamasına çok yakın.");
  } else if (parseFloat(deviation) > 0) {
    insights.push(`Değerleme piyasa ortalamasının %${deviation} üzerinde.`);
  } else {
    insights.push(
      `Değerleme piyasa ortalamasının %${Math.abs(parseFloat(deviation))} altında.`,
    );
  }

  // Konum değerlendirmesi
  if (locationScore.total >= 80) {
    insights.push("Konum çok avantajlı - sosyal tesislere ve ulaşıma yakın.");
  } else if (locationScore.total >= 60) {
    insights.push("Konum avantajlı - temel ihtiyaçlara erişim iyi.");
  } else if (locationScore.total >= 40) {
    insights.push("Konum orta seviye - bazı gelişim alanları mevcut.");
  } else {
    insights.push(
      "Konum gelişmeye açık - altyapı yatırımları değer artışı sağlayabilir.",
    );
  }

  // Avantajlar
  if (locationScore.advantages.length > 0) {
    insights.push(
      `Avantajlar: ${locationScore.advantages.slice(0, 3).join(", ")}.`,
    );
  }

  return insights.join(" ");
}

/**
 * Metodoloji açıklaması
 */
function generateMethodology(
  comparableCount: number,
  marketStats: any,
  locationScore: LocationScore,
): string {
  return `
Bu değerleme ${comparableCount} benzer satılık ilan üzerinden yapılmıştır. 
Ortalama m² fiyatı ${marketStats.avgPricePerM2.toLocaleString("tr-TR")} TL olarak hesaplanmış, 
standart sapma ${marketStats.stdDeviation.toLocaleString("tr-TR")} TL'dir. 
Konum skoru (${locationScore.total}/100) değerlemeye %${(((locationScore.total - 50) / 100) * 20).toFixed(1)} etki etmiştir.
Yakındaki ${locationScore.advantages.length} avantaj ve ${locationScore.disadvantages.length} dezavantaj faktörü analiz edilmiştir.
  `.trim();
}
