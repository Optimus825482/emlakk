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
  findProvinceBenchmark,
  findNeighborhoodAverage,
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

    console.log("📊 Market Statistics:", {
      avgPricePerM2: marketStats.avgPricePerM2,
      medianPricePerM2: marketStats.medianPricePerM2,
      outliers: marketStats.outlierCount,
      comparables: comparableProperties.length,
    });

    // 5. İl geneli benchmark (metrekare bazlı - tüm bina yaşları)
    console.log("🌍 İl geneli benchmark hesaplanıyor...");
    const provinceBenchmark = await findProvinceBenchmark(features);

    // Bina yaşı amortisman faktörü uygula (her +5 yıl = %5 düşüş)
    let adjustedProvincePricePerM2 = provinceBenchmark.avgPricePerM2;
    if (
      features.propertyType === "konut" &&
      features.buildingAge &&
      provinceBenchmark.avgPricePerM2 > 0
    ) {
      const depreciationFactor = 1 - (features.buildingAge / 5) * 0.05;
      const clampedFactor = Math.max(0.5, Math.min(1.0, depreciationFactor)); // Min %50, Max %100
      adjustedProvincePricePerM2 = Math.round(
        provinceBenchmark.avgPricePerM2 * clampedFactor,
      );

      console.log("📉 Bina Yaşı Amortisman Faktörü:", {
        buildingAge: features.buildingAge,
        depreciationFactor: clampedFactor,
        originalPricePerM2: provinceBenchmark.avgPricePerM2,
        adjustedPricePerM2: adjustedProvincePricePerM2,
        discount: `${((1 - clampedFactor) * 100).toFixed(1)}%`,
      });
    }

    console.log("📊 Province Benchmark:", {
      avgPricePerM2: adjustedProvincePricePerM2,
      originalAvg: provinceBenchmark.avgPricePerM2,
      count: provinceBenchmark.count,
      priceRange: provinceBenchmark.priceRange,
    });

    // 6. Mahalle mikro-piyasa analizi (YENİ!)
    console.log("🏘️ Mahalle mikro-piyasa analizi yapılıyor...");
    const neighborhoodAvg = await findNeighborhoodAverage(
      location,
      features.propertyType,
    );

    console.log("📊 Neighborhood Average:", {
      avgPricePerM2: neighborhoodAvg.avgPricePerM2,
      count: neighborhoodAvg.count,
      priceRange: neighborhoodAvg.priceRange,
    });

    // 7. 3 Katmanlı Ağırlıklı Ortalama (Mahalle Öncelikli)
    // Mahalle eşleşmesi varsa: Yerel %40, Mahalle %45, İl %15
    // Mahalle yoksa: Yerel %85, İl %15
    let finalAvgPricePerM2 = marketStats.avgPricePerM2;
    let weights = {
      local: 1.0,
      neighborhood: 0,
      province: 0,
    };

    if (
      neighborhoodAvg.count > 0 &&
      neighborhoodAvg.avgPricePerM2 > 0 &&
      provinceBenchmark.count > 0 &&
      adjustedProvincePricePerM2 > 0
    ) {
      finalAvgPricePerM2 = Math.round(
        marketStats.avgPricePerM2 * 0.40 +
          neighborhoodAvg.avgPricePerM2 * 0.45 +
          adjustedProvincePricePerM2 * 0.15,
      );
      weights = { local: 0.40, neighborhood: 0.45, province: 0.15 };

      console.log("⚖️ 3 Katmanlı Ağırlıklı Ortalama (Mahalle Öncelikli):", {
        local: marketStats.avgPricePerM2,
        neighborhood: neighborhoodAvg.avgPricePerM2,
        province: adjustedProvincePricePerM2,
        weighted: finalAvgPricePerM2,
        formula:
          "40% yerel + 45% mahalle + 15% il geneli",
      });
    } else if (provinceBenchmark.count > 0 && adjustedProvincePricePerM2 > 0) {
      // Sadece il geneli: %85 + %15
      finalAvgPricePerM2 = Math.round(
        marketStats.avgPricePerM2 * 0.85 + adjustedProvincePricePerM2 * 0.15,
      );
      weights = { local: 0.85, neighborhood: 0, province: 0.15 };

      console.log("⚖️ 2 Katmanlı Ağırlıklı Ortalama:", {
        local: marketStats.avgPricePerM2,
        province: adjustedProvincePricePerM2,
        weighted: finalAvgPricePerM2,
        formula: "85% yerel + 15% il geneli (amortisman uygulanmış)",
      });
    } else if (neighborhoodAvg.count > 0 && neighborhoodAvg.avgPricePerM2 > 0) {
      // Sadece mahalle: %65 + %35
      finalAvgPricePerM2 = Math.round(
        marketStats.avgPricePerM2 * 0.65 + neighborhoodAvg.avgPricePerM2 * 0.35,
      );
      weights = { local: 0.65, neighborhood: 0.35, province: 0 };

      console.log("⚖️ 2 Katmanlı Ağırlıklı Ortalama:", {
        local: marketStats.avgPricePerM2,
        neighborhood: neighborhoodAvg.avgPricePerM2,
        weighted: finalAvgPricePerM2,
        formula: "65% yerel + 35% mahalle",
      });
    } else {
      console.log("⚠️ Sadece yerel veri kullanılıyor (%100)");
    }

    // 8. Temel değerleme hesapla (ağırlıklı ortalama + konum skoru etkisi)
    const baseValue = finalAvgPricePerM2 * features.area;

