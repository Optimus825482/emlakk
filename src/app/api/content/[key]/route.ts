import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contentSections } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET - Tek içerik getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;

    const [content] = await db
      .select()
      .from(contentSections)
      .where(eq(contentSections.key, key))
      .limit(1);

    if (!content) {
      return NextResponse.json({ data: null }, { status: 200 });
    }

    return NextResponse.json({ data: content });
  } catch (error) {
    console.error("Content GET error:", error);
    return NextResponse.json({ error: "İçerik alınamadı" }, { status: 500 });
  }
}

// PATCH - İçerik güncelle
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const body = await request.json();

    const [updated] = await db
      .update(contentSections)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(contentSections.key, key))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "İçerik bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Content PATCH error:", error);
    return NextResponse.json(
      { error: "İçerik güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - İçerik sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;

    await db.delete(contentSections).where(eq(contentSections.key, key));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Content DELETE error:", error);
    return NextResponse.json({ error: "İçerik silinemedi" }, { status: 500 });
  }
}
