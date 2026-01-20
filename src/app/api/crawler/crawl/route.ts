import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { collectedListings } from "@/db/schema";

const MINING_API_URL = process.env.MINING_API_URL || "http://localhost:8765";

interface CrawlRequest {
  categories: string;
  max_pages: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: CrawlRequest = await request.json();
    const { categories, max_pages = 50 } = body;

    if (!categories) {
      return NextResponse.json(
        { success: false, error: "Kategori gerekli" },
        { status: 400 },
      );
    }

    // "all" seçeneği - tüm kategorileri gönder
    let categoryList: string[];
    if (categories === "all") {
      categoryList = [
        "konut_satilik",
        "konut_kiralik",
        "isyeri_satilik",
        "isyeri_kiralik",
        "arsa_satilik",
        "bina",
      ];
    } else {
      categoryList = [categories];
    }

    // Mining API'ye istek gönder (list-crawl endpoint)
    const response = await fetch(`${MINING_API_URL}/jobs/list-crawl`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categories: categoryList,
        max_pages,
        max_listings: null,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { success: false, error: `Mining API hatası: ${error}` },
        { status: response.status },
      );
    }

    const result = await response.json();

    // Job başlatıldı, job_id döndür
    return NextResponse.json({
      success: true,
      job_id: result.job_id,
      message:
        result.message ||
        `Crawler başlatıldı (${categoryList.length} kategori)`,
      categories: categoryList,
    });
  } catch (error) {
    console.error("Crawl error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
      },
      { status: 500 },
    );
  }
}
