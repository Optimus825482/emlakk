import { z } from "zod";

/**
 * Create appointment validation schema
 */
export const createAppointmentSchema = z.object({
  type: z.enum(["kahve", "property_visit", "valuation", "consultation"]),
  name: z.string().min(2, "İsim en az 2 karakter olmalı").max(255),
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  phone: z.string().min(10, "Geçerli bir telefon numarası girin").max(20),
  preferredDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Geçerli bir tarih seçin",
  }),
  preferredTime: z.string().optional(),
  message: z.string().max(1000).optional(),
  listingId: z.string().uuid().optional(),
});

/**
 * Update appointment validation schema
 */
export const updateAppointmentSchema = z.object({
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
  notes: z.string().max(2000).optional(),
  confirmedDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Geçerli bir tarih seçin",
    })
    .optional(),
});

/**
 * Appointment query params schema
 */
export const appointmentQuerySchema = z.object({
  type: z
    .enum(["kahve", "property_visit", "valuation", "consultation"])
    .optional(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
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

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type AppointmentQueryInput = z.infer<typeof appointmentQuerySchema>;

/**
 * Appointment type labels in Turkish
 */
export const appointmentTypeLabels: Record<string, string> = {
  kahve: "Kahve Sohbeti",
  property_visit: "Mülk Gezisi",
  valuation: "Değerleme Randevusu",
  consultation: "Danışmanlık",
};

/**
 * Appointment status labels in Turkish
 */
export const appointmentStatusLabels: Record<string, string> = {
  pending: "Beklemede",
  confirmed: "Onaylandı",
  completed: "Tamamlandı",
  cancelled: "İptal Edildi",
};
