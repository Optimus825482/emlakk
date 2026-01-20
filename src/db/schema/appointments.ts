import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  pgEnum,
  date,
  time,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { listings } from "./listings";

// Enums
export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pending", // Beklemede
  "confirmed", // Onaylandı
  "cancelled", // İptal Edildi
  "completed", // Tamamlandı
  "noshow", // Gelmedi
]);

export const appointmentTypeEnum = pgEnum("appointment_type", [
  "viewing", // İlan Gösterimi
  "valuation", // Değerleme / Ekspertiz
  "consultation", // Danışmanlık
  "selling", // Satış İşlemleri
  "other", // Diğer
]);

// Appointments Table
export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Customer Info
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),

    // Appointment Details
    type: appointmentTypeEnum("type").notNull().default("viewing"),
    status: appointmentStatusEnum("status").notNull().default("pending"),
    date: date("date").notNull(),
    time: time("time").notNull(),

    // Related listing (optional)
    listingId: uuid("listing_id").references(() => listings.id, {
      onDelete: "set null",
    }),

    // Additional info
    message: text("message"),
    adminNotes: text("admin_notes"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    confirmedAt: timestamp("confirmed_at"),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    index("appointments_date_idx").on(table.date),
    index("appointments_status_idx").on(table.status),
  ],
);

// Relations
export const appointmentsRelations = relations(appointments, ({ one }) => ({
  listing: one(listings, {
    fields: [appointments.listingId],
    references: [listings.id],
  }),
}));

// Types
export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;
export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "noshow";
export type AppointmentType =
  | "viewing"
  | "valuation"
  | "consultation"
  | "selling"
  | "other";
