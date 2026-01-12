import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts } from "@/db/schema";
import { updateContactSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/contacts/[id]
 * Get a single contact message
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const [contact] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, id))
      .limit(1);

    if (!contact) {
      return NextResponse.json({ error: "Mesaj bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({ data: contact });
  } catch (error) {
    console.error("Contact GET error:", error);
    return NextResponse.json(
      { error: "Mesaj yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/contacts/[id]
 * Update contact status, add notes or reply
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const validation = updateContactSchema.safeParse(body);
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

    if (data.status) updateData.status = data.status;
    if (data.adminReply) {
      updateData.adminReply = data.adminReply;
      updateData.repliedAt = new Date();
      updateData.status = "replied";
    }

    const [updated] = await db
      .update(contacts)
      .set(updateData)
      .where(eq(contacts.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Mesaj bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({
      data: updated,
      message: "Mesaj güncellendi",
    });
  } catch (error) {
    console.error("Contact PATCH error:", error);
    return NextResponse.json(
      { error: "Mesaj güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/contacts/[id]
 * Delete a contact message
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const [deleted] = await db
      .delete(contacts)
      .where(eq(contacts.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Mesaj bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Mesaj silindi",
    });
  } catch (error) {
    console.error("Contact DELETE error:", error);
    return NextResponse.json(
      { error: "Mesaj silinirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
