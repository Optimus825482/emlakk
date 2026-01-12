import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listingDailyStats } from "@/db/schema/listing-analytics";
import { listings } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

/**
 * GET /api/listing-analytics/detail?listingId=xxx&days=30
 * Tek bir ilanın detaylı analitik verileri
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listingId");
    const days = parseInt(searchParams.get("days") || "30");

    if (!listingId) {
      return NextResponse.json({ error: "listingId gerekli" }, { status: 400 });
    }

    // İlan bilgilerini al
    const [listing] = await db
      .select({
        id: listings.id,
        title: listings.title,
        slug: listings.slug,
        status: listings.status,
      })
      .from(listings)
      .where(eq(listings.id, listingId));

    if (!listing) {
      return NextResponse.json({ error: "İlan bulunamadı" }, { status: 404 });
    }

    // Tarih aralığı
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split("T")[0];

    // Günlük istatistikler
    const dailyStats = await db
      .select()
      .from(listingDailyStats)
      .where(
        and(
          eq(listingDailyStats.listingId, listingId),
          sql`${listingDailyStats.date} >= ${startDateStr}`
        )
      )
      .orderBy(desc(listingDailyStats.date));

    // Toplam metrikler
    const totals = dailyStats.reduce(
      (acc, day) => ({
        views: acc.views + (day.views || 0),
        uniqueVisitors: acc.uniqueVisitors + (day.uniqueVisitors || 0),
        phoneClicks: acc.phoneClicks + (day.phoneClicks || 0),
        whatsappClicks: acc.whatsappClicks + (day.whatsappClicks || 0),
        emailClicks: acc.emailClicks + (day.emailClicks || 0),
        mapClicks: acc.mapClicks + (day.mapClicks || 0),
        galleryClicks: acc.galleryClicks + (day.galleryClicks || 0),
        shareClicks: acc.shareClicks + (day.shareClicks || 0),
        favoriteAdds: acc.favoriteAdds + (day.favoriteAdds || 0),
        appointmentRequests:
          acc.appointmentRequests + (day.appointmentRequests || 0),
        mobileViews: acc.mobileViews + (day.mobileViews || 0),
        desktopViews: acc.desktopViews + (day.desktopViews || 0),
        tabletViews: acc.tabletViews + (day.tabletViews || 0),
      }),
      {
        views: 0,
        uniqueVisitors: 0,
        phoneClicks: 0,
        whatsappClicks: 0,
        emailClicks: 0,
        mapClicks: 0,
        galleryClicks: 0,
        shareClicks: 0,
        favoriteAdds: 0,
        appointmentRequests: 0,
        mobileViews: 0,
        desktopViews: 0,
        tabletViews: 0,
      }
    );

    // Ortalama süre ve scroll
    const avgDuration =
      dailyStats.length > 0
        ? Math.round(
            dailyStats.reduce((sum, d) => sum + (d.avgDuration || 0), 0) /
              dailyStats.length
          )
        : 0;

    const avgScrollDepth =
      dailyStats.length > 0
        ? Math.round(
            dailyStats.reduce((sum, d) => sum + (d.avgScrollDepth || 0), 0) /
              dailyStats.length
          )
        : 0;

    // Dönüşüm oranı
    const conversionRate =
      totals.views > 0
        ? (
            ((totals.phoneClicks +
              totals.whatsappClicks +
              totals.appointmentRequests) /
              totals.views) *
            100
          ).toFixed(2)
        : "0";

    return NextResponse.json({
      listing,
      totals: {
        ...totals,
        avgDuration,
        avgScrollDepth,
        conversionRate: parseFloat(conversionRate),
      },
      dailyStats: dailyStats.map((d) => ({
        date: d.date,
        views: d.views || 0,
        phoneClicks: d.phoneClicks || 0,
        whatsappClicks: d.whatsappClicks || 0,
      })),
      period: `${days} gün`,
    });
  } catch (error) {
    console.error("Get listing analytics detail error:", error);
    return NextResponse.json({ error: "Veriler alınamadı" }, { status: 500 });
  }
}
