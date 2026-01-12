import { z } from "zod";

/**
 * Listing feature schema (JSON field)
 */
export const listingFeaturesSchema = z
  .object({
    rooms: z.string().optional(),
    bathrooms: z.number().int().positive().optional(),
    floors: z.number().int().positive().optional(),
    buildingAge: z.number().int().min(0).optional(),
    heating: z.string().optional(),
    parking: z.boolean().optional(),
    garden: z.boolean().optional(),
    pool: z.boolean().optional(),
    furnished: z.boolean().optional(),
    // Sanayi specific
    infrastructure: z.boolean().optional(),
    roadAccess: z.string().optional(),
    // Tarım specific
    treeCount: z.number().int().positive().optional(),
    soilType: z.string().optional(),
    irrigation: z.boolean().optional(),
    organic: z.boolean().optional(),
    // Konut specific
    elevator: z.boolean().optional(),
    security: z.boolean().optional(),
  })
  .strict();

/**
 * Create listing validation schema
 */
export const createListingSchema = z.object({
  title: z.string().min(5, "Başlık en az 5 karakter olmalı").max(255),
  description: z.string().optional(),
  type: z
    .enum(["sanayi", "tarim", "konut", "ticari", "arsa"])
    .refine(
      (val) => ["sanayi", "tarim", "konut", "ticari", "arsa"].includes(val),
      { message: "Geçerli bir ilan tipi seçin" }
    ),
  transactionType: z.enum(["sale", "rent"]).default("sale"),
  address: z.string().min(5, "Adres en az 5 karakter olmalı"),
  city: z.string().default("Hendek"),
  district: z.string().optional(),
  neighborhood: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  area: z.number().int().positive("Alan pozitif bir sayı olmalı"),
  price: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Geçerli bir fiyat girin",
    }),
  features: listingFeaturesSchema.optional(),
  images: z.array(z.string().url()).optional(),
  thumbnail: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().optional(),
  isFeatured: z.boolean().default(false),
});

/**
 * Update listing validation schema (all fields optional)
 */
export const updateListingSchema = createListingSchema.partial().extend({
  status: z.enum(["active", "sold", "pending", "draft"]).optional(),
  aiScore: z.number().int().min(0).max(100).optional(),
  aiInsight: z.string().optional(),
  roiEstimate: z.string().optional(),
});

/**
 * Listing query params schema
 */
export const listingQuerySchema = z.object({
  type: z.enum(["sanayi", "tarim", "konut", "ticari", "arsa"]).optional(),
  status: z.enum(["active", "sold", "pending", "draft"]).optional(),
  transactionType: z.enum(["sale", "rent"]).optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  minArea: z.string().optional(),
  maxArea: z.string().optional(),
  isFeatured: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  search: z.string().optional(),
  page: z
    .string()
    .transform((val) => parseInt(val) || 1)
    .optional(),
  limit: z
    .string()
    .transform((val) => Math.min(parseInt(val) || 12, 50))
    .optional(),
  sortBy: z.enum(["createdAt", "price", "area", "aiScore"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type ListingQueryInput = z.infer<typeof listingQuerySchema>;
