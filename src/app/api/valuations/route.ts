import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { valuations } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyType = searchParams.get("propertyType");

    let query = db
      .select()
      .from(valuations)
      .orderBy(desc(valuations.createdAt));

    if (propertyType && propertyType !== "all") {
      query = query.where(eq(valuations.propertyType, propertyType as any));
    }

    const results = await query;

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Valuations fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Değerlemeler yüklenirken bir hata oluştu" },
      { status: 500 },
    );
  }
}
