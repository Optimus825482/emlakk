import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { valuations } from "@/db/schema";
import { createValuationSchema, valuationQuerySchema } from "@/lib/validations";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { triggerAIValuation } from "@/lib/workflow-trigger";
import { notifyNewValuation } from "@/lib/notification-helper";
import { log, captureError } from "@/lib/monitoring";

/**
 * Map frontend property types to database enum values
 */
const mapPropertyType = (
  frontendType: "sanayi" | "tarim" | "konut" | "ticari" | "arsa",
): "sanayi" | "tarim" | "konut" | "arsa" | "isyeri" | "diger" => {
  const typeMap = {
    sanayi: "sanayi" as const,
    tarim: "tarim" as const,
    konut: "konut" as const,
    ticari: "isyeri" as const,
    arsa: "arsa" as const,
  };
  return typeMap[frontendType];
};

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
        { status: 400 },
      );
    }

    const {
      propertyType,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = query.data;

    const conditions = [];

    if (propertyType) {
      const dbType = mapPropertyType(propertyType);
      conditions.push(eq(valuations.propertyType, dbType));
    }
    if (startDate)
      conditions.push(gte(valuations.createdAt, new Date(startDate)));
    if (endDate) conditions.push(lte(valuations.createdAt, new Date(endDate)));

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(valuations)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(countResult[0]?.count || 0);

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
    if (error instanceof Error) {
      await captureError(error, { module: "valuations-api", method: "GET" });
    }
    return NextResponse.json(
      { error: "Değerleme talepleri yüklenirken bir hata oluştu" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = createValuationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const data = validation.data;

    const [newValuation] = await db
      .insert(valuations)
      .values({
        propertyType: mapPropertyType(data.propertyType),
        address: data.address,
        area: data.area,
        details: data.features as Record<string, unknown>,
        name: data.name,
        email: data.email,
        phone: data.phone,
      })
      .returning();

    triggerAIValuation(newValuation.id);

    notifyNewValuation(newValuation.id, data.name, data.propertyType);

    log("info", "Yeni değerleme talebi oluşturuldu", {
      module: "valuations-api",
      valuationId: newValuation.id,
    });

    return NextResponse.json(
      {
        data: newValuation,
        message: "Değerleme talebiniz alındı. AI analizi başlatılıyor...",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error) {
      await captureError(error, { module: "valuations-api", method: "POST" });
    }
    return NextResponse.json(
      { error: "Değerleme talebi oluşturulurken bir hata oluştu" },
      { status: 500 },
    );
  }
}
