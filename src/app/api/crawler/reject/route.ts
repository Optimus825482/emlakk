import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { collectedListings } from "@/db/schema";
import { inArray, eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "ID listesi gerekli" },
        { status: 400 },
      );
    }

    // İlanları reddet
    await db
      .update(collectedListings)
      .set({
        status: "rejected",
        processedAt: new Date(),
      })
      .where(inArray(collectedListings.id, ids));

    return NextResponse.json({
      success: true,
      rejected: ids.length,
    });
  } catch (error) {
    console.error("Reject error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
      },
      { status: 500 },
    );
  }
}
