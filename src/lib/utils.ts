import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind CSS class merger utility
 * Combines clsx and tailwind-merge for optimal class handling
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format price to Turkish Lira
 */
export function formatPrice(price: number | string): string {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numPrice);
}

/**
 * Format area with m² suffix
 */
export function formatArea(area: number): string {
  return `${new Intl.NumberFormat("tr-TR").format(area)}m²`;
}

/**
 * Generate slug from Turkish text
 */
export function slugify(text: string): string {
  const turkishMap: Record<string, string> = {
    ç: "c",
    ğ: "g",
    ı: "i",
    ö: "o",
    ş: "s",
    ü: "u",
    Ç: "c",
    Ğ: "g",
    İ: "i",
    Ö: "o",
    Ş: "s",
    Ü: "u",
  };

  return text
    .split("")
    .map((char) => turkishMap[char] || char)
    .join("")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Calculate price per square meter
 */
export function calculatePricePerSqm(
  price: number | string,
  area: number
): number {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  return Math.round(numPrice / area);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + "...";
}

/**
 * Format date to Turkish locale
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/**
 * Format relative time (e.g., "2 gün önce")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Bugün";
  if (diffDays === 1) return "Dün";
  if (diffDays < 7) return `${diffDays} gün önce`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} ay önce`;
  return `${Math.floor(diffDays / 365)} yıl önce`;
}

/**
 * Listing type labels in Turkish
 */
export const listingTypeLabels: Record<string, string> = {
  sanayi: "Sanayi",
  tarim: "Tarım",
  konut: "Konut",
  ticari: "Ticari",
};

/**
 * Listing status labels in Turkish
 */
export const listingStatusLabels: Record<string, string> = {
  active: "Aktif",
  sold: "Satıldı",
  pending: "Beklemede",
  draft: "Taslak",
};

/**
 * Transaction type labels in Turkish
 */
export const transactionTypeLabels: Record<string, string> = {
  sale: "Satılık",
  rent: "Kiralık",
};
