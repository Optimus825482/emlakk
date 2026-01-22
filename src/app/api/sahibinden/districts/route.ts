import { NextResponse } from "next/server";
import { db } from "@/db";
import { sahibindenListe } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // İlce kolonundan direkt ilçeleri ve sayılarını çek
    const result = await db
      .select({
        district: sahibindenListe.ilce,
        count: sql<number>`count(*)`,
      })
      .from(sahibindenListe)
      .where(sql`${sahibindenListe.ilce} IS NOT NULL`)
      .groupBy(sahibindenListe.ilce)
      .orderBy(sql`count(*) DESC`);

    // Formatla
    const districts = result.map((row) => ({
      value:
        row.district
          ?.toLowerCase()
          .replace(/ı/g, "i")
          .replace(/ğ/g, "g")
          .replace(/ü/g, "u")
          .replace(/ş/g, "s")
          .replace(/ö/g, "o")
          .replace(/ç/g, "c") || "",
      label: row.district || "",
      count: Number(row.count) || 0,
    }));

    return NextResponse.json({
      success: true,
      data: districts,
      total: districts.length,
    });
  } catch (error: any) {
    console.error("Districts error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "İlçeler alınamadı",
      },
      { status: 500 },
    );
  }
}
