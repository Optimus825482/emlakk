import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { homepageSections } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

// GET - Tüm section'ları getir
export async function GET() {
  try {
    const sections = await db
      .select()
      .from(homepageSections)
      .orderBy(asc(homepageSections.sortOrder));

    return NextResponse.json(sections);
  } catch (error) {
    console.error("Homepage sections fetch error:", error);
    return NextResponse.json(
      { error: "Veriler yüklenirken hata oluştu" },
      { status: 500 }
    );
  }
}

// PUT - Section güncelle (visibility toggle)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, isVisible } = body;

    if (!key) {
      return NextResponse.json({ error: "Key gerekli" }, { status: 400 });
    }

    await db
      .update(homepageSections)
      .set({
        isVisible,
        updatedAt: new Date(),
      })
      .where(eq(homepageSections.key, key));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Homepage section update error:", error);
    return NextResponse.json(
      { error: "Güncelleme sırasında hata oluştu" },
      { status: 500 }
    );
  }
}
