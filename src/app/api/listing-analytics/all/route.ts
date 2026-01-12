import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listingDailyStats } from "@/db/schema/listing-analytics";
import { listings } from "@/db/schema";
import { sql, desc, eq } from "drizzle-orm";

/**
 * GET /api/listing-analytics/all
 * Tüm ilanların analitik verileri (tablo için)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split("T")[0];

    // Tüm ilanları al
    const allListings = await db
      .select({
        id: listings.id,
        title: listings.title,
        slug: listings.slug,
        status: listings.status,
      })
      .from(listings)
      .orderBy(desc(listings.createdAt));

    // Her ilan için analitik verileri al
    const listingsWithAnalytics = await Promise.all(
      allListings.map(async (listing) => {
        const stats = await db
          .select({
            views: sql<number>`COALESCE(SUM(${listingDailyStats.views}), 0)`,
            uniqueVisitors: sql<number>`COALESCE(SUM(${listingDailyStats.uniqueVisitors}), 0)`,
            phoneClicks: sql<number>`COALESCE(SUM(${listingDailyStats.phoneClicks}), 0)`,
            whatsappClicks: sql<number>`COALESCE(SUM(${listingDailyStats.whatsappClicks}), 0)`,
            emailClicks: sql<number>`COALESCE(SUM(${listingDailyStats.emailClicks}), 0)`,
            mapClicks: sql<number>`COALESCE(SUM(${listingDailyStats.mapClicks}), 0)`,
            favoriteAdds: sql<number>`COALESCE(SUM(${listingDailyStats.favoriteAdds}), 0)`,
            appointmentRequests: sql<number>`COALESCE(SUM(${listingDailyStats.appointmentRequests}), 0)`,
          })
          .from(listingDailyStats)
          .where(
            sql`${listingDailyStats.listingId} = ${listing.id} AND ${listingDailyStats.date} >= ${startDateStr}`
          );

        const data = stats[0] || {};
        const views = Number(data.views || 0);
        const phoneClicks = Number(data.phoneClicks || 0);
        const whatsappClicks = Number(data.whatsappClicks || 0);
        const appointmentRequests = Number(data.appointmentRequests || 0);

        // Dönüşüm oranı: (telefon + whatsapp + randevu) / görüntüleme * 100
        const conversionRate =
          views > 0
            ? ((phoneClicks + whatsappClicks + appointmentRequests) / views) *
              100
            : 0;

        return {
          id: listing.id,
          title: listing.title,
          slug: listing.slug,
          status: listing.status,
          views,
          uniqueVisitors: Number(data.uniqueVisitors || 0),
          phoneClicks,
          whatsappClicks,
          emailClicks: Number(data.emailClicks || 0),
          mapClicks: Number(data.mapClicks || 0),
          favoriteAdds: Number(data.favoriteAdds || 0),
          appointmentRequests,
          conversionRate,
        };
      })
    );

    return NextResponse.json({
      listings: listingsWithAnalytics,
      period: `${days} gün`,
    });
  } catch (error) {
    console.error("Get all listing analytics error:", error);
    return NextResponse.json({ listings: [], error: "Veriler alınamadı" });
  }
}
