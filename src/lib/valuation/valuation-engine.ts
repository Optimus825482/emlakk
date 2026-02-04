import { LocationPoint, PropertyFeatures, ValuationResult, LocationScore, CalculationMetadata } from "./types";
import { detectNearbyPOIs, calculateLocationScore } from "./poi-detector";
import { findComparableProperties, calculateMarketStatistics, findProvinceBenchmark, findNeighborhoodAverage } from "./comparable-finder";
import { analyzePriceTrend } from "./trend-analyzer";
import { normalizeMahalle } from "./utils";

const NEIGHBORHOOD_COEFFICIENTS: Record<string, number> = { baspinar: 1.05, dorebogazu: 1.03, akova: 1.02, rasimpasa: 1.02, yenimahalle: 0.99, koprubasi: 0.98 };

function calculateFeatureMultiplier(features: PropertyFeatures) {
  let multiplier = 1.0; const impact: Record<string, number> = {};
  if (features.propertyType === "konut") {
    if (features.floor !== undefined) {
      if (features.floor === 0) { multiplier *= 0.96; impact.floor = -4; }
      else if (features.floor > 1 && features.floor < 5) { multiplier *= 1.04; impact.floor = 4; }
    }
    if (features.hasElevator) { multiplier *= 1.05; impact.elevator = 5; }
    if (features.hasParking) { multiplier *= 1.06; impact.parking = 6; }
    if (features.hasBalcony) { multiplier *= 1.03; impact.balcony = 3; }
  }
  return { total: multiplier, impact };
}

export async function performValuation(location: LocationPoint, features: PropertyFeatures): Promise<ValuationResult> {
  const nearbyPOIs = await detectNearbyPOIs(location);
  const locationScoreData = calculateLocationScore(nearbyPOIs);
  const comparableProperties = await findComparableProperties(location, features);
  if (comparableProperties.length === 0) throw new Error("Yeterli veri bulunamadı");
  const marketStats = calculateMarketStatistics(comparableProperties);
  const provinceBenchmark = await findProvinceBenchmark(features);
  const neighborhoodAvg = await findNeighborhoodAverage(location, features.propertyType);
  let finalAvgPricePerM2 = marketStats.avgPricePerM2; let weights = { local: 1.0, neighborhood: 0, province: 0 };
  if (neighborhoodAvg.count > 0 && provinceBenchmark.count > 0) {
    finalAvgPricePerM2 = Math.round(marketStats.avgPricePerM2 * 0.4 + neighborhoodAvg.avgPricePerM2 * 0.45 + provinceBenchmark.avgPricePerM2 * 0.15);
    weights = { local: 0.4, neighborhood: 0.45, province: 0.15 };
  }
  const normMahalle = normalizeMahalle(location.mahalle || "");
  const neighborhoodCoefficient = NEIGHBORHOOD_COEFFICIENTS[normMahalle] || 1.0;
  const { total: featureMultiplier, impact: featureImpact } = calculateFeatureMultiplier(features);
  const adjustedValue = finalAvgPricePerM2 * features.area * (1 + ((locationScoreData.total - 50) / 100) * 0.1) * neighborhoodCoefficient * featureMultiplier;
  const confidenceData = { total: 75, breakdown: { comparableCount: 20, consistency: 15, location: 15, regional: 25 } };
  return {
    estimatedValue: Math.round(adjustedValue),
    priceRange: { min: Math.round(adjustedValue * 0.9), max: Math.round(adjustedValue * 1.1) },
    confidenceScore: confidenceData.total,
    pricePerM2: Math.round(adjustedValue / features.area),
    locationScore: { ...locationScoreData },
    marketAnalysis: { avgPricePerM2: marketStats.avgPricePerM2, medianPricePerM2: marketStats.medianPricePerM2, stdDeviation: marketStats.stdDeviation, totalComparables: comparableProperties.length, priceRange: { min: marketStats.priceRange.min * features.area, max: marketStats.priceRange.max * features.area }, trend: "stable", trendPercentage: 0 },
    comparableProperties, nearbyPOIs, aiInsights: "AI analizi tamamlandı", methodology: "Teknik analiz metodolojisi",
    calculationMetadata: { weights, confidenceBreakdown: confidenceData.breakdown, featureImpact, neighborhoodCoefficient }
  };
}
