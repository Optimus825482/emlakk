/**
 * Validation Schemas (Zod)
 *
 * Centralized validation for API requests
 */

import { z } from "zod";

// ============================================
// LISTING SCHEMAS
// ============================================

export const listingSchema = z.object({
  title: z
    .string()
    .min(3, "Başlık en az 3 karakter olmalı")
    .max(200, "Başlık en fazla 200 karakter olabilir"),
  description: z
    .string()
    .min(10, "Açıklama en az 10 karakter olmalı")
    .optional(),
  price: z
    .number()
    .positive("Fiyat pozitif olmalı")
    .max(1000000000, "Fiyat çok yüksek"),
  category: z.enum(["satilik", "kiralik"]),
  propertyType: z.string().min(1, "Emlak tipi gerekli"),
  city: z.string().min(1, "Şehir gerekli"),
  district: z.string().min(1, "İlçe gerekli"),
  neighborhood: z.string().optional(),
  address: z.string().optional(),
  area: z.number().positive("Alan pozitif olmalı").optional(),
  rooms: z.number().int().positive().optional(),
  bathrooms: z.number().int().positive().optional(),
  floor: z.number().int().optional(),
  buildingAge: z.number().int().nonnegative().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  images: z.array(z.string().url("Geçersiz resim URL")).optional(),
  features: z.array(z.string()).optional(),
  status: z.enum(["active", "pending", "sold", "rented"]).optional(),
});

export const listingUpdateSchema = listingSchema.partial();

export const listingQuerySchema = z.object({
  category: z.enum(["satilik", "kiralik"]).optional(),
  propertyType: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  minArea: z.number().positive().optional(),
  maxArea: z.number().positive().optional(),
  rooms: z.number().int().positive().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sort: z.enum(["price-asc", "price-desc", "date-asc", "date-desc"]).optional(),
});

// ============================================
// USER SCHEMAS
// ============================================

export const userSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalı").max(100),
  email: z.string().email("Geçersiz email adresi"),
  phone: z
    .string()
    .regex(/^[0-9]{10,11}$/, "Geçersiz telefon numarası")
    .optional(),
  role: z.enum(["user", "admin"]).default("user"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı").optional(),
});

export const userUpdateSchema = userSchema.partial();

export const userLoginSchema = z.object({
  email: z.string().email("Geçersiz email adresi"),
  password: z.string().min(1, "Şifre gerekli"),
});

// ============================================
// CONTACT SCHEMAS
// ============================================

export const contactSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalı").max(100),
  email: z.string().email("Geçersiz email adresi"),
  phone: z.string().regex(/^[0-9]{10,11}$/, "Geçersiz telefon numarası"),
  message: z.string().min(10, "Mesaj en az 10 karakter olmalı").max(1000),
  listingId: z.number().int().positive().optional(),
});

// ============================================
// APPOINTMENT SCHEMAS
// ============================================

export const appointmentSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalı").max(100),
  email: z.string().email("Geçersiz email adresi"),
  phone: z.string().regex(/^[0-9]{10,11}$/, "Geçersiz telefon numarası"),
  date: z.string().datetime("Geçersiz tarih formatı"),
  time: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Geçersiz saat formatı"),
  message: z.string().max(500).optional(),
  listingId: z.number().int().positive().optional(),
});

// ============================================
// VALUATION SCHEMAS
// ============================================

export const valuationSchema = z.object({
  propertyType: z.string().min(1, "Emlak tipi gerekli"),
  city: z.string().min(1, "Şehir gerekli"),
  district: z.string().min(1, "İlçe gerekli"),
  neighborhood: z.string().optional(),
  area: z.number().positive("Alan pozitif olmalı"),
  rooms: z.number().int().positive().optional(),
  bathrooms: z.number().int().positive().optional(),
  floor: z.number().int().optional(),
  buildingAge: z.number().int().nonnegative().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  features: z.array(z.string()).optional(),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validate request body with Zod schema
 *
 * @example
 * ```ts
 * const result = await validateRequest(req, listingSchema);
 * if (!result.success) {
 *   return new Response(JSON.stringify(result.error), { status: 400 });
 * }
 * const data = result.data;
 * ```
 */
export async function validateRequest<T>(
  req: Request,
  schema: z.ZodSchema<T>,
): Promise<{ success: true; data: T } | { success: false; error: any }> {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: error.issues.map((e: any) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
      };
    }
    return {
      success: false,
      error: {
        code: "INVALID_JSON",
        message: "Invalid JSON body",
      },
    };
  }
}

/**
 * Validate query parameters
 */
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>,
): { success: true; data: T } | { success: false; error: any } {
  try {
    const params: any = {};
    searchParams.forEach((value, key) => {
      // Convert numbers
      if (!isNaN(Number(value))) {
        params[key] = Number(value);
      } else {
        params[key] = value;
      }
    });

    const data = schema.parse(params);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Query validation failed",
          details: error.issues.map((e: any) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
      };
    }
    return {
      success: false,
      error: {
        code: "INVALID_QUERY",
        message: "Invalid query parameters",
      },
    };
  }
}
