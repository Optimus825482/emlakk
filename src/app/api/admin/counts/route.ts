import { NextResponse } from "next/server";
import { db } from "@/db";
import { appointments, contacts, valuations } from "@/db/schema";
import { eq, isNull, sql } from "drizzle-orm";

/**
 * GET /api/admin/counts
 * Sidebar badge'leri için yeni/bekleyen kayıt sayıları
 */
export async function GET() {
  try {
    const [pendingAppointments] = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(eq(appointments.status, "pending"));

    const [newMessages] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contacts)
      .where(eq(contacts.status, "new"));

    // Valuations'da status yok, estimatedValue null ise pending sayılır
    const [pendingValuations] = await db
      .select({ count: sql<number>`count(*)` })
      .from(valuations)
      .where(isNull(valuations.estimatedValue));

    return NextResponse.json({
      appointments: Number(pendingAppointments?.count || 0),
      messages: Number(newMessages?.count || 0),
      valuations: Number(pendingValuations?.count || 0),
    });
  } catch (error) {
    console.error("Admin counts error:", error);
    return NextResponse.json(
      { appointments: 0, messages: 0, valuations: 0 },
      { status: 500 }
    );
  }
}
