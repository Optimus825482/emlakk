import { z } from "zod";

// Listing Query Schema
export const listingQuerySchema = z.object({
  type: z.string().optional(),
  status: z.string().optional(),
  transactionType: z.enum(["sale", "rent"]).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minArea: z.string().optional(),
  maxArea: z.string().optional(),
  isFeatured: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(12),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Create Listing Schema
export const createListingSchema = z.object({
  title: z.string().min(1, "Başlık zorunludur"),
  description: z.string().optional(),
  type: z.enum(["konut", "arsa", "sanayi", "tarim", "ticari"]),
  transactionType: z.enum(["sale", "rent"]),
  price: z.number().min(0, "Fiyat 0'dan büyük olmalıdır"),
  area: z.number().optional(),
  address: z.string().optional(),
  city: z.string().default("Sakarya"),
  district: z.string().default("Hendek"),
  neighborhood: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  features: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  isFeatured: z.boolean().default(false),
});

export type CreateListing = z.infer<typeof createListingSchema>;
export type ListingQuery = z.infer<typeof listingQuerySchema>;
