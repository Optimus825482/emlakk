/**
 * Değerlemeler modülü için type tanımları
 */

export interface Valuation {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  propertyType: "sanayi" | "tarim" | "konut" | "ticari" | "arsa";
  address: string;
  city: string;
  district: string | null;
  area: number;
  details: Record<string, unknown> | null;
  estimatedValue: string | null;
  minValue: string | null;
  maxValue: string | null;
  pricePerSqm: string | null;
  confidenceScore: number | null;
  comparables: ComparableProperty[] | null;
  marketAnalysis: string | null;
  createdAt: string;
}

export interface ComparableProperty {
  id: string | number;
  baslik: string;
  fiyat: number;
  m2: number;
  similarity?: number;
  distance?: number;
}

export interface ApiResponse {
  data: Valuation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface GroupedValuation {
  userId: string;
  userName: string;
  date: string;
  valuations: Valuation[];
  expanded: boolean;
}

export interface ValuationsState {
  valuations: Valuation[];
  loading: boolean;
  filter: string;
  selectedValuation: string | null;
  page: number;
  totalPages: number;
  total: number;
  groupByUser: boolean;
  groupedData: GroupedValuation[];
}

// Sabit tanımları
export const PROPERTY_TYPE_COLORS: Record<string, string> = {
  konut: "bg-orange-500",
  sanayi: "bg-blue-500",
  tarim: "bg-emerald-500",
  ticari: "bg-purple-500",
  arsa: "bg-amber-500",
};

export const PROPERTY_TYPE_ICONS: Record<string, string> = {
  konut: "home",
  sanayi: "factory",
  tarim: "agriculture",
  ticari: "store",
  arsa: "landscape",
};

export const PAGE_SIZE = 20;
