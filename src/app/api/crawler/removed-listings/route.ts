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

    // 1. İlanları Çek
    let query = supabase
      .from("removed_listings")
      .select("*")
      .order("removed_at", { ascending: false })
      .limit(50);

    // 2. İstatistikler (Count Query)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    let query24h = supabase
      .from("removed_listings")
      .select("*", { count: "exact", head: true })
      .gte("removed_at", oneDayAgo);

    let query7d = supabase
      .from("removed_listings")
      .select("*", { count: "exact", head: true })
      .gte("removed_at", sevenDaysAgo);

    let queryTotal = supabase
      .from("removed_listings")
      .select("*", { count: "exact", head: true });

    if (category) {
      query = query.eq("category", category);
      query24h = query24h.eq("category", category);
      query7d = query7d.eq("category", category);
      queryTotal = queryTotal.eq("category", category);
    }

    const [listingsRes, count24hRes, count7dRes, totalRes] = await Promise.all([
      query,
      query24h,
      query7d,
      queryTotal,
    ]);

    if (listingsRes.error) {
      console.error("Removed listings error:", listingsRes.error);
      return NextResponse.json(
        { error: "Kaldırılan ilanlar yüklenemedi" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          listings: listingsRes.data || [],
          totalRemoved: totalRes.count || 0,
          last24h: count24hRes.count || 0,
          last7d: count7dRes.count || 0,
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
