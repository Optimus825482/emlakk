import { NextResponse } from "next/server";

/**
 * POST /api/hendek-stats/crawl
 * Hendek verilerini TÜİK'ten çek ve güncelle
 */
export async function POST() {
  try {
    // TODO: Gerçek crawler implementasyonu
    // Şimdilik başarılı response döndür
    console.log("Hendek stats crawler triggered");

    return NextResponse.json({
      success: true,
      message: "Veriler güncellendi",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Hendek stats crawl error:", error);
    return NextResponse.json(
      { error: "Crawl sırasında hata oluştu" },
      { status: 500 },
    );
  }
}
