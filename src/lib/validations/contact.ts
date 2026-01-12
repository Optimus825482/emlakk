import { z } from "zod";

/**
 * Create contact message validation schema
 */
export const createContactSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalı").max(255),
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  phone: z
    .string()
    .min(10, "Geçerli bir telefon numarası girin")
    .max(20)
    .optional(),
  subject: z
    .string()
    .min(3, "Konu en az 3 karakter olmalı")
    .max(255)
    .optional(),
  message: z.string().min(10, "Mesaj en az 10 karakter olmalı").max(5000),
  listingId: z.string().uuid().optional(),
});

/**
 * Update contact message validation schema
 */
export const updateContactSchema = z.object({
  status: z.enum(["new", "read", "replied", "archived"]).optional(),
  notes: z.string().max(2000).optional(),
  adminReply: z.string().max(5000).optional(),
});

/**
 * Contact query params schema
 */
export const contactQuerySchema = z.object({
  status: z.enum(["new", "read", "replied", "archived"]).optional(),
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

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type ContactQueryInput = z.infer<typeof contactQuerySchema>;

/**
 * Contact status labels in Turkish
 */
export const contactStatusLabels: Record<string, string> = {
  new: "Yeni",
  read: "Okundu",
  replied: "Yanıtlandı",
  archived: "Arşivlendi",
};
