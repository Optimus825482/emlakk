import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import {
  createAppointmentSchema,
  appointmentQuerySchema,
} from "@/lib/validations";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

/**
 * GET /api/appointments
 * List all appointments with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const query = appointmentQuerySchema.safeParse(params);
    if (!query.success) {
      return NextResponse.json(
        {
          error: "Geçersiz sorgu parametreleri",
          details: query.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      type,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = query.data;

    // Build where conditions
    const conditions = [];

    if (type) conditions.push(eq(appointments.type, type));
    if (status) conditions.push(eq(appointments.status, status));
    if (startDate) conditions.push(gte(appointments.date, startDate));
    if (endDate) conditions.push(lte(appointments.date, endDate));

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(countResult[0]?.count || 0);

    // Get paginated results
    const offset = (page - 1) * limit;

    const results = await db
      .select()
      .from(appointments)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(appointments.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + results.length < total,
      },
    });
  } catch (error) {
    console.error("Appointments GET error:", error);
    return NextResponse.json(
      { error: "Randevular yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/appointments
 * Create a new appointment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = createAppointmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    const [newAppointment] = await db
      .insert(appointments)
      .values({
        type: data.type,
        name: data.name,
        email: data.email,
        phone: data.phone,
        date: data.preferredDate,
        time: data.preferredTime || "10:00",
        message: data.message,
        listingId: data.listingId,
        status: "pending",
      })
      .returning();

    return NextResponse.json(
      {
        data: newAppointment,
        message:
          "Randevu talebiniz alındı. En kısa sürede sizinle iletişime geçeceğiz.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Appointments POST error:", error);
    return NextResponse.json(
      { error: "Randevu oluşturulurken bir hata oluştu" },
      { status: 500 }
    );
  }
}
