import { NextResponse } from "next/server";

const MINING_API_URL = process.env.MINING_API_URL || "http://localhost:8765";

export async function GET() {
  try {
    // Mining API'den (Selenium) gerçek sayıları al
    const response = await fetch(`${MINING_API_URL}/live-counts`, {
      method: "GET",
      // Python'un işlemesi 10-15sn sürebilir, timeout'a dikkat
      signal: AbortSignal.timeout(60000), // 60sn limit
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Mining API Error: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Bilinmeyen hata");
    }

    // Python map: { konut: 123, konut_kiralik: 456 ... }
    // Frontend map: [{ category: "konut", satilik: 123, kiralik: 456 }]
    const rawCounts = result.counts;

    const detailedCounts = [
      {
        category: "konut",
        satilik: rawCounts.konut || 0,
        kiralik: rawCounts.konut_kiralik || 0,
      },
      {
        category: "isyeri",
        satilik: rawCounts.isyeri || 0,
        kiralik: rawCounts.isyeri_kiralik || 0,
      },
      {
        category: "arsa",
        satilik: rawCounts.arsa || 0,
        kiralik: 0,
      },
      {
        category: "bina",
        satilik: rawCounts.bina || 0,
        kiralik: 0,
      },
    ];

    return NextResponse.json({
      success: true,
      data: detailedCounts,
      timestamp: new Date().toISOString(),
      source: "selenium",
    });
  } catch (error: any) {
    console.error("Sahibinden counts error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error.message || "Sahibinden sayıları çekilemedi (Selenium Hatası)",
        data: [],
      },
      { status: 500 },
    );
  }
}
