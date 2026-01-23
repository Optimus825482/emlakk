import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { desc, eq, sql, and } from "drizzle-orm";

// Cache configuration: 60 saniye cache (notifications sık değişmez)
export const revalidate = 60;
export const dynamic = "force-dynamic";

/**
 * GET /api/notifications
 * Bildirimleri listele
 * Performance: Optimized with caching and parallel queries
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const unreadOnly = searchParams.get("unread") === "true";

    const conditions = [];
    if (unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }

    // Parallel queries for better performance
    const [results, unreadCount] = await Promise.all([
      db
        .select()
        .from(notifications)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(notifications.createdAt))
        .limit(limit),
      db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(eq(notifications.isRead, false)),
    ]);

    return NextResponse.json({
      data: results,
      unreadCount: Number(unreadCount[0]?.count || 0),
    });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json(
      { error: "Bildirimler yüklenirken bir hata oluştu" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/notifications
 * Yeni bildirim oluştur (internal use)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { type, title, message, entityType, entityId } = body;

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: "type, title ve message zorunludur" },
        { status: 400 },
      );
    }

    const [newNotification] = await db
      .insert(notifications)
      .values({
        type,
        title,
        message,
        entityType,
        entityId,
      })
      .returning();

    return NextResponse.json({ data: newNotification }, { status: 201 });
  } catch (error) {
    console.error("Notifications POST error:", error);
    return NextResponse.json(
      { error: "Bildirim oluşturulurken bir hata oluştu" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/notifications
 * Tüm bildirimleri okundu olarak işaretle
 */
export async function PATCH() {
  try {
    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.isRead, false));

    return NextResponse.json({
      message: "Tüm bildirimler okundu olarak işaretlendi",
    });
  } catch (error) {
    console.error("Notifications PATCH error:", error);
    return NextResponse.json(
      { error: "Bildirimler güncellenirken bir hata oluştu" },
      { status: 500 },
    );
  }
}
