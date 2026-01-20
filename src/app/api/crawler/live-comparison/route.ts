import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    // Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
    );

    // Sahibinden'den gerçek zamanlı sayıları çek
    const sahibindenResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/crawler/sahibinden-counts`,
      { cache: "no-store" },
    );

    let sahibindenData: any = { success: false, data: [] };
    if (sahibindenResponse.ok) {
      sahibindenData = await sahibindenResponse.json();
    }

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
        const { count: dbCount } = await supabase
          .from("sahibinden_liste")
          .select("*", { count: "exact", head: true })
          .eq("category", category)
          .eq("transaction", transaction);

        const database = dbCount || 0;

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
    const { data: recentNew } = await supabase
      .from("new_listings")
      .select("id, listing_id, baslik, fiyat, category, first_seen_at")
      .order("created_at", { ascending: false })
      .limit(5);

    // Fetch recent removed listings
    const { data: recentRemoved } = await supabase
      .from("removed_listings")
      .select("id, listing_id, baslik, fiyat, category, removed_at")
      .order("removed_at", { ascending: false })
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
      recentNew: mapRecent(recentNew || [], "new"),
      recentRemoved: mapRecent(recentRemoved || [], "removed"),
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
