import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { valuations } from "@/db/schema";
import { eq } from "drizzle-orm";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/valuations/[id]
 * Get a single valuation
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const [valuation] = await db
      .select()
      .from(valuations)
      .where(eq(valuations.id, id))
      .limit(1);

    if (!valuation) {
      return NextResponse.json(
        { error: "Değerleme bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: valuation });
  } catch (error) {
    console.error("Valuation GET error:", error);
    return NextResponse.json(
      { error: "Değerleme yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/valuations/[id]
 * Update valuation with AI results
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Build update object - valuations schema doesn't have status field
    const updateData: Record<string, unknown> = {};

    if (body.estimatedValue) updateData.estimatedValue = body.estimatedValue;
    if (body.minValue) updateData.minValue = body.minValue;
    if (body.maxValue) updateData.maxValue = body.maxValue;
    if (body.pricePerSqm) updateData.pricePerSqm = body.pricePerSqm;
    if (body.confidenceScore) updateData.confidenceScore = body.confidenceScore;
    if (body.marketAnalysis) updateData.marketAnalysis = body.marketAnalysis;
    if (body.comparables) updateData.comparables = body.comparables;
    if (body.trends) updateData.trends = body.trends;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Güncellenecek veri bulunamadı" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(valuations)
      .set(updateData)
      .where(eq(valuations.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Değerleme bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: updated,
      message: "Değerleme güncellendi",
    });
  } catch (error) {
    console.error("Valuation PATCH error:", error);
    return NextResponse.json(
      { error: "Değerleme güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/valuations/[id]
 * Delete a valuation
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const [deleted] = await db
      .delete(valuations)
      .where(eq(valuations.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Değerleme bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Değerleme silindi",
    });
  } catch (error) {
    console.error("Valuation DELETE error:", error);
    return NextResponse.json(
      { error: "Değerleme silinirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
