import { NextResponse } from "next/server";
import { db } from "@/db";
import { sahibindenListe } from "@/db/schema";
import { like, eq, and, desc, asc, sql, SQL } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const district = searchParams.get("district");
    const neighborhood = searchParams.get("neighborhood");
    let category = searchParams.get("category");
    let transaction = searchParams.get("transaction");
    const sort = searchParams.get("sort") || "date_desc";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Normalize inputs to match DB values
    const categoryMap: Record<string, string> = {
      Konut: "konut",
      Arsa: "arsa",
      İşyeri: "isyeri",
      Bina: "bina",
    };
    const transactionMap: Record<string, string> = {
      Satılık: "satilik",
      Kiralık: "kiralik",
    };

    if (category && categoryMap[category]) category = categoryMap[category];
    if (transaction && transactionMap[transaction])
      transaction = transactionMap[transaction];

    const whereConditions: SQL[] = [];

    // Filter by District
    if (district && district !== "all") {
      whereConditions.push(eq(sahibindenListe.ilce, district));
    }

    // Filter by Neighborhood (using ILIKE on konum)
    if (neighborhood && neighborhood !== "all") {
      whereConditions.push(like(sahibindenListe.konum, `%${neighborhood}%`));
    }

    // Filter by Category
    if (category && category !== "all") {
      whereConditions.push(eq(sahibindenListe.category, category));
    }

    // Filter by Transaction
    if (transaction && transaction !== "all") {
      whereConditions.push(eq(sahibindenListe.transaction, transaction));
    }

    // Sorting
    let orderBy;
    switch (sort) {
      case "price_asc":
        orderBy = asc(sahibindenListe.fiyat);
        break;
      case "price_desc":
        orderBy = desc(sahibindenListe.fiyat);
        break;
      case "date_asc":
        orderBy = asc(sahibindenListe.tarih);
        break;
      case "date_desc":
      default:
        orderBy = desc(sahibindenListe.tarih);
        break;
    }

    // Execute Query
    const data = await db
      .select()
      .from(sahibindenListe)
      .where(and(...whereConditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Get Total Count (for pagination)
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(sahibindenListe)
      .where(and(...whereConditions));

    const total = Number(countResult[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Listings fetch error:", error);
    return NextResponse.json(
      { success: false, error: "İlanlar alınamadı" },
      { status: 500 },
    );
  }
}
