import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { workflowLogs } from "@/db/schema";
import { appointmentReminderWorkflow } from "@/workflows/appointment-reminder";
import { aiValuationWorkflow } from "@/workflows/ai-valuation";
import { listingDescriptionWorkflow } from "@/workflows/listing-description";
import { eq } from "drizzle-orm";

type WorkflowType =
  | "appointment-reminder"
  | "ai-valuation"
  | "listing-description";

/**
 * POST /api/workflows/trigger
 * Workflow'ları tetiklemek için API endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const { workflow, params } = await request.json();

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow tipi belirtilmedi" },
        { status: 400 }
      );
    }

    // Log kaydı oluştur
    const [log] = await db
      .insert(workflowLogs)
      .values({
        workflowName: workflow,
        status: "running",
        entityType: getEntityType(workflow),
        entityId:
          params?.appointmentId || params?.valuationId || params?.listingId,
      })
      .returning();

    let result;

    try {
      switch (workflow as WorkflowType) {
        case "appointment-reminder":
          if (!params?.appointmentId) {
            throw new Error("appointmentId gerekli");
          }
          result = await appointmentReminderWorkflow(params.appointmentId);
          break;

        case "ai-valuation":
          if (!params?.valuationId) {
            throw new Error("valuationId gerekli");
          }
          result = await aiValuationWorkflow(params.valuationId);
          break;

        case "listing-description":
          if (!params?.listingId) {
            throw new Error("listingId gerekli");
          }
          result = await listingDescriptionWorkflow(params.listingId);
          break;

        default:
          throw new Error(`Bilinmeyen workflow: ${workflow}`);
      }

      // Başarılı - log güncelle
      await db
        .update(workflowLogs)
        .set({
          status: "completed",
          result: result as Record<string, unknown>,
          completedAt: new Date(),
        })
        .where(eq(workflowLogs.id, log.id));

      return NextResponse.json({
        success: true,
        workflow,
        logId: log.id,
        result,
      });
    } catch (workflowError) {
      // Hata - log güncelle
      await db
        .update(workflowLogs)
        .set({
          status: "failed",
          error: String(workflowError),
          completedAt: new Date(),
        })
        .where(eq(workflowLogs.id, log.id));

      throw workflowError;
    }
  } catch (error) {
    console.error("Workflow trigger error:", error);
    return NextResponse.json(
      {
        error: "Workflow tetiklenirken bir hata oluştu",
        details: String(error),
      },
      { status: 500 }
    );
  }
}

function getEntityType(workflow: string): string {
  switch (workflow) {
    case "appointment-reminder":
      return "appointment";
    case "ai-valuation":
      return "valuation";
    case "listing-description":
      return "listing";
    default:
      return "unknown";
  }
}
