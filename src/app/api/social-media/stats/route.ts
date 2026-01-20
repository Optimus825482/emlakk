import { NextResponse } from "next/server";
import { db } from "@/db";
import { contentCalendar } from "@/db/schema/content-calendar";
import { eq, sql, desc, and, gte } from "drizzle-orm";

/**
 * GET /api/social-media/stats
 * Sosyal medya istatistiklerini ve son aktiviteleri getirir
 */
export async function GET() {
  try {
    // İstatistikleri hesapla
    const statsResult = await db
      .select({
        status: contentCalendar.status,
        count: sql<number>`count(*)::int`,
      })
      .from(contentCalendar)
      .groupBy(contentCalendar.status);

    // Status'lara göre sayıları ayır
    const stats = {
      totalGenerated: 0,
      pendingApproval: 0,
      published: 0,
      scheduled: 0,
      failed: 0,
    };

    statsResult.forEach((row) => {
      stats.totalGenerated += row.count;
      switch (row.status) {
        case "draft":
          stats.pendingApproval = row.count;
          break;
        case "published":
          stats.published = row.count;
          break;
        case "scheduled":
          stats.scheduled = row.count;
          break;
        case "failed":
          stats.failed = row.count;
          break;
      }
    });

    // Platform bazlı istatistikler
    const platformStats = await db
      .select({
        platform: contentCalendar.platform,
        count: sql<number>`count(*)::int`,
        publishedCount: sql<number>`count(*) filter (where status = 'published')::int`,
      })
      .from(contentCalendar)
      .groupBy(contentCalendar.platform);

    // Son 7 günlük aktiviteler
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivities = await db
      .select({
        id: contentCalendar.id,
        title: contentCalendar.title,
        platform: contentCalendar.platform,
        status: contentCalendar.status,
        createdAt: contentCalendar.createdAt,
        publishedAt: contentCalendar.publishedAt,
        scheduledAt: contentCalendar.scheduledAt,
      })
      .from(contentCalendar)
      .where(gte(contentCalendar.createdAt, sevenDaysAgo))
      .orderBy(desc(contentCalendar.createdAt))
      .limit(10);

    // Aktiviteleri formatla
    const activities = recentActivities.map((item) => {
      let action = "İçerik oluşturuldu";
      let icon = "auto_awesome";

      if (item.status === "published" && item.publishedAt) {
        action = `${item.platform}'da paylaşıldı`;
        icon = "check_circle";
      } else if (item.status === "scheduled" && item.scheduledAt) {
        action = "İçerik planlandı";
        icon = "schedule";
      } else if (item.status === "failed") {
        action = "Paylaşım başarısız";
        icon = "error";
      }

      const timeAgo = getTimeAgo(item.createdAt);

      return {
        id: item.id,
        action,
        target: item.title,
        time: timeAgo,
        icon,
        platform: item.platform,
        status: item.status,
      };
    });

    return NextResponse.json({
      success: true,
      stats,
      platformStats,
      activities,
    });
  } catch (error) {
    console.error("Social media stats error:", error);
    return NextResponse.json(
      { success: false, error: "İstatistikler alınamadı" },
      { status: 500 }
    );
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins} dakika önce`;
  } else if (diffHours < 24) {
    return `${diffHours} saat önce`;
  } else if (diffDays === 1) {
    return "1 gün önce";
  } else {
    return `${diffDays} gün önce`;
  }
}
