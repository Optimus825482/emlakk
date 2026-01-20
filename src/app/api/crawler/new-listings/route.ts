import { db } from "@/db";
import { newListings } from "@/db/schema/crawler";
import { and, count, desc, eq, gte } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    // Listeleme
    let listingsQuery = db
      .select()
      .from(newListings)
      .orderBy(desc(newListings.firstSeenAt))
      .limit(50)
      .$dynamic();

    // İstatistikler
    let q24h = db
      .select({ val: count() })
      .from(newListings)
      .where(gte(newListings.firstSeenAt, oneDayAgo))
      .$dynamic();

    let q48h = db
      .select({ val: count() })
      .from(newListings)
      .where(gte(newListings.firstSeenAt, twoDaysAgo))
      .$dynamic();

    let qTotal = db.select({ val: count() }).from(newListings).$dynamic();

    if (category) {
      listingsQuery = listingsQuery.where(eq(newListings.category, category));
      q24h = q24h.where(
        and(
          eq(newListings.category, category),
          gte(newListings.firstSeenAt, oneDayAgo),
        ),
      );
      q48h = q48h.where(
        and(
          eq(newListings.category, category),
          gte(newListings.firstSeenAt, twoDaysAgo),
        ),
      );
      qTotal = qTotal.where(eq(newListings.category, category));
    }

    const [listings, [c24h], [c48h], [cTotal]] = await Promise.all([
      listingsQuery,
      q24h,
      q48h,
      qTotal,
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          listings: listings || [],
          stats: [],
          totalNew: Number(cTotal?.val || 0),
          last24h: Number(c24h?.val || 0),
          last48h: Number(c48h?.val || 0),
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
