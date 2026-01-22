import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pageSeo, DEFAULT_PAGES } from "@/db/schema/page-seo";
import { eq } from "drizzle-orm";

// GET - Tüm sayfa SEO verilerini getir
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.get("path");

    if (path) {
      // Belirli bir sayfa için SEO verisi
      const seoData = await db
        .select()
        .from(pageSeo)
        .where(eq(pageSeo.pagePath, path))
        .limit(1);

      return NextResponse.json({
        success: true,
        data: seoData[0] || null,
      });
    }

    // Tüm sayfa SEO verileri
    const allSeoData = await db.select().from(pageSeo);

    return NextResponse.json({
      success: true,
      data: allSeoData,
      defaultPages: DEFAULT_PAGES,
    });
  } catch (error) {
    console.error("Page SEO fetch error:", error);
    return NextResponse.json(
      { success: false, error: "SEO verileri alınamadı" },
      { status: 500 },
    );
  }
}

// POST - Yeni sayfa SEO verisi oluştur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pagePath, pageTitle, ...seoData } = body;

    const newSeo = await db
      .insert(pageSeo)
      .values({
        pagePath,
        pageTitle,
        ...seoData,
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newSeo[0],
    });
  } catch (error) {
    console.error("Page SEO create error:", error);
    return NextResponse.json(
      { success: false, error: "SEO verisi oluşturulamadı" },
      { status: 500 },
    );
  }
}

// PUT - Sayfa SEO verisini güncelle
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    const updated = await db
      .update(pageSeo)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(pageSeo.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updated[0],
    });
  } catch (error) {
    console.error("Page SEO update error:", error);
    return NextResponse.json(
      { success: false, error: "SEO verisi güncellenemedi" },
      { status: 500 },
    );
  }
}

// DELETE - Sayfa SEO verisini sil
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID gerekli" },
        { status: 400 },
      );
    }

    await db.delete(pageSeo).where(eq(pageSeo.id, id));

    return NextResponse.json({
      success: true,
      message: "SEO verisi silindi",
    });
  } catch (error) {
    console.error("Page SEO delete error:", error);
    return NextResponse.json(
      { success: false, error: "SEO verisi silinemedi" },
      { status: 500 },
    );
  }
}