// Konum skoru etkisi: %0 ile %10 arasında artış/azalış (düşürüldü)
    const locationMultiplier = 1 + ((locationScore.total - 50) / 100) * 0.1;
    const adjustedValue = baseValue * locationMultiplier;

    // 8. Standart sapma ile fiyat aralığı belirle
    const priceRange = {
      min: Math.round(adjustedValue - marketStats.stdDeviation * features.area),
      max: Math.round(adjustedValue + marketStats.stdDeviation * features.area),
    };

    // 9. Güven skoru hesapla
    const confidenceScore = calculateConfidenceScore(
      comparableProperties.length,
      marketStats.stdDeviation,
      finalAvgPricePerM2,
      locationScore.total,
      provinceBenchmark.count,
      neighborhoodAvg.count,
    );

    // 10. AI insights oluştur
    const aiInsights = generateAIInsights(
      adjustedValue,
      marketStats,
      locationScore,
      comparableProperties.length,
      provinceBenchmark,
      neighborhoodAvg,
      adjustedProvincePricePerM2,
    );

    // 11. Metodoloji açıklaması
    const methodology = generateMethodology(
      comparableProperties.length,
      marketStats,
      locationScore,
      provinceBenchmark,
      neighborhoodAvg,
      weights,
      features,
      adjustedProvincePricePerM2,
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
  provinceBenchmarkCount: number,
  neighborhoodCount: number,
): number {
  let score = 0;

  // 1. Karşılaştırma sayısı (0-30 puan)
  if (comparableCount >= 15) score += 30;
  else if (comparableCount >= 10) score += 25;
  else if (comparableCount >= 5) score += 18;
  else score += 10;

  // 2. Veri tutarlılığı - Standart sapma (0-20 puan)
  const coefficientOfVariation = stdDeviation / avgPrice;
  if (coefficientOfVariation <= 0.15)
    score += 20; // %15 varyasyon
  else if (coefficientOfVariation <= 0.25)
    score += 16; // %25 varyasyon
  else if (coefficientOfVariation <= 0.35)
    score += 12; // %35 varyasyon
  else score += 6;

  // 3. Konum skoru (0-15 puan)
  score += (locationScore / 100) * 15;

  // 4. Mahalle mikro-piyasa bonus (0-20 puan) - YENİ!
  if (neighborhoodCount >= 20) score += 20;
  else if (neighborhoodCount >= 10) score += 15;
  else if (neighborhoodCount >= 5) score += 10;
  else if (neighborhoodCount >= 3) score += 5;

  // 5. İl geneli benchmark bonus (0-15 puan)
  if (provinceBenchmarkCount >= 50) score += 15;
  else if (provinceBenchmarkCount >= 30) score += 12;
  else if (provinceBenchmarkCount >= 15) score += 8;
  else if (provinceBenchmarkCount >= 5) score += 4;

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
  provinceBenchmark: { avgPricePerM2: number; count: number },
  neighborhoodAvg: { avgPricePerM2: number; count: number },
  adjustedProvincePricePerM2: number,
): string {
  const insights: string[] = [];

  const layers: string[] = [];
  if (comparableCount > 0) layers.push("yerel");
  if (neighborhoodAvg.count > 0) layers.push("mahalle");
  if (provinceBenchmark.count > 0) layers.push("il geneli");

  if (layers.length > 0) {
    insights.push(
      `${layers.join(", ")} bazlı değerlendirmeler yapılmış olup tahmini değer ${(estimatedValue / 1000000).toFixed(2)}M TL olarak hesaplanmıştır.`,
    );
  }

  if (neighborhoodAvg.count > 0) {
    const localAvg = marketStats.avgPricePerM2;
    const neighborhoodPrice = neighborhoodAvg.avgPricePerM2;
    const diff = ((localAvg / neighborhoodPrice - 1) * 100).toFixed(1);

    if (Math.abs(parseFloat(diff)) < 5) {
      insights.push("Seçilen konum mahalle ortalamasına çok yakın.");
    } else if (parseFloat(diff) > 0) {
      insights.push(
        `Bu konum mahalle ortalamasının %${diff} üzerinde değerleniyor.`,
      );
    } else {
      insights.push(
        `Bu konum mahalle ortalamasının %${Math.abs(parseFloat(diff))} altında değerleniyor.`,
      );
    }
  }

  if (provinceBenchmark.count > 0 && neighborhoodAvg.count > 0) {
    const neighborhoodPrice = neighborhoodAvg.avgPricePerM2;
    const provinceAvg = adjustedProvincePricePerM2;
    const diff = ((neighborhoodPrice / provinceAvg - 1) * 100).toFixed(1);

    if (Math.abs(parseFloat(diff)) < 5) {
      insights.push("Mahalle fiyatları il geneli ortalamasına yakın.");
    } else if (parseFloat(diff) > 0) {
      insights.push(
        `Bu mahalle il geneli ortalamasının %${diff} üzerinde fiyatlanıyor.`,
      );
    } else {
      insights.push(
        `Bu mahalle il geneli ortalamasının %${Math.abs(parseFloat(diff))} altında fiyatlanıyor.`,
      );
    }
  }

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
  provinceBenchmark: { avgPricePerM2: number; count: number },
  neighborhoodAvg: { avgPricePerM2: number; count: number },
  weights: { local: number; neighborhood: number; province: number },
  features: PropertyFeatures,
  adjustedProvincePricePerM2: number,
): string {
  let methodology = `
Bu değerleme ${comparableCount} yerel benzer ilan üzerinden yapılmıştır.`;

  // Mahalle analizi
  if (neighborhoodAvg.count > 0) {
    methodology += `
Aynı mahallede ${neighborhoodAvg.count} satılık konut analiz edilmiş, 
mahalle ortalaması ${neighborhoodAvg.avgPricePerM2.toLocaleString("tr-TR")} TL/m² olarak hesaplanmıştır.`;
  }

  // İl geneli analizi
  if (provinceBenchmark.count > 0) {
    const depreciationFactor =
      features.buildingAge && features.propertyType === "konut"
        ? 1 - (features.buildingAge / 5) * 0.05
        : 1.0;
    const clampedFactor = Math.max(0.5, Math.min(1.0, depreciationFactor));

    methodology += `
İl genelinde ${provinceBenchmark.count} benzer ilan (alan ±10%, tüm bina yaşları) analiz edilmiş,
il geneli ortalama ${provinceBenchmark.avgPricePerM2.toLocaleString("tr-TR")} TL/m² olarak hesaplanmıştır.`;

    if (features.buildingAge && features.propertyType === "konut") {
      methodology += `
Bina yaşı amortisman faktörü uygulanmıştır: ${features.buildingAge} yıl → %${((1 - clampedFactor) * 100).toFixed(1)} düşüş.
Amortisman sonrası il geneli: ${adjustedProvincePricePerM2.toLocaleString("tr-TR")} TL/m².`;
    }
  }

  // Ağırlıklı ortalama formülü
  if (weights.neighborhood > 0 && weights.province > 0) {
    methodology += `
Final m² fiyatı: %${weights.local * 100} yerel + %${weights.neighborhood * 100} mahalle + %${weights.province * 100} il geneli ağırlıklı ortalaması ile hesaplanmıştır.`;
  } else if (weights.province > 0) {
    methodology += `
Final m² fiyatı: %${weights.local * 100} yerel + %${weights.province * 100} il geneli ağırlıklı ortalaması ile hesaplanmıştır.`;
  } else if (weights.neighborhood > 0) {
    methodology += `
Final m² fiyatı: %${weights.local * 100} yerel + %${weights.neighborhood * 100} mahalle ağırlıklı ortalaması ile hesaplanmıştır.`;
  }

methodology += `
Konum skoru (${locationScore.total}/100) değerlemeye %${(((locationScore.total - 50) / 100) * 10).toFixed(1)} etki etmiştir.
Yakındaki ${locationScore.advantages.length} avantaj ve ${locationScore.disadvantages.length} dezavantaj faktörü analiz edilmiştir.`;

  return methodology.trim();
}
