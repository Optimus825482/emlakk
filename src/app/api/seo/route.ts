import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { seoMetadata, seoSettings } from "@/db/schema/seo";
import { eq, and, desc } from "drizzle-orm";

/**
 * GET /api/seo
 * SEO verilerini getir
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    // Tek kayıt getir
    if (entityType && entityId) {
      const [data] = await db
        .select()
        .from(seoMetadata)
        .where(
          and(
            eq(seoMetadata.entityType, entityType),
            eq(seoMetadata.entityId, entityId)
          )
        )
        .limit(1);

      return NextResponse.json({ data });
    }

    // Tüm kayıtları getir (filtrelenebilir)
    let query = db.select().from(seoMetadata);

    if (entityType) {
      query = query.where(
        eq(seoMetadata.entityType, entityType)
      ) as typeof query;
    }

    const data = await query.orderBy(desc(seoMetadata.updatedAt)).limit(100);

    return NextResponse.json({ data });
  } catch (error) {
    console.error("SEO GET error:", error);
    return NextResponse.json(
      { error: "SEO verileri alınamadı" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/seo
 * SEO verilerini güncelle (manuel düzenleme)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
    }

    const [updated] = await db
      .update(seoMetadata)
      .set({
        ...updateData,
        isAiGenerated: false, // Manuel düzenleme
        updatedAt: new Date(),
      })
      .where(eq(seoMetadata.id, id))
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("SEO PUT error:", error);
    return NextResponse.json({ error: "SEO güncellenemedi" }, { status: 500 });
  }
}
