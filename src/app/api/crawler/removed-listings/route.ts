import { db } from "@/db";
import { removedListings } from "@/db/schema/crawler";
import { and, count, desc, eq, gte } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Listeleme
    let listingsQuery = db
      .select()
      .from(removedListings)
      .orderBy(desc(removedListings.removedAt))
      .limit(50)
      .$dynamic();

    // İstatistikler
    let q24h = db
      .select({ val: count() })
      .from(removedListings)
      .where(gte(removedListings.removedAt, oneDayAgo))
      .$dynamic();

    let q7d = db
      .select({ val: count() })
      .from(removedListings)
      .where(gte(removedListings.removedAt, sevenDaysAgo))
      .$dynamic();

    let qTotal = db.select({ val: count() }).from(removedListings).$dynamic();

    if (category) {
      listingsQuery = listingsQuery.where(
        eq(removedListings.category, category),
      );
      q24h = q24h.where(
        and(
          eq(removedListings.category, category),
          gte(removedListings.removedAt, oneDayAgo),
        ),
      );
      q7d = q7d.where(
        and(
          eq(removedListings.category, category),
          gte(removedListings.removedAt, sevenDaysAgo),
        ),
      );
      qTotal = qTotal.where(eq(removedListings.category, category));
    }

    const [listings, [c24h], [c7d], [cTotal]] = await Promise.all([
      listingsQuery,
      q24h,
      q7d,
      qTotal,
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          listings: listings || [],
          totalRemoved: Number(cTotal?.val || 0),
          last24h: Number(c24h?.val || 0),
          last7d: Number(c7d?.val || 0),
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
