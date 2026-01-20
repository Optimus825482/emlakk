import { NextResponse } from "next/server";
import { db } from "@/db";
import { listingDailyStats, listingViews } from "@/db/schema/listing-analytics";
import { listings } from "@/db/schema";
import { sql, desc, eq } from "drizzle-orm";

/**
 * GET /api/listing-analytics/summary
 * Tüm ilanların özet analitik verileri
 */
export async function GET() {
  try {
    // Son 30 günlük toplam veriler
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const startDateStr = startDate.toISOString().split("T")[0];

    // Toplam metrikler (daily stats'tan)
    const [totals] = await db
      .select({
        totalViews: sql<number>`COALESCE(SUM(${listingDailyStats.views}), 0)`,
        totalPhoneClicks: sql<number>`COALESCE(SUM(${listingDailyStats.phoneClicks}), 0)`,
        totalWhatsappClicks: sql<number>`COALESCE(SUM(${listingDailyStats.whatsappClicks}), 0)`,
      })
      .from(listingDailyStats)
      .where(sql`${listingDailyStats.date} >= ${startDateStr}`);

    // Tekil ziyaretçi sayısı (listing_views'tan distinct visitor_id)
    const [uniqueResult] = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${listingViews.visitorId})`,
      })
      .from(listingViews)
      .where(sql`${listingViews.viewedAt} >= ${startDate.toISOString()}`);

    // En çok görüntülenen ilanlar
    const topListingsData = await db
      .select({
        listingId: listingDailyStats.listingId,
        views: sql<number>`COALESCE(SUM(${listingDailyStats.views}), 0)`,
        phoneClicks: sql<number>`COALESCE(SUM(${listingDailyStats.phoneClicks}), 0)`,
      })
      .from(listingDailyStats)
      .where(sql`${listingDailyStats.date} >= ${startDateStr}`)
      .groupBy(listingDailyStats.listingId)
      .orderBy(desc(sql`SUM(${listingDailyStats.views})`))
      .limit(5);

    // İlan başlıklarını al
    const topListings = await Promise.all(
      topListingsData.map(async (item) => {
        const [listing] = await db
          .select({ title: listings.title })
          .from(listings)
          .where(eq(listings.id, item.listingId));

        return {
          id: item.listingId,
          title: listing?.title || "Bilinmeyen İlan",
          views: Number(item.views),
          phoneClicks: Number(item.phoneClicks),
        };
      })
    );

    return NextResponse.json({
      totalViews: Number(totals?.totalViews || 0),
      totalUniqueVisitors: Number(uniqueResult?.count || 0),
      totalPhoneClicks: Number(totals?.totalPhoneClicks || 0),
      totalWhatsappClicks: Number(totals?.totalWhatsappClicks || 0),
      topListings,
    });
  } catch (error) {
    console.error("Listing analytics summary error:", error);
    return NextResponse.json({
      totalViews: 0,
      totalUniqueVisitors: 0,
      totalPhoneClicks: 0,
      totalWhatsappClicks: 0,
      topListings: [],
    });
  }
}
