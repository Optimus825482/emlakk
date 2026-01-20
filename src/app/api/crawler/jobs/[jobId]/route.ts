import { NextResponse } from "next/server";

const MINING_API_URL = process.env.MINING_API_URL || "http://localhost:8765";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await params; // AWAIT ekledik

    // Mining API'den job durumunu çek
    const response = await fetch(`${MINING_API_URL}/jobs/${jobId}`);

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "Job bulunamadı" },
        { status: 404 },
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { success: false, error: "Sunucu hatası" },
      { status: 500 },
    );
  }
}
