/**
 * Listing Types & Constants
 * @module types/admin/listing
 * @description Merkezi ilan tip tanımları - src/db/schema/listings.ts ile uyumlu
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ListingType = "sanayi" | "tarim" | "konut" | "ticari" | "arsa";
export type ListingStatus = "active" | "sold" | "pending" | "draft";
export type TransactionType = "sale" | "rent";

export interface ListingFeatures {
  // Genel özellikler
  rooms?: string;
  bathrooms?: number;
  floors?: number;
  buildingAge?: number;
  heating?: string;
  parking?: boolean;
  garden?: boolean;
  pool?: boolean;
  furnished?: boolean;

  // Sanayi specific
  infrastructure?: boolean;
  roadAccess?: string;

  // Tarım specific
  treeCount?: number;
  soilType?: string;
  irrigation?: boolean;
  organic?: boolean;

  // Konut specific
  elevator?: boolean;
  security?: boolean;

  // Import metadata
  sourceId?: string;
  sourceUrl?: string;
  importDate?: string;

  // Esnek ek alanlar
  [key: string]: string | number | boolean | undefined;
}

export interface Listing {
  id: string;

  // Temel bilgiler
  title: string;
  slug: string;
  description: string | null;

  // Tip & Durum
  type: ListingType;
  status: ListingStatus;
  transactionType: TransactionType;

  // Konum
  address: string;
  city: string;
  district: string | null;
  neighborhood: string | null;
  latitude: string | null;
  longitude: string | null;

  // Gayrimenkul detayları
  area: number;
  price: string;
  pricePerSqm: string | null;

  // Ek detaylar
  features: ListingFeatures | null;

  // AI Insights
  aiScore: number | null;
  aiInsight: string | null;
  roiEstimate: string | null;

  // Medya
  images: string[];
  thumbnail: string | null;
  videoUrl: string | null;

  // SEO & Meta
  metaTitle: string | null;
  metaDescription: string | null;

  // Flags
  isFeatured: boolean;
  isNew: boolean;

  // Zaman damgaları
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  soldAt: string | null;
}

// Tablo görünümü için minimal versiyon
export interface ListingTableRow {
  id: string;
  title: string;
  slug: string;
  type: ListingType;
  status: ListingStatus;
  transactionType: TransactionType;
  area: number;
  price: string;
  city: string;
  district: string | null;
  thumbnail: string | null;
  isFeatured: boolean;
  createdAt: string;
}

// Yeni ilan oluşturma için
export interface CreateListingInput {
  title: string;
  description?: string;
  type: ListingType;
  status?: ListingStatus;
  transactionType?: TransactionType;
  address: string;
  city?: string;
  district?: string;
  neighborhood?: string;
  latitude?: string;
  longitude?: string;
  area: number;
  price: string;
  features?: ListingFeatures;
  images?: string[];
  thumbnail?: string;
  isFeatured?: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

// ============================================================================
// LABEL CONSTANTS
// ============================================================================

export const typeLabels: Record<ListingType, string> = {
  sanayi: "Sanayi",
  tarim: "Tarım",
  konut: "Konut",
  ticari: "Ticari",
  arsa: "Arsa",
};

export const typeColors: Record<ListingType, string> = {
  sanayi:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  tarim: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  konut: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  ticari:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  arsa: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
};

export const statusLabels: Record<ListingStatus, string> = {
  active: "Aktif",
  sold: "Satıldı",
  pending: "Beklemede",
  draft: "Taslak",
};

export const statusColors: Record<ListingStatus, string> = {
  active:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  sold: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export const transactionTypeLabels: Record<TransactionType, string> = {
  sale: "Satılık",
  rent: "Kiralık",
};

export const transactionTypeColors: Record<TransactionType, string> = {
  sale: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  rent: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
};

// ============================================================================
// TYPE ICONS (Lucide icon names)
// ============================================================================

export const typeIcons: Record<ListingType, string> = {
  sanayi: "Factory",
  tarim: "Wheat",
  konut: "Home",
  ticari: "Building2",
  arsa: "Map",
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getTypeLabel(type: ListingType): string {
  return typeLabels[type] || type;
}

export function getStatusLabel(status: ListingStatus): string {
  return statusLabels[status] || status;
}

export function formatPrice(price: string | number): string {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numPrice);
}

export function formatArea(area: number): string {
  return `${area.toLocaleString("tr-TR")} m²`;
}
