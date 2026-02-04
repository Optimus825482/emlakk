import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { valuations } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { withAdmin } from "@/lib/api-auth";

export const GET = withAdmin(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const propertyType = searchParams.get("propertyType");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Build base query
    const baseQuery =
      propertyType && propertyType !== "all"
        ? db
            .select()
            .from(valuations)
            .where(eq(valuations.propertyType, propertyType as any))
        : db.select().from(valuations);

    // Get total count
    const countQuery =
      propertyType && propertyType !== "all"
        ? db
            .select({ count: count() })
            .from(valuations)
            .where(eq(valuations.propertyType, propertyType as any))
        : db.select({ count: count() }).from(valuations);

    const [{ count: total }] = await countQuery;

    // Get paginated results
    const results = await baseQuery
      .orderBy(desc(valuations.createdAt))
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error("Valuations fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Değerlemeler yüklenirken bir hata oluştu" },
      { status: 500 },
    );
  }
});
