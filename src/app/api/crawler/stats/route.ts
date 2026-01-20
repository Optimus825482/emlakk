import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MINING_API_URL = process.env.MINING_API_URL || "http://localhost:8765";

export async function GET() {
  try {
    const response = await fetch(`${MINING_API_URL}/stats`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          total_listings: 0,
          active_jobs: 0,
          recent_24h: 0,
          pending_details: 0,
          active_processes: 0,
          by_category: { konut: 0, isyeri: 0, arsa: 0 },
          category_stats: [],
          error: "Mining API'ye ulaşılamıyor",
        },
        { status: 503 },
      );
    }

    const data = await response.json();

    // Kategori bazlı istatistikler için Supabase'den veri çek
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
    );

    // Her kategori için ilan sayısı ve son güncelleme
    const categories = [
      {
        key: "konut_satilik",
        label: "Konut Satılık",
        category: "konut",
        transaction: "satilik",
      },
      {
        key: "konut_kiralik",
        label: "Konut Kiralık",
        category: "konut",
        transaction: "kiralik",
      },
      {
        key: "isyeri_satilik",
        label: "İşyeri Satılık",
        category: "isyeri",
        transaction: "satilik",
      },
      {
        key: "isyeri_kiralik",
        label: "İşyeri Kiralık",
        category: "isyeri",
        transaction: "kiralik",
      },
      {
        key: "arsa_satilik",
        label: "Arsa Satılık",
        category: "arsa",
        transaction: "satilik",
      },
      {
        key: "bina",
        label: "Bina (Tümü)",
        category: "bina",
        transaction: null, // Bina için transaction filtresi yok
      },
    ];

    const categoryStats = await Promise.all(
      categories.map(async (cat) => {
        // İlan sayısı - Bina için transaction filtresi yok
        let query = supabase
          .from("sahibinden_liste")
          .select("*", { count: "exact", head: true })
          .eq("category", cat.category);

        if (cat.transaction) {
          query = query.eq("transaction", cat.transaction);
        }

        const { count } = await query;

        // Son güncelleme tarihi
        let lastUpdateQuery = supabase
          .from("sahibinden_liste")
          .select("tarih")
          .eq("category", cat.category)
          .order("tarih", { ascending: false })
          .limit(1);

        if (cat.transaction) {
          lastUpdateQuery = lastUpdateQuery.eq("transaction", cat.transaction);
        }

        const { data: lastUpdate } = await lastUpdateQuery.single();

        return {
          key: cat.key,
          label: cat.label,
          count: count || 0,
          last_updated: lastUpdate?.tarih || null,
        };
      }),
    );

    return NextResponse.json({
      ...data,
      category_stats: categoryStats,
    });
  } catch (error) {
    console.error("Mining API stats failed:", error);
    return NextResponse.json(
      {
        total_listings: 0,
        active_jobs: 0,
        recent_24h: 0,
        pending_details: 0,
        active_processes: 0,
        by_category: { konut: 0, isyeri: 0, arsa: 0 },
        category_stats: [],
        error: "Mining servisi çalışmıyor",
      },
      { status: 503 },
    );
  }
}
