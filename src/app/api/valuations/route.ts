import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { valuations } from "@/db/schema";
import { createValuationSchema, valuationQuerySchema } from "@/lib/validations";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

/**
 * GET /api/valuations
 * List all valuations with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const query = valuationQuerySchema.safeParse(params);
    if (!query.success) {
      return NextResponse.json(
        {
          error: "Geçersiz sorgu parametreleri",
          details: query.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      propertyType,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = query.data;

    // Build where conditions
    const conditions = [];

    if (propertyType)
      conditions.push(eq(valuations.propertyType, propertyType));
    // Status field doesn't exist in valuations schema - skip filtering
    if (startDate)
      conditions.push(gte(valuations.createdAt, new Date(startDate)));
    if (endDate) conditions.push(lte(valuations.createdAt, new Date(endDate)));

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(valuations)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(countResult[0]?.count || 0);

    // Get paginated results
    const offset = (page - 1) * limit;

    const results = await db
      .select()
      .from(valuations)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(valuations.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + results.length < total,
      },
    });
  } catch (error) {
    console.error("Valuations GET error:", error);
    return NextResponse.json(
      { error: "Değerleme talepleri yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/valuations
 * Create a new valuation request
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = createValuationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    const [newValuation] = await db
      .insert(valuations)
      .values({
        propertyType: data.propertyType,
        address: data.address,
        area: data.area,
        details: data.features,
        name: data.name,
        email: data.email,
        phone: data.phone,
      })
      .returning();

    // TODO: Trigger AI valuation process asynchronously
    // This would typically be done via a queue or background job

    return NextResponse.json(
      {
        data: newValuation,
        message: "Değerleme talebiniz alındı. AI analizi başlatılıyor...",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Valuations POST error:", error);
    return NextResponse.json(
      { error: "Değerleme talebi oluşturulurken bir hata oluştu" },
      { status: 500 }
    );
  }
}
