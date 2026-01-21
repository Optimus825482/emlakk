import { NextResponse } from "next/server";

/**
 * GET /api/hendek-stats/crawl-status
 * Son crawl zamanını döndür (şimdilik mock data)
 */
export async function GET() {
  try {
    // TODO: Gerçek crawl zamanını database'den çek
    // Şimdilik mock data döndür
    return NextResponse.json({
      lastCrawl: new Date().toISOString(),
      status: "completed",
    });
  } catch (error) {
    console.error("Crawl status GET error:", error);
    return NextResponse.json(
      { error: "Crawl durumu alınamadı" },
      { status: 500 },
    );
  }
}
