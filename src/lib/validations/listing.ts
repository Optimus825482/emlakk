/**
 * ULW Listing Validation Schemas
 *
 * Zod ile veri doğrulama.
 * Crawler'dan gelen verilerin tutarlılığını sağlar.
 */

import { z } from "zod";

// Enum tanımları
export const CollectedCategoryEnum = z.enum([
  "konut",
  "arsa",
  "isyeri",
  "bina",
]);
export const CollectedTransactionEnum = z.enum([
  "satilik",
  "kiralik",
  "devren-satilik",
  "devren-kiralik",
  "kat-karsiligi",
]);
export const CollectedStatusEnum = z.enum([
  "pending",
  "approved",
  "rejected",
  "duplicate",
]);

// Crawler'dan gelen ham veri
export const RawListingSchema = z.object({
  id: z.string().min(1, "İlan ID gerekli"),
  baslik: z.string().min(3, "Başlık en az 3 karakter olmalı").max(500),
  fiyat: z.string().optional(),
  konum: z.string().optional(),
  tarih: z.string().optional(),
  link: z.string().min(1, "Geçerli bir link olmalı"),
  resim: z.string().optional().nullable(),

  // Breadcrumb bilgileri
  breadcrumb: z.array(z.string()).optional(),
  main_category: z.string().optional(),
  sub_category: z.string().optional(),
  property_type: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  neighborhood: z.string().optional(),
  area_detail: z.string().optional(),
});

// Detay verisi
export const ListingDetailSchema = z.object({
  description: z.string().min(10).max(10000).optional(),
  features: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
  images: z.array(z.string()).max(50).optional(),
  area: z.number().positive().optional(),

  // Ek özellikler
  roomCount: z.string().optional(),
  floorNumber: z.string().optional(),
  buildingAge: z.string().optional(),
  heatingType: z.string().optional(),

  // Koordinatlar
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

// Veritabanına kaydedilecek veri
export const CollectedListingSchema = z.object({
  sourceId: z.string().min(1),
  sourceUrl: z.string().min(1),
  title: z.string().min(3).max(500),
  price: z.string().optional().nullable(),
  priceValue: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  category: CollectedCategoryEnum,
  transactionType: CollectedTransactionEnum,
  status: CollectedStatusEnum.default("pending"),
  thumbnail: z.string().optional().nullable(),
  images: z.array(z.string()).default([]),
  description: z.string().optional().nullable(),
  features: z.record(z.string(), z.unknown()).optional().nullable(),
  area: z.number().optional().nullable(),

  // Breadcrumb
  breadcrumb: z.array(z.string()).optional().nullable(),
  mainCategory: z.string().optional().nullable(),
  subCategory: z.string().optional().nullable(),
  propertyType: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  areaDetail: z.string().optional().nullable(),
});

// API Request schemas
export const CrawlRequestSchema = z
  .object({
    url: z.string().url().optional(),
    category: CollectedCategoryEnum.optional(),
    transactionType: CollectedTransactionEnum.optional(),
    maxPages: z.number().min(1).max(100).default(5),
    autoSave: z.boolean().default(true),
  })
  .refine((data) => data.url || (data.category && data.transactionType), {
    message: "URL veya kategori/işlem türü gerekli",
  });

export const ListingsQuerySchema = z.object({
  status: CollectedStatusEnum.optional(),
  category: CollectedCategoryEnum.optional(),
  transactionType: CollectedTransactionEnum.optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  search: z.string().optional(),
  sortBy: z.enum(["crawledAt", "price", "title"]).default("crawledAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const UpdateListingSchema = z.object({
  id: z.string().uuid(),
  status: CollectedStatusEnum.optional(),
  notes: z.string().max(1000).optional(),
});

// ============================================
// Ana Listings API için Schema'lar (eski sistem uyumluluğu)
// ============================================

// Property type enum (ana listings için - DB ile uyumlu)
export const PropertyTypeEnum = z.enum([
  "konut",
  "arsa",
  "ticari",
  "sanayi",
  "tarim",
]);

// Transaction type enum (ana listings için - DB ile uyumlu)
export const TransactionTypeEnum = z.enum(["sale", "rent"]);

// Listing status enum (ana listings için - DB ile uyumlu)
export const ListingStatusEnum = z.enum([
  "draft",
  "active",
  "sold",
  "pending",
]);

// Ana listings API için create schema
export const createListingSchema = z.object({
  title: z.string().min(5, "Başlık en az 5 karakter olmalı").max(200),
  description: z.string().max(5000).optional(),
  type: PropertyTypeEnum,
  transactionType: TransactionTypeEnum,
  price: z.coerce.number().positive("Fiyat pozitif olmalı"),
  area: z.coerce.number().positive("Alan pozitif olmalı").optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  neighborhood: z.string().max(100).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  features: z.record(z.string(), z.unknown()).optional(),
  images: z.array(z.string()).max(20).optional(),
  thumbnail: z.string().optional().nullable(),
  metaTitle: z.string().max(200).optional().nullable(),
  metaDescription: z.string().max(500).optional().nullable(),
  isFeatured: z.boolean().default(false),
  status: ListingStatusEnum.default("active"),
});

// Ana listings API için query schema
export const listingQuerySchema = z.object({
  type: PropertyTypeEnum.optional(),
  propertyType: PropertyTypeEnum.optional(), // alias
  status: ListingStatusEnum.optional(),
  transactionType: TransactionTypeEnum.optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  minArea: z.string().optional(),
  maxArea: z.string().optional(),
  isFeatured: z
    .string()
    .transform((v) => v === "true")
    .optional(),
  featured: z
    .string()
    .transform((v) => v === "true")
    .optional(), // alias
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(12),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Type exports
export type RawListing = z.infer<typeof RawListingSchema>;
export type ListingDetail = z.infer<typeof ListingDetailSchema>;
export type CollectedListing = z.infer<typeof CollectedListingSchema>;
export type CrawlRequest = z.infer<typeof CrawlRequestSchema>;
export type ListingsQuery = z.infer<typeof ListingsQuerySchema>;
export type UpdateListing = z.infer<typeof UpdateListingSchema>;
export type CreateListing = z.infer<typeof createListingSchema>;
export type ListingQuery = z.infer<typeof listingQuerySchema>;

// Validation helpers
export function validateRawListing(data: unknown): {
  success: boolean;
  data?: RawListing;
  error?: string;
} {
  const result = RawListingSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: result.error.issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", "),
  };
}

export function validateCrawlRequest(data: unknown): {
  success: boolean;
  data?: CrawlRequest;
  error?: z.ZodError;
} {
  const result = CrawlRequestSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

// Sanitize helpers
export function sanitizeTitle(title: string): string {
  return title.trim().replace(/\s+/g, " ").slice(0, 500);
}

export function parsePrice(priceStr: string | null | undefined): number | null {
  if (!priceStr) return null;
  const cleaned = priceStr.replace(/[^\d]/g, "");
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? null : num;
}

export function normalizeLocation(location: string | null | undefined): {
  city?: string;
  district?: string;
  neighborhood?: string;
} {
  if (!location) return {};

  const parts = location.split("/").map((p) => p.trim());

  return {
    city: parts[0] || undefined,
    district: parts[1] || undefined,
    neighborhood: parts[2] || undefined,
  };
}
