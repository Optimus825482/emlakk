import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { manifesto } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET - Manifesto getir
export async function GET() {
  try {
    const [data] = await db
      .select()
      .from(manifesto)
      .where(eq(manifesto.isActive, true))
      .limit(1);

    return NextResponse.json({ data: data || null });
  } catch (error) {
    console.error("Manifesto fetch error:", error);
    return NextResponse.json(
      { error: "Veriler yüklenirken hata oluştu" },
      { status: 500 },
    );
  }
}

// PUT - Manifesto güncelle
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { shortTitle, shortText, fullTitle, fullText, signature } = body;

    // Mevcut kaydı kontrol et
    const [existing] = await db.select().from(manifesto).limit(1);

    if (existing) {
      await db
        .update(manifesto)
        .set({
          shortTitle,
          shortText,
          fullTitle,
          fullText,
          signature,
          updatedAt: new Date(),
        })
        .where(eq(manifesto.id, existing.id));
    } else {
      await db.insert(manifesto).values({
        shortTitle,
        shortText,
        fullTitle,
        fullText,
        signature,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Manifesto update error:", error);
    return NextResponse.json(
      { error: "Güncelleme sırasında hata oluştu" },
      { status: 500 },
    );
  }
}
