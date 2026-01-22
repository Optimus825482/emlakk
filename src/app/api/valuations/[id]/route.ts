import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { valuations } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    await db.delete(valuations).where(eq(valuations.id, id));

    return NextResponse.json({
      success: true,
      message: "Değerleme silindi",
    });
  } catch (error) {
    console.error("Valuation delete error:", error);
    return NextResponse.json(
      { success: false, error: "Değerleme silinirken bir hata oluştu" },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const [valuation] = await db
      .select()
      .from(valuations)
      .where(eq(valuations.id, id))
      .limit(1);

    if (!valuation) {
      return NextResponse.json(
        { success: false, error: "Değerleme bulunamadı" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: valuation,
    });
  } catch (error) {
    console.error("Valuation fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Değerleme yüklenirken bir hata oluştu" },
      { status: 500 },
    );
  }
}
