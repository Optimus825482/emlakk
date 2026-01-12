import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  pgEnum,
  date,
  time,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { listings } from "./listings";

// Enums
export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
]);

export const appointmentTypeEnum = pgEnum("appointment_type", [
  "kahve", // Kahve eşliğinde görüşme
  "property_visit", // Mülk ziyareti
  "valuation", // Değerleme görüşmesi
  "consultation", // Danışmanlık
]);

// Appointments table
export const appointments = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Contact info
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),

  // Appointment details
  type: appointmentTypeEnum("type").notNull(),
  status: appointmentStatusEnum("status").notNull().default("pending"),

  // Date & Time
  date: date("date").notNull(),
  time: time("time").notNull(),

  // Related listing (optional)
  listingId: uuid("listing_id").references(() => listings.id, {
    onDelete: "set null",
  }),

  // Notes
  message: text("message"),
  adminNotes: text("admin_notes"),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
  completedAt: timestamp("completed_at"),
});

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
  | "completed"
  | "cancelled";
export type AppointmentType =
  | "kahve"
  | "property_visit"
  | "valuation"
  | "consultation";
