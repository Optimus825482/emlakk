/**
 * Valuation Types & Constants
 * @module types/admin/valuation
 * @description Merkezi değerleme tip tanımları - src/db/schema/valuations.ts ile uyumlu
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ValuationPropertyType =
  | "sanayi"
  | "tarim"
  | "konut"
  | "arsa"
  | "isyeri"
  | "diger";

export interface ValuationDetails {
  rooms?: string;
  bathrooms?: number;
  floors?: number;
  buildingAge?: number;
  heating?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface ValuationComparable {
  id: string;
  title: string;
  price: number;
  area: number;
  pricePerSqm: number;
  distance?: number;
  similarity?: number;
}

export interface ValuationTrends {
  priceChange?: number;
  marketDirection?: "up" | "down" | "stable";
  demandLevel?: "high" | "medium" | "low";
  averageDaysOnMarket?: number;
  [key: string]: string | number | undefined;
}

export interface Valuation {
  id: string;

  // Kullanıcı bilgileri
  name: string;
  email: string;
  phone: string;

  // Gayrimenkul temel özellikleri
  propertyType: ValuationPropertyType;
  address: string;
  city: string;
  district: string;
  area: number;

  // Detaylar
  details: ValuationDetails;

  // AI Tahmin sonuçları
  estimatedValue: string | null;
  minValue: string | null;
  maxValue: string | null;
  pricePerSqm: string | null;
  confidenceScore: string | null;

  // Analiz detayları
  marketAnalysis: string | null;
  comparables: ValuationComparable[];
  trends: ValuationTrends;

  // İzleme verileri
  ipAddress: string | null;
  userAgent: string | null;

  // Zaman damgaları
  createdAt: string;
  updatedAt: string;
}

// Tablo görünümü için minimal versiyon
export interface ValuationTableRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyType: ValuationPropertyType;
  district: string;
  area: number;
  estimatedValue: string | null;
  confidenceScore: string | null;
  createdAt: string;
}

// Değerleme talebi oluşturma için
export interface CreateValuationInput {
  name: string;
  email: string;
  phone: string;
  propertyType: ValuationPropertyType;
  address: string;
  city?: string;
  district: string;
  area: number;
  details?: ValuationDetails;
}

// ============================================================================
// LABEL CONSTANTS
// ============================================================================

export const valuationPropertyTypeLabels: Record<
  ValuationPropertyType,
  string
> = {
  sanayi: "Sanayi",
  tarim: "Tarım Arazisi",
  konut: "Konut",
  arsa: "Arsa",
  isyeri: "İşyeri",
  diger: "Diğer",
};

export const valuationPropertyTypeColors: Record<
  ValuationPropertyType,
  string
> = {
  sanayi:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  tarim: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  konut: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  arsa: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  isyeri:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  diger: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

// ============================================================================
// TYPE ICONS (Lucide icon names)
// ============================================================================

export const valuationPropertyTypeIcons: Record<ValuationPropertyType, string> =
  {
    sanayi: "Factory",
    tarim: "Wheat",
    konut: "Home",
    arsa: "Map",
    isyeri: "Briefcase",
    diger: "HelpCircle",
  };

// ============================================================================
// CONFIDENCE LEVELS
// ============================================================================

export type ConfidenceLevel = "high" | "medium" | "low";

export function getConfidenceLevel(
  score: string | number | null,
): ConfidenceLevel {
  if (score === null) return "low";
  const numScore = typeof score === "string" ? parseFloat(score) : score;
  if (numScore >= 0.8) return "high";
  if (numScore >= 0.5) return "medium";
  return "low";
}

export const confidenceLevelLabels: Record<ConfidenceLevel, string> = {
  high: "Yüksek Güven",
  medium: "Orta Güven",
  low: "Düşük Güven",
};

export const confidenceLevelColors: Record<ConfidenceLevel, string> = {
  high: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  medium:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  low: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getValuationPropertyTypeLabel(
  type: ValuationPropertyType,
): string {
  return valuationPropertyTypeLabels[type] || type;
}

export function formatValuationPrice(price: string | number | null): string {
  if (price === null) return "Hesaplanmadı";
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numPrice);
}

export function formatConfidenceScore(score: string | number | null): string {
  if (score === null) return "-";
  const numScore = typeof score === "string" ? parseFloat(score) : score;
  return `%${Math.round(numScore * 100)}`;
}

export function formatValuationRange(
  min: string | null,
  max: string | null,
): string {
  if (min === null && max === null) return "Hesaplanmadı";
  const minFormatted = formatValuationPrice(min);
  const maxFormatted = formatValuationPrice(max);
  return `${minFormatted} - ${maxFormatted}`;
}

export function formatValuationDate(date: string): string {
  return new Date(date).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
