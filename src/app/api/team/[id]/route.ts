import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { teamMembers } from "@/db/schema";
import { eq } from "drizzle-orm";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/team/[id]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const [member] = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.id, id))
      .limit(1);

    if (!member) {
      return NextResponse.json(
        { error: "Ekip üyesi bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: member });
  } catch (error) {
    console.error("Team GET error:", error);
    return NextResponse.json(
      { error: "Ekip üyesi yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/team/[id]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const [updated] = await db
      .update(teamMembers)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(teamMembers.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Ekip üyesi bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: updated,
      message: "Ekip üyesi güncellendi",
    });
  } catch (error) {
    console.error("Team PATCH error:", error);
    return NextResponse.json(
      { error: "Ekip üyesi güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/team/[id]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const [deleted] = await db
      .delete(teamMembers)
      .where(eq(teamMembers.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Ekip üyesi bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Ekip üyesi silindi" });
  } catch (error) {
    console.error("Team DELETE error:", error);
    return NextResponse.json(
      { error: "Ekip üyesi silinirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
