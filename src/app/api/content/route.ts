import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contentSections } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/content
 * Get all content sections or filter by key
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (key) {
      const [section] = await db
        .select()
        .from(contentSections)
        .where(eq(contentSections.key, key))
        .limit(1);

      if (!section) {
        return NextResponse.json(
          { error: "İçerik bulunamadı" },
          { status: 404 }
        );
      }

      return NextResponse.json({ data: section });
    }

    const sections = await db
      .select()
      .from(contentSections)
      .where(eq(contentSections.isActive, true));

    return NextResponse.json({ data: sections });
  } catch (error) {
    console.error("Content GET error:", error);
    return NextResponse.json(
      { error: "İçerik yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/content
 * Create new content section
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const [newSection] = await db
      .insert(contentSections)
      .values({
        key: body.key,
        type: body.type,
        title: body.title,
        subtitle: body.subtitle,
        content: body.content,
        image: body.image,
        images: body.images,
        data: body.data,
        isActive: body.isActive ?? true,
        sortOrder: body.sortOrder,
      })
      .returning();

    return NextResponse.json(
      { data: newSection, message: "İçerik oluşturuldu" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Content POST error:", error);
    return NextResponse.json(
      { error: "İçerik oluşturulurken bir hata oluştu" },
      { status: 500 }
    );
  }
}
