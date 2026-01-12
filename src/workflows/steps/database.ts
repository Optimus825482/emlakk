/**
 * Veritabanı İşlem Step'leri
 * DEMİR-NET Workflow DevKit
 */

import { db } from "@/db";
import { appointments, valuations, contacts, listings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getAppointment(appointmentId: string) {
  "use step";

  const [appointment] = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, appointmentId))
    .limit(1);

  return appointment;
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: "pending" | "confirmed" | "completed" | "cancelled"
) {
  "use step";

  const [updated] = await db
    .update(appointments)
    .set({ status, updatedAt: new Date() })
    .where(eq(appointments.id, appointmentId))
    .returning();

  return updated;
}

export async function getValuation(valuationId: string) {
  "use step";

  const [valuation] = await db
    .select()
    .from(valuations)
    .where(eq(valuations.id, valuationId))
    .limit(1);

  return valuation;
}

export async function updateValuationStatus(
  valuationId: string,
  status: string,
  estimatedValue?: number
) {
  "use step";

  const updateData: Record<string, unknown> = {};

  if (estimatedValue !== undefined) {
    updateData.estimatedValue = estimatedValue.toString();
  }

  // Not: valuations tablosunda status alanı yok, sadece estimatedValue güncelleniyor
  if (Object.keys(updateData).length === 0) {
    console.log(`Valuation status update: ${valuationId} -> ${status}`);
    return { id: valuationId, status };
  }

  const [updated] = await db
    .update(valuations)
    .set(updateData)
    .where(eq(valuations.id, valuationId))
    .returning();

  return updated;
}

export async function getContact(contactId: string) {
  "use step";

  const [contact] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, contactId))
    .limit(1);

  return contact;
}

export async function updateContactStatus(
  contactId: string,
  status: "new" | "read" | "replied" | "archived"
) {
  "use step";

  const [updated] = await db
    .update(contacts)
    .set({ status, updatedAt: new Date() })
    .where(eq(contacts.id, contactId))
    .returning();

  return updated;
}

export async function getListing(listingId: string) {
  "use step";

  const [listing] = await db
    .select()
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1);

  return listing;
}

export async function updateListingDescription(
  listingId: string,
  description: string
) {
  "use step";

  const [updated] = await db
    .update(listings)
    .set({ description, updatedAt: new Date() })
    .where(eq(listings.id, listingId))
    .returning();

  return updated;
}
