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
  price: z.coerce.number().min(0, "Fiyat 0'dan büyük olmalıdır"),
  area: z.coerce.number().optional(),
  address: z.string().optional(),
  city: z.string().default("Sakarya"),
  district: z.string().default("Hendek"),
  neighborhood: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  features: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
  images: z.array(z.string()).optional(),
  thumbnail: z.string().nullable().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  isFeatured: z.boolean().default(false),
  status: z.enum(["pending", "active", "sold", "draft"]).default("active"),
});

export type CreateListing = z.infer<typeof createListingSchema>;
export type ListingQuery = z.infer<typeof listingQuerySchema>;

// Appointment Schemas
export const appointmentQuerySchema = z.object({
  type: z
    .enum(["kahve", "property_visit", "valuation", "consultation"])
    .optional(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
});

export const createAppointmentSchema = z.object({
  name: z.string().min(1, "İsim zorunludur"),
  email: z.string().email("Geçerli bir email adresi giriniz"),
  phone: z.string().min(10, "Geçerli bir telefon numarası giriniz"),
  type: z.enum(["kahve", "property_visit", "valuation", "consultation"]),
  date: z.string().optional(),
  time: z.string().optional(),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  message: z.string().optional(),
  propertyId: z.string().optional(),
  listingId: z.string().optional(),
});

export const updateAppointmentSchema = z.object({
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
  notes: z.string().optional(),
});

// Contact Schemas
export const contactQuerySchema = z.object({
  status: z.enum(["new", "read", "replied"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
});

export const createContactSchema = z.object({
  name: z.string().min(1, "İsim zorunludur"),
  email: z.string().email("Geçerli bir email adresi giriniz"),
  phone: z.string().optional(),
  subject: z.string().min(1, "Konu zorunludur"),
  message: z.string().min(1, "Mesaj zorunludur"),
  listingId: z.string().optional(),
});

export const updateContactSchema = z.object({
  status: z.enum(["new", "read", "replied"]).optional(),
  notes: z.string().optional(),
  adminReply: z.string().optional(),
});

// Valuation Schemas
export const valuationQuerySchema = z.object({
  propertyType: z
    .enum(["sanayi", "tarim", "konut", "ticari", "arsa"])
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
});

export const createValuationSchema = z.object({
  name: z.string().min(1, "İsim zorunludur"),
  email: z.string().email("Geçerli bir email adresi giriniz"),
  phone: z.string().min(10, "Geçerli bir telefon numarası giriniz"),
  propertyType: z.enum(["sanayi", "tarim", "konut", "ticari", "arsa"]),
  address: z.string().min(1, "Adres zorunludur"),
  area: z.coerce.number().min(1, "Alan 0'dan büyük olmalıdır"),
  description: z.string().optional(),
  features: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
});

export type AppointmentQuery = z.infer<typeof appointmentQuerySchema>;
export type CreateAppointment = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointment = z.infer<typeof updateAppointmentSchema>;
export type ContactQuery = z.infer<typeof contactQuerySchema>;
export type CreateContact = z.infer<typeof createContactSchema>;
export type UpdateContact = z.infer<typeof updateContactSchema>;
export type ValuationQuery = z.infer<typeof valuationQuerySchema>;
export type CreateValuation = z.infer<typeof createValuationSchema>;
