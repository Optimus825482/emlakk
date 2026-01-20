import { NextResponse } from "next/server";
import { db } from "@/db";
import { agentTasks, marketAlerts } from "@/db/schema/content-calendar";
import { eq, desc, and, sql } from "drizzle-orm";

/**
 * GET /api/market-analysis/history
 * Geçmiş pazar analizlerini ve market alert'lerini getirir
 */
export async function GET() {
  try {
    // Geçmiş pazar analizi görevlerini getir
    const analysisHistory = await db
      .select({
        id: agentTasks.id,
        taskType: agentTasks.taskType,
        status: agentTasks.status,
        input: agentTasks.input,
        output: agentTasks.output,
        startedAt: agentTasks.startedAt,
        completedAt: agentTasks.completedAt,
        createdAt: agentTasks.createdAt,
      })
      .from(agentTasks)
      .where(
        and(
          eq(agentTasks.agentType, "miner_agent"),
          eq(agentTasks.taskType, "market_research")
        )
      )
      .orderBy(desc(agentTasks.createdAt))
      .limit(20);

    // Market alert'lerini getir
    const alerts = await db
      .select({
        id: marketAlerts.id,
        alertType: marketAlerts.alertType,
        title: marketAlerts.title,
        description: marketAlerts.description,
        severity: marketAlerts.severity,
        isRead: marketAlerts.isRead,
        metadata: marketAlerts.metadata,
        createdAt: marketAlerts.createdAt,
      })
      .from(marketAlerts)
      .orderBy(desc(marketAlerts.createdAt))
      .limit(50);

    // Alert istatistikleri
    const alertStats = await db
      .select({
        alertType: marketAlerts.alertType,
        count: sql<number>`count(*)::int`,
        unreadCount: sql<number>`count(*) filter (where is_read = false)::int`,
      })
      .from(marketAlerts)
      .groupBy(marketAlerts.alertType);

    // Formatla
    const formattedHistory = analysisHistory.map((task) => {
      const input = task.input as {
        region?: string;
        propertyType?: string;
      } | null;
      const output = task.output as {
        summary?: string;
        source?: string;
      } | null;

      return {
        id: task.id,
        region: input?.region || "Bilinmiyor",
        propertyType: input?.propertyType || "Bilinmiyor",
        status: task.status,
        summary: output?.summary || null,
        source: output?.source || "unknown",
        completedAt: task.completedAt,
        createdAt: task.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      history: formattedHistory,
      alerts,
      alertStats,
    });
  } catch (error) {
    console.error("Market analysis history error:", error);
    return NextResponse.json(
      { success: false, error: "Geçmiş analizler alınamadı" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/market-analysis/history
 * Yeni pazar analizi kaydeder
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { region, propertyType, analysis, source } = body;

    // Yeni task oluştur
    const [task] = await db
      .insert(agentTasks)
      .values({
        agentType: "miner_agent",
        taskType: "market_research",
        status: "completed",
        input: { region, propertyType },
        output: { ...analysis, source },
        startedAt: new Date(),
        completedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Save market analysis error:", error);
    return NextResponse.json(
      { success: false, error: "Analiz kaydedilemedi" },
      { status: 500 }
    );
  }
}
