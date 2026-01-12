import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { updateAppointmentSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";
import { triggerAppointmentReminder } from "@/lib/workflow-trigger";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/appointments/[id]
 * Get a single appointment
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id))
      .limit(1);

    if (!appointment) {
      return NextResponse.json(
        { error: "Randevu bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: appointment });
  } catch (error) {
    console.error("Appointment GET error:", error);
    return NextResponse.json(
      { error: "Randevu yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/appointments/[id]
 * Update appointment status or notes
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const validation = updateAppointmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.status) {
      updateData.status = data.status;
      if (data.status === "confirmed") updateData.confirmedAt = new Date();
      if (data.status === "completed") updateData.completedAt = new Date();
    }
    if (data.notes) updateData.adminNotes = data.notes;

    const [updated] = await db
      .update(appointments)
      .set(updateData)
      .where(eq(appointments.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Randevu bulunamadı" },
        { status: 404 }
      );
    }

    // Randevu onaylandığında hatırlatma workflow'unu tetikle
    if (data.status === "confirmed") {
      triggerAppointmentReminder(updated.id);
    }

    return NextResponse.json({
      data: updated,
      message: "Randevu güncellendi",
    });
  } catch (error) {
    console.error("Appointment PATCH error:", error);
    return NextResponse.json(
      { error: "Randevu güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/appointments/[id]
 * Delete an appointment
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const [deleted] = await db
      .delete(appointments)
      .where(eq(appointments.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Randevu bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Randevu silindi",
    });
  } catch (error) {
    console.error("Appointment DELETE error:", error);
    return NextResponse.json(
      { error: "Randevu silinirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
