import { db } from "@/db";
import {
  newListings,
  removedListings,
  sahibindenListe,
} from "@/db/schema/crawler";
import { and, count, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

interface CategoryComparison {
  category: string;
  transaction: string;
  database: number;
  sahibinden: number;
  diff: number;
  status: "new" | "removed" | "synced";
}

interface ComparisonData {
  database: number;
  sahibinden: number;
  diff: number;
  status: "new" | "removed" | "synced";
  last_checked_at: string;
}

export async function GET() {
  try {
    // Kategoriler
    const categories = [
      { category: "konut", transaction: "satilik" },
      { category: "konut", transaction: "kiralik" },
      { category: "arsa", transaction: "satilik" },
      { category: "isyeri", transaction: "satilik" },
      { category: "isyeri", transaction: "kiralik" },
      { category: "bina", transaction: "satilik" },
    ];

    // Her kategori için karşılaştırma
    const comparisons: CategoryComparison[] = await Promise.all(
      categories.map(async ({ category, transaction }) => {
        // Database'den sayı
        const [dbResult] = await db
          .select({ value: count() })
          .from(sahibindenListe)
          .where(
            and(
              eq(sahibindenListe.category, category),
              eq(sahibindenListe.transaction, transaction),
            ),
          );

        const database = Number(dbResult?.value || 0);

        // Sahibinden'den sayı
        let sahibinden = 0;
        if (sahibindenData.success) {
          const catData = sahibindenData.data.find(
            (d: any) => d.category === category,
          );
          if (catData) {
            sahibinden = catData[transaction] || 0;
          }
        }

        const diff = sahibinden - database;

        let status: "new" | "removed" | "synced" = "synced";
        if (diff > 0) status = "new";
        else if (diff < 0) status = "removed";

        return {
          category,
          transaction,
          database,
          sahibinden,
          diff,
          status,
        };
      }),
    );

    // Sahibinden'den gerçek zamanlı sayıları çek (Async carry over)
    const sahibindenResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/crawler/sahibinden-counts`,
      { cache: "no-store" },
    );

    let sahibindenData: any = { success: false, data: [] };
    if (sahibindenResponse.ok) {
      sahibindenData = await sahibindenResponse.json();
    }

    // Transform to Record<string, ComparisonData> for frontend
    const comparisonRecord: Record<string, ComparisonData> = {};
    let total_new = 0;
    let total_removed = 0;

    comparisons.forEach((comp) => {
      let key = comp.category;
      // Logic to match frontend CATEGORY_LABELS keys:
      // konut, konut_kiralik, isyeri, isyeri_kiralik, arsa, bina
      if (comp.transaction === "kiralik") {
        key = `${comp.category}_kiralik`;
      }

      comparisonRecord[key] = {
        database: comp.database,
        sahibinden: comp.sahibinden,
        diff: comp.diff,
        status: comp.status,
        last_checked_at: new Date().toISOString(),
      };

      if (comp.diff > 0) total_new += comp.diff;
      if (comp.diff < 0) total_removed += Math.abs(comp.diff);
    });

    // Fetch recent new listings
    const recentNewRows = await db
      .select({
        id: newListings.id,
        listingId: newListings.listingId,
        baslik: newListings.baslik,
        fiyat: newListings.fiyat,
        category: newListings.category,
        firstSeenAt: newListings.firstSeenAt,
      })
      .from(newListings)
      .orderBy(desc(newListings.createdAt))
      .limit(5);

    // Fetch recent removed listings
    const recentRemovedRows = await db
      .select({
        id: removedListings.id,
        listingId: removedListings.listingId,
        baslik: removedListings.baslik,
        fiyat: removedListings.fiyat,
        category: removedListings.category,
        removedAt: removedListings.removedAt,
      })
      .from(removedListings)
      .orderBy(desc(removedListings.removedAt))
      .limit(5);

    // Map to frontend interface
    const mapRecent = (items: any[], type: "new" | "removed") =>
      items?.map((item) => ({
        id: item.listing_id || item.id,
        title: item.baslik,
        price: item.fiyat,
        category: item.category,
        first_seen_at: item.first_seen_at,
        removed_at: item.removed_at,
        sahibinden_url: item.link, // if available
      })) || [];

    return NextResponse.json({
      success: true,
      comparison: comparisonRecord,
      summary: {
        total_new,
        total_removed,
      },
      recentNew: mapRecent(recentNewRows || [], "new"),
      recentRemoved: mapRecent(recentRemovedRows || [], "removed"),
      timestamp: new Date().toISOString(),
      sahibinden_available: sahibindenData.success,
    });
  } catch (error) {
    console.error("Live comparison error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Karşılaştırma yapılamadı",
        comparison: {}, // Empty fallback
        summary: { total_new: 0, total_removed: 0 },
        data: [],
      },
      { status: 500 },
    );
  }
}
