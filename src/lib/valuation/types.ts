// Değerleme Sistemi - Type Definitions

export interface LocationPoint {
  lat: number;
  lng: number;
  address?: string;
  ilce?: string;
  mahalle?: string;
}

export interface NearbyPOI {
  type:
    | "school"
    | "hospital"
    | "shopping_mall"
    | "park"
    | "transportation"
    | "mosque"
    | "market"
    | "bakery";
  name: string;
  distance: number;
  rating?: number;
  isChainMarket?: boolean;
}

export interface PropertyFeatures {
  propertyType: "konut" | "arsa" | "isyeri" | "sanayi" | "tarim";
  area: number; // m2
  roomCount?: number;
  buildingAge?: number;
  floor?: number;
  totalFloors?: number;
  hasElevator?: boolean;
  hasParking?: boolean;
  hasBalcony?: boolean;
  heating?: string;
  furnished?: boolean;
}

export interface ComparableProperty {
  id: number;
  baslik: string;
  fiyat: number;
  m2: number;
  konum: string;
  distance: number; // km cinsinden
  pricePerM2: number;
  similarity: number; // 0-100 arası benzerlik skoru
  status?: "active" | "archived";
}


export interface POIDetail {
  name: string;
  distance: number;
  isChainMarket?: boolean;
}

export interface CategoryPOIDetails {
  transportation: POIDetail[];
  education: POIDetail[];
  amenities: POIDetail[];
  health: POIDetail[];
}

export interface LocationScore {
  total: number; // 0-100
  breakdown: {
    proximity: number; // Merkeze yakınlık (0-25)
    transportation: number; // Ulaşım (0-20)
    amenities: number; // Sosyal tesisler (0-20)
    education: number; // Eğitim (0-15)
    health: number; // Sağlık (0-10)
    environment: number; // Çevre (0-10)
  };
  advantages: string[];
  disadvantages: string[];
  poiDetails?: CategoryPOIDetails;
}

export interface MarketAnalysis {
  avgPricePerM2: number;
  medianPricePerM2: number;
  stdDeviation: number;
  totalComparables: number;
  priceRange: {
    min: number;
    max: number;
  };
  trend: "rising" | "stable" | "falling";
  trendPercentage: number;
  trendDescription?: string;
}

export interface CalculationMetadata {
  weights: { local: number; neighborhood: number; province: number };
  confidenceBreakdown: { 
    comparableCount: number; 
    consistency: number; 
    location: number; 
    regional: number;
  };
  featureImpact: Record<string, number>;
  neighborhoodCoefficient?: number;
}

export interface ValuationResult {
  estimatedValue: number;
  priceRange: {
    min: number;
    max: number;
  };
  confidenceScore: number; // 0-100
  pricePerM2: number;
  locationScore: LocationScore;
  marketAnalysis: MarketAnalysis;
  comparableProperties: ComparableProperty[];
  nearbyPOIs: NearbyPOI[];
  aiInsights: string;
  methodology: string;
  calculationMetadata?: CalculationMetadata;
}
