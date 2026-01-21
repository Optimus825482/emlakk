import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { hendekStats, hendekPopulationHistory } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/hendek-stats
 * Hendek istatistiklerini getir
 * Query params:
 * - type: "stats" (default) | "population"
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "stats";

    if (type === "population") {
      // Nüfus geçmişi verilerini getir
      const data = await db
        .select()
        .from(hendekPopulationHistory)
        .orderBy(desc(hendekPopulationHistory.year));

      return NextResponse.json({ data });
    }

    // Genel istatistikleri getir
    const stats = await db
      .select()
      .from(hendekStats)
      .where(eq(hendekStats.isActive, true))
      .orderBy(hendekStats.sortOrder);

    return NextResponse.json({ data: stats });
  } catch (error) {
    console.error("Hendek stats GET error:", error);
    return NextResponse.json(
      { error: "İstatistikler yüklenirken hata oluştu" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/hendek-stats
 * Tek bir istatistiği güncelle
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "İstatistik ID gerekli" },
        { status: 400 },
      );
    }

    const [updated] = await db
      .update(hendekStats)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(hendekStats.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "İstatistik bulunamadı" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Hendek stats PUT error:", error);
    return NextResponse.json(
      { error: "Güncelleme sırasında hata oluştu" },
      { status: 500 },
    );
  }
}
