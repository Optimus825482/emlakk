import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { workflowLogs } from "@/db/schema";
import { desc, eq, sql, and } from "drizzle-orm";

/**
 * GET /api/workflows/logs
 * Workflow loglarını listele
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");
    const workflowName = searchParams.get("workflow");

    // Filtreler
    const conditions = [];
    if (status) {
      conditions.push(
        eq(
          workflowLogs.status,
          status as "pending" | "running" | "completed" | "failed"
        )
      );
    }
    if (workflowName) {
      conditions.push(eq(workflowLogs.workflowName, workflowName));
    }

    const logs = await db
      .select()
      .from(workflowLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(workflowLogs.startedAt))
      .limit(limit);

    // İstatistikler
    const stats = await db
      .select({
        total: sql<number>`count(*)`,
        completed: sql<number>`count(*) filter (where status = 'completed')`,
        failed: sql<number>`count(*) filter (where status = 'failed')`,
        running: sql<number>`count(*) filter (where status = 'running')`,
        pending: sql<number>`count(*) filter (where status = 'pending')`,
      })
      .from(workflowLogs);

    return NextResponse.json({
      data: logs,
      stats: stats[0],
    });
  } catch (error) {
    console.error("Workflow logs GET error:", error);
    return NextResponse.json(
      { error: "Workflow logları yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
