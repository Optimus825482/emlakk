import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  hendekStats,
  hendekPopulationHistory,
  hendekOsbStats,
} from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";

/**
 * GET /api/hendek-stats
 * Hendek istatistiklerini getir
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // stats, population, osb

    if (type === "population") {
      // Nüfus geçmişi
      const data = await db
        .select()
        .from(hendekPopulationHistory)
        .orderBy(desc(hendekPopulationHistory.year));

      return NextResponse.json({ data });
    }

    if (type === "osb") {
      // OSB verileri
      const data = await db
        .select()
        .from(hendekOsbStats)
        .orderBy(desc(hendekOsbStats.year))
        .limit(1);

      return NextResponse.json({ data: data[0] || null });
    }

    // Varsayılan: Genel istatistikler
    const data = await db
      .select()
      .from(hendekStats)
      .where(eq(hendekStats.isActive, true))
      .orderBy(asc(hendekStats.sortOrder));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Hendek stats GET error:", error);
    return NextResponse.json(
      { error: "İstatistikler yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/hendek-stats
 * Yeni istatistik ekle
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...data } = body;

    if (type === "population") {
      const [result] = await db
        .insert(hendekPopulationHistory)
        .values(data)
        .returning();
      return NextResponse.json({ data: result }, { status: 201 });
    }

    if (type === "osb") {
      const [result] = await db.insert(hendekOsbStats).values(data).returning();
      return NextResponse.json({ data: result }, { status: 201 });
    }

    // Varsayılan: Genel istatistik
    const [result] = await db.insert(hendekStats).values(data).returning();

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    console.error("Hendek stats POST error:", error);
    return NextResponse.json(
      { error: "İstatistik eklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
