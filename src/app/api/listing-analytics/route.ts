import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listingViews, listingDailyStats } from "@/db/schema/listing-analytics";
import { eq, and, sql, desc } from "drizzle-orm";
import { headers } from "next/headers";

/**
 * POST /api/listing-analytics
 * İlan görüntüleme verisi kaydet
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headersList = await headers();

    const {
      listingId,
      visitorId,
      sessionId,
      duration,
      scrollDepth,
      clickedPhone,
      clickedWhatsapp,
      clickedEmail,
      clickedMap,
      clickedGallery,
      clickedShare,
      addedToFavorites,
      requestedAppointment,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
    } = body;

    if (!listingId) {
      return NextResponse.json({ error: "listingId gerekli" }, { status: 400 });
    }

    // IP ve User Agent
    const forwardedFor = headersList.get("x-forwarded-for");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || "unknown";
    const userAgent = headersList.get("user-agent") || "";

    // Cihaz tipi tespit
    const deviceType = detectDeviceType(userAgent);
    const browser = detectBrowser(userAgent);
    const os = detectOS(userAgent);

    // Görüntüleme kaydı oluştur
    const [view] = await db
      .insert(listingViews)
      .values({
        listingId,
        visitorId,
        sessionId,
        ipAddress,
        userAgent,
        deviceType,
        browser,
        os,
        referrer,
        utmSource,
        utmMedium,
        utmCampaign,
        duration,
        scrollDepth,
        clickedPhone: clickedPhone || false,
        clickedWhatsapp: clickedWhatsapp || false,
        clickedEmail: clickedEmail || false,
        clickedMap: clickedMap || false,
        clickedGallery: clickedGallery || false,
        clickedShare: clickedShare || false,
        addedToFavorites: addedToFavorites || false,
        requestedAppointment: requestedAppointment || false,
      })
      .returning({ id: listingViews.id });

    // Günlük istatistikleri güncelle
    await updateDailyStats(listingId, deviceType, {
      clickedPhone,
      clickedWhatsapp,
      clickedEmail,
      clickedMap,
      clickedGallery,
      clickedShare,
      addedToFavorites,
      requestedAppointment,
    });

    return NextResponse.json({ success: true, viewId: view.id });
  } catch (error) {
    console.error("Listing analytics error:", error);
    return NextResponse.json({ error: "Veri kaydedilemedi" }, { status: 500 });
  }
}

/**
 * GET /api/listing-analytics?listingId=xxx
 * İlan analitik verilerini getir
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listingId");
    const days = parseInt(searchParams.get("days") || "30");

    if (!listingId) {
      return NextResponse.json({ error: "listingId gerekli" }, { status: 400 });
    }

    // Son X günlük istatistikler
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split("T")[0];

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

    // Dönüşüm oranları
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
      totals: {
        ...totals,
        avgDuration,
        avgScrollDepth,
        conversionRate: parseFloat(conversionRate),
      },
      dailyStats,
      period: `${days} gün`,
    });
  } catch (error) {
    console.error("Get listing analytics error:", error);
    return NextResponse.json({ error: "Veriler alınamadı" }, { status: 500 });
  }
}

// Helper: Günlük istatistikleri güncelle
async function updateDailyStats(
  listingId: string,
  deviceType: string,
  actions: Record<string, boolean | undefined>
) {
  const today = new Date().toISOString().split("T")[0];

  // Mevcut kaydı bul veya oluştur
  const [existing] = await db
    .select()
    .from(listingDailyStats)
    .where(
      and(
        eq(listingDailyStats.listingId, listingId),
        eq(listingDailyStats.date, today)
      )
    );

  if (existing) {
    // Güncelle
    await db
      .update(listingDailyStats)
      .set({
        views: sql`${listingDailyStats.views} + 1`,
        mobileViews:
          deviceType === "mobile"
            ? sql`${listingDailyStats.mobileViews} + 1`
            : listingDailyStats.mobileViews,
        desktopViews:
          deviceType === "desktop"
            ? sql`${listingDailyStats.desktopViews} + 1`
            : listingDailyStats.desktopViews,
        tabletViews:
          deviceType === "tablet"
            ? sql`${listingDailyStats.tabletViews} + 1`
            : listingDailyStats.tabletViews,
        phoneClicks: actions.clickedPhone
          ? sql`${listingDailyStats.phoneClicks} + 1`
          : listingDailyStats.phoneClicks,
        whatsappClicks: actions.clickedWhatsapp
          ? sql`${listingDailyStats.whatsappClicks} + 1`
          : listingDailyStats.whatsappClicks,
        emailClicks: actions.clickedEmail
          ? sql`${listingDailyStats.emailClicks} + 1`
          : listingDailyStats.emailClicks,
        mapClicks: actions.clickedMap
          ? sql`${listingDailyStats.mapClicks} + 1`
          : listingDailyStats.mapClicks,
        galleryClicks: actions.clickedGallery
          ? sql`${listingDailyStats.galleryClicks} + 1`
          : listingDailyStats.galleryClicks,
        shareClicks: actions.clickedShare
          ? sql`${listingDailyStats.shareClicks} + 1`
          : listingDailyStats.shareClicks,
        favoriteAdds: actions.addedToFavorites
          ? sql`${listingDailyStats.favoriteAdds} + 1`
          : listingDailyStats.favoriteAdds,
        appointmentRequests: actions.requestedAppointment
          ? sql`${listingDailyStats.appointmentRequests} + 1`
          : listingDailyStats.appointmentRequests,
        updatedAt: new Date(),
      })
      .where(eq(listingDailyStats.id, existing.id));
  } else {
    // Yeni kayıt oluştur
    await db.insert(listingDailyStats).values({
      listingId,
      date: today,
      views: 1,
      mobileViews: deviceType === "mobile" ? 1 : 0,
      desktopViews: deviceType === "desktop" ? 1 : 0,
      tabletViews: deviceType === "tablet" ? 1 : 0,
      phoneClicks: actions.clickedPhone ? 1 : 0,
      whatsappClicks: actions.clickedWhatsapp ? 1 : 0,
      emailClicks: actions.clickedEmail ? 1 : 0,
      mapClicks: actions.clickedMap ? 1 : 0,
      galleryClicks: actions.clickedGallery ? 1 : 0,
      shareClicks: actions.shareClicks ? 1 : 0,
      favoriteAdds: actions.addedToFavorites ? 1 : 0,
      appointmentRequests: actions.requestedAppointment ? 1 : 0,
    });
  }
}

// Helper: Cihaz tipi tespit
function detectDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
    return "mobile";
  }
  if (/ipad|tablet/i.test(ua)) {
    return "tablet";
  }
  return "desktop";
}

// Helper: Tarayıcı tespit
function detectBrowser(userAgent: string): string {
  if (/edg/i.test(userAgent)) return "Edge";
  if (/chrome/i.test(userAgent)) return "Chrome";
  if (/firefox/i.test(userAgent)) return "Firefox";
  if (/safari/i.test(userAgent)) return "Safari";
  if (/opera|opr/i.test(userAgent)) return "Opera";
  return "Other";
}

// Helper: İşletim sistemi tespit
function detectOS(userAgent: string): string {
  if (/windows/i.test(userAgent)) return "Windows";
  if (/macintosh|mac os/i.test(userAgent)) return "macOS";
  if (/linux/i.test(userAgent)) return "Linux";
  if (/android/i.test(userAgent)) return "Android";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "iOS";
  return "Other";
}
