import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY!;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. İlanları Çek (Limitli)
    let query = supabase
      .from("recent_new_listings")
      .select("*")
      .order("first_seen_at", { ascending: false })
      .limit(50);

    // 2. İstatistikleri Çek (Count Queries - Accurate)
    // 24 saat
    let query24h = supabase
      .from("recent_new_listings")
      .select("*", { count: "exact", head: true })
      .lte("hours_since_added", 24);

    // 48 saat
    let query48h = supabase
      .from("recent_new_listings")
      .select("*", { count: "exact", head: true })
      .lte("hours_since_added", 48);

    // Toplam Yeni
    let queryTotal = supabase
      .from("recent_new_listings")
      .select("*", { count: "exact", head: true });

    if (category) {
      query = query.eq("category", category);
      query24h = query24h.eq("category", category);
      query48h = query48h.eq("category", category);
      queryTotal = queryTotal.eq("category", category);
    }

    // Paralel çalıştır
    const [listingsRes, count24hRes, count48hRes, totalRes] = await Promise.all(
      [query, query24h, query48h, queryTotal],
    );

    if (listingsRes.error) {
      console.error("New listings error:", listingsRes.error);
      return NextResponse.json(
        { error: "Yeni ilanlar yüklenemedi" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          listings: listingsRes.data || [],
          stats: [],
          totalNew: totalRes.count || 0,
          last24h: count24hRes.count || 0,
          last48h: count48hRes.count || 0,
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
