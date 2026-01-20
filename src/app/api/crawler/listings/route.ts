import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { collectedListings } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status") as
      | "pending"
      | "approved"
      | "rejected"
      | "duplicate"
      | null;

    let query = db
      .select({
        id: collectedListings.id,
        title: collectedListings.title,
        price: collectedListings.price,
        location: collectedListings.location,
        status: collectedListings.status,
        crawledAt: collectedListings.crawledAt,
        sourceUrl: collectedListings.sourceUrl,
        thumbnail: collectedListings.thumbnail,
      })
      .from(collectedListings)
      .orderBy(desc(collectedListings.crawledAt))
      .limit(limit);

    if (status) {
      query = query.where(eq(collectedListings.status, status)) as any;
    }

    const listings = await query;

    return NextResponse.json({
      success: true,
      listings,
      total: listings.length,
    });
  } catch (error) {
    console.error("Failed to fetch listings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
      },
      { status: 500 },
    );
  }
}
