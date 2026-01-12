import { NextRequest, NextResponse } from "next/server";
import {
  getAnalyticsOverview,
  getTopPages,
  getTrafficSources,
  getDailyTrend,
  getRealtimeUsers,
} from "@/lib/google-analytics";

/**
 * GET /api/analytics
 * Google Analytics verilerini getir
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "overview";
    const days = parseInt(searchParams.get("days") || "7");
    const limit = parseInt(searchParams.get("limit") || "10");

    // GA credentials kontrolü
    if (!process.env.GA_PROPERTY_ID || !process.env.GA_CLIENT_EMAIL) {
      return NextResponse.json({
        error: "Google Analytics yapılandırılmamış",
        configured: false,
      });
    }

    let data;

    switch (type) {
      case "overview":
        data = await getAnalyticsOverview(days);
        break;
      case "pages":
        data = await getTopPages(limit);
        break;
      case "sources":
        data = await getTrafficSources(limit);
        break;
      case "trend":
        data = await getDailyTrend(days);
        break;
      case "realtime":
        data = await getRealtimeUsers();
        break;
      case "all":
        // Tüm verileri paralel olarak çek
        const [overview, pages, sources, trend, realtime] = await Promise.all([
          getAnalyticsOverview(days),
          getTopPages(limit),
          getTrafficSources(limit),
          getDailyTrend(days),
          getRealtimeUsers(),
        ]);
        data = { overview, pages, sources, trend, realtime };
        break;
      default:
        return NextResponse.json(
          {
            error:
              "Geçersiz tip. Kullanılabilir: overview, pages, sources, trend, realtime, all",
          },
          { status: 400 }
        );
    }

    return NextResponse.json({ data, configured: true });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      {
        error: "Analytics verileri alınırken bir hata oluştu",
        details: String(error),
        configured: true,
      },
      { status: 500 }
    );
  }
}
