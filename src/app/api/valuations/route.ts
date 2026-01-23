import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { valuations } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";

export async function GET(request: NextRequest) {
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
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      propertyType,
      address,
      city,
      district,
      area,
      details,
      estimatedValue,
      minValue,
      maxValue,
      pricePerSqm,
      confidenceScore,
      comparables,
      marketAnalysis,
    } = body;

    // Validation
    if (!propertyType || !address || !city || !area) {
      return NextResponse.json(
        {
          success: false,
          error: "Mülk tipi, adres, şehir ve alan zorunludur",
        },
        { status: 400 },
      );
    }

    const [newValuation] = await db
      .insert(valuations)
      .values({
        name: name || null,
        email: email || null,
        phone: phone || null,
        propertyType,
        address,
        city,
        district: district || null,
        area: parseFloat(area),
        details: details || null,
        estimatedValue: estimatedValue || null,
        minValue: minValue || null,
        maxValue: maxValue || null,
        pricePerSqm: pricePerSqm || null,
        confidenceScore: confidenceScore || null,
        comparables: comparables || null,
        marketAnalysis: marketAnalysis || null,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newValuation,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Valuation create error:", error);
    return NextResponse.json(
      { success: false, error: "Değerleme oluşturulurken bir hata oluştu" },
      { status: 500 },
    );
  }
}
