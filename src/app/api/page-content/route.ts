import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pageContents } from "@/db/schema/page-content";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/page-content?page=iletisim&section=hero
 * Sayfa içeriğini getir
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageSlug = searchParams.get("page");
    const sectionKey = searchParams.get("section");

    if (!pageSlug) {
      return NextResponse.json(
        { error: "page parametresi gerekli" },
        { status: 400 }
      );
    }

    let query;
    if (sectionKey) {
      query = await db
        .select()
        .from(pageContents)
        .where(
          and(
            eq(pageContents.pageSlug, pageSlug),
            eq(pageContents.sectionKey, sectionKey)
          )
        );
    } else {
      query = await db
        .select()
        .from(pageContents)
        .where(eq(pageContents.pageSlug, pageSlug))
        .orderBy(pageContents.sortOrder);
    }

    return NextResponse.json({ data: sectionKey ? query[0] : query });
  } catch (error) {
    console.error("Page content GET error:", error);
    return NextResponse.json({ error: "Veriler alınamadı" }, { status: 500 });
  }
}

/**
 * POST /api/page-content
 * Yeni içerik oluştur
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageSlug, sectionKey, ...data } = body;

    if (!pageSlug || !sectionKey) {
      return NextResponse.json(
        { error: "pageSlug ve sectionKey gerekli" },
        { status: 400 }
      );
    }

    const [content] = await db
      .insert(pageContents)
      .values({
        pageSlug,
        sectionKey,
        ...data,
      })
      .returning();

    return NextResponse.json({ data: content });
  } catch (error) {
    console.error("Page content POST error:", error);
    return NextResponse.json(
      { error: "İçerik oluşturulamadı" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/page-content
 * İçerik güncelle
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, pageSlug, sectionKey, ...data } = body;

    if (id) {
      // ID ile güncelle
      const [updated] = await db
        .update(pageContents)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(pageContents.id, id))
        .returning();

      return NextResponse.json({ data: updated });
    } else if (pageSlug && sectionKey) {
      // pageSlug + sectionKey ile upsert
      const existing = await db
        .select()
        .from(pageContents)
        .where(
          and(
            eq(pageContents.pageSlug, pageSlug),
            eq(pageContents.sectionKey, sectionKey)
          )
        );

      if (existing.length > 0) {
        const [updated] = await db
          .update(pageContents)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(pageContents.id, existing[0].id))
          .returning();

        return NextResponse.json({ data: updated });
      } else {
        const [created] = await db
          .insert(pageContents)
          .values({ pageSlug, sectionKey, ...data })
          .returning();

        return NextResponse.json({ data: created });
      }
    }

    return NextResponse.json(
      { error: "id veya pageSlug+sectionKey gerekli" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Page content PUT error:", error);
    return NextResponse.json(
      { error: "İçerik güncellenemedi" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/page-content?id=xxx
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id gerekli" }, { status: 400 });
    }

    await db.delete(pageContents).where(eq(pageContents.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Page content DELETE error:", error);
    return NextResponse.json({ error: "İçerik silinemedi" }, { status: 500 });
  }
}
