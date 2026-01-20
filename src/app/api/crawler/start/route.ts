import { NextResponse } from "next/server";

const MINING_API_URL = process.env.MINING_API_URL || "http://localhost:8765";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { categories, maxPages = 50 } = body;

    if (!categories || categories.length === 0) {
      return NextResponse.json(
        { success: false, error: "Kategori seçilmedi" },
        { status: 400 },
      );
    }

    // Mining API'ye crawler başlatma isteği gönder
    const response = await fetch(`${MINING_API_URL}/jobs/list-crawl`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        categories: categories,
        max_pages: maxPages,
        save_to_db: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Mining API error:", error);
      return NextResponse.json(
        { success: false, error: "Crawler başlatılamadı" },
        { status: 500 },
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      jobId: result.job_id,
      message: "Crawler başlatıldı",
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { success: false, error: "Sunucu hatası" },
      { status: 500 },
    );
  }
}
