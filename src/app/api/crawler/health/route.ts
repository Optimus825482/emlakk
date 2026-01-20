import { NextResponse } from "next/server";

const MINING_API_URL = process.env.MINING_API_URL || "http://localhost:8765";

export async function GET() {
  try {
    const response = await fetch(`${MINING_API_URL}/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          status: "unhealthy",
          crawler_ready: false,
          is_crawling: false,
          error: "Mining API'ye ulaşılamıyor",
        },
        { status: 503 },
      );
    }

    const data = await response.json();
    return NextResponse.json({
      status: data.status,
      crawler_ready: true,
      is_crawling: false,
      timestamp: data.timestamp,
    });
  } catch (error) {
    console.error("Mining API health check failed:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        crawler_ready: false,
        is_crawling: false,
        error: "Mining servisi çalışmıyor",
      },
      { status: 503 },
    );
  }
}
