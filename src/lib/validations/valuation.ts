import { z } from "zod";

/**
 * Create valuation request validation schema
 */
export const createValuationSchema = z.object({
  propertyType: z.enum(["sanayi", "tarim", "konut", "ticari", "arsa"]),
  address: z.string().min(5, "Adres en az 5 karakter olmalı"),
  area: z.number().int().positive("Alan pozitif bir sayı olmalı"),
  features: z.record(z.string(), z.unknown()).optional(),
  name: z.string().min(2, "İsim en az 2 karakter olmalı").max(255),
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  phone: z.string().min(10, "Geçerli bir telefon numarası girin").max(20),
});

/**
 * Update valuation validation schema
 */
export const updateValuationSchema = z.object({
  estimatedValue: z.string().optional(),
  minValue: z.string().optional(),
  maxValue: z.string().optional(),
  confidence: z.number().int().min(0).max(100).optional(),
  aiAnalysis: z.string().optional(),
  comparables: z.array(z.string().uuid()).optional(),
  notes: z.string().max(2000).optional(),
});

/**
 * Valuation query params schema
 */
export const valuationQuerySchema = z.object({
  propertyType: z
    .enum(["sanayi", "tarim", "konut", "ticari", "arsa"])
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z
    .string()
    .transform((val) => parseInt(val) || 1)
    .optional(),
  limit: z
    .string()
    .transform((val) => Math.min(parseInt(val) || 20, 100))
    .optional(),
});

export type CreateValuationInput = z.infer<typeof createValuationSchema>;
export type UpdateValuationInput = z.infer<typeof updateValuationSchema>;
export type ValuationQueryInput = z.infer<typeof valuationQuerySchema>;

/**
 * Valuation status labels in Turkish
 */
export const valuationPropertyTypeLabels: Record<string, string> = {
  sanayi: "Sanayi",
  tarim: "Tarım",
  konut: "Konut",
  ticari: "Ticari",
  arsa: "Arsa",
};
