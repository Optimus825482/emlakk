import { NextResponse } from "next/server";
import { db } from "@/db";
import { sahibindenListe } from "@/db/schema";
import { sql, eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    // URL'den ilce parametresini al
    const { searchParams } = new URL(request.url);
    const ilce = searchParams.get("ilce");
    const neighborhood = searchParams.get("neighborhood");
    let category = searchParams.get("category");
    let transaction = searchParams.get("transaction");

    // Normalize inputs to match DB values
    // DB values: konut, arsa, isyeri, bina | satilik, kiralik
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

    if (category && categoryMap[category]) {
      category = categoryMap[category];
    } else if (category) {
      // Fallback for direct API usage
      category = category
        .toLowerCase()
        .replace(/ğ/g, "g")
        .replace(/ü/g, "u")
        .replace(/ş/g, "s")
        .replace(/ı/g, "i")
        .replace(/ö/g, "o")
        .replace(/ç/g, "c");
    }

    if (transaction && transactionMap[transaction]) {
      transaction = transactionMap[transaction];
    } else if (transaction) {
      transaction = transaction
        .toLowerCase()
        .replace(/ğ/g, "g")
        .replace(/ü/g, "u")
        .replace(/ş/g, "s")
        .replace(/ı/g, "i")
        .replace(/ö/g, "o")
        .replace(/ç/g, "c");
    }

    // Where conditions
    const whereConditions = [
      sql`${sahibindenListe.category} IS NOT NULL`,
      sql`${sahibindenListe.transaction} IS NOT NULL`,
    ];

    // İlçe filtresi varsa ekle
    if (ilce && ilce !== "all") {
      whereConditions.push(eq(sahibindenListe.ilce, ilce));
    }

    // Mahalle filtresi varsa ekle
    if (neighborhood && neighborhood !== "all") {
      // Use ILIKE for neighborhood matching in 'konum' column
      whereConditions.push(
        sql`${sahibindenListe.konum} ILIKE ${`%${neighborhood}%`}`,
      );
    }

    // Kategori filtresi varsa ekle
    if (category && category !== "all") {
      whereConditions.push(eq(sahibindenListe.category, category));
    }

    // İşlem filtresi varsa ekle
    if (transaction && transaction !== "all") {
      whereConditions.push(eq(sahibindenListe.transaction, transaction));
    }

    // Kategori bazlı sayıları çek
    const categoryData = await db
      .select({
        category: sahibindenListe.category,
        transaction: sahibindenListe.transaction,
      })
      .from(sahibindenListe)
      .where(and(...whereConditions));

    // Kategori bazlı sayıları hesapla
    const stats: Record<string, number> = {};

    categoryData.forEach((item) => {
      if (item.category && item.transaction) {
        const key = `${item.category}_${item.transaction}`;
        stats[key] = (stats[key] || 0) + 1;
      }
    });

    // Kategorileri düzenle
    const categories = [
      {
        id: "konut_satilik",
        label: "Konut Satılık",
        icon: "home",
        color: "blue",
        count: stats["konut_satilik"] || 0,
      },
      {
        id: "konut_kiralik",
        label: "Konut Kiralık",
        icon: "key",
        color: "cyan",
        count: stats["konut_kiralik"] || 0,
      },
      {
        id: "arsa_satilik",
        label: "Arsa Satılık",
        icon: "landscape",
        color: "green",
        count: stats["arsa_satilik"] || 0,
      },
      {
        id: "isyeri_satilik",
        label: "İşyeri Satılık",
        icon: "store",
        color: "purple",
        count: stats["isyeri_satilik"] || 0,
      },
      {
        id: "isyeri_kiralik",
        label: "İşyeri Kiralık",
        icon: "storefront",
        color: "orange",
        count: stats["isyeri_kiralik"] || 0,
      },
      {
        id: "bina_satilik",
        label: "Bina Satılık",
        icon: "domain",
        color: "red",
        count: stats["bina_satilik"] || 0,
      },
    ];

    // Toplam sayı
    const total = categories.reduce((sum, cat) => sum + cat.count, 0);

    return NextResponse.json({
      success: true,
      data: {
        categories,
        total,
        ilce: ilce || "all",
        lastUpdate: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Category stats error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Kategori istatistikleri alınamadı",
      },
      { status: 500 },
    );
  }
}
