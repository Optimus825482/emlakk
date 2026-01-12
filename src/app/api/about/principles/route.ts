import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { companyPrinciples } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

// GET - Tüm ilkeleri getir
export async function GET() {
  try {
    const principles = await db
      .select()
      .from(companyPrinciples)
      .orderBy(asc(companyPrinciples.sortOrder));

    return NextResponse.json(principles);
  } catch (error) {
    console.error("Principles fetch error:", error);
    return NextResponse.json(
      { error: "Veriler yüklenirken hata oluştu" },
      { status: 500 }
    );
  }
}

// POST - Yeni ilke ekle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { icon, title, sortOrder } = body;

    if (!icon || !title) {
      return NextResponse.json(
        { error: "Icon ve başlık gerekli" },
        { status: 400 }
      );
    }

    const [newPrinciple] = await db
      .insert(companyPrinciples)
      .values({
        icon,
        title,
        sortOrder: sortOrder || 0,
      })
      .returning();

    return NextResponse.json(newPrinciple, { status: 201 });
  } catch (error) {
    console.error("Principle create error:", error);
    return NextResponse.json(
      { error: "Oluşturma sırasında hata oluştu" },
      { status: 500 }
    );
  }
}

// PUT - İlke güncelle
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, icon, title, sortOrder, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
    }

    await db
      .update(companyPrinciples)
      .set({
        icon,
        title,
        sortOrder,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(companyPrinciples.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Principle update error:", error);
    return NextResponse.json(
      { error: "Güncelleme sırasında hata oluştu" },
      { status: 500 }
    );
  }
}

// DELETE - İlke sil
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
    }

    await db.delete(companyPrinciples).where(eq(companyPrinciples.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Principle delete error:", error);
    return NextResponse.json(
      { error: "Silme sırasında hata oluştu" },
      { status: 500 }
    );
  }
}
