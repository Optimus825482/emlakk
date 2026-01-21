import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { visionPillars } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

// GET - Tüm pillar'ları getir
export async function GET() {
  try {
    const pillars = await db
      .select()
      .from(visionPillars)
      .orderBy(asc(visionPillars.sortOrder));

    return NextResponse.json({ success: true, data: pillars });
  } catch (error) {
    console.error("Pillars fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Veriler yüklenirken hata oluştu" },
      { status: 500 },
    );
  }
}

// POST - Yeni pillar ekle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { icon, title, description, sortOrder } = body;

    if (!icon || !title || !description) {
      return NextResponse.json(
        { success: false, error: "Icon, başlık ve açıklama gerekli" },
        { status: 400 },
      );
    }

    const [newPillar] = await db
      .insert(visionPillars)
      .values({
        icon,
        title,
        description,
        sortOrder: sortOrder || 0,
      })
      .returning();

    return NextResponse.json(
      { success: true, data: newPillar },
      { status: 201 },
    );
  } catch (error) {
    console.error("Pillar create error:", error);
    return NextResponse.json(
      { success: false, error: "Oluşturma sırasında hata oluştu" },
      { status: 500 },
    );
  }
}

// PUT - Pillar güncelle
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, icon, title, description, sortOrder, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
    }

    await db
      .update(visionPillars)
      .set({
        icon,
        title,
        description,
        sortOrder,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(visionPillars.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pillar update error:", error);
    return NextResponse.json(
      { error: "Güncelleme sırasında hata oluştu" },
      { status: 500 },
    );
  }
}

// DELETE - Pillar sil
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
    }

    await db.delete(visionPillars).where(eq(visionPillars.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pillar delete error:", error);
    return NextResponse.json(
      { error: "Silme sırasında hata oluştu" },
      { status: 500 },
    );
  }
}
