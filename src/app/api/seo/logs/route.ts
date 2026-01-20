import { NextResponse } from "next/server";
import { db } from "@/db";
import { seoLogs } from "@/db/schema/seo";
import { desc } from "drizzle-orm";

/**
 * GET /api/seo/logs
 * SEO işlem geçmişini getir
 */
export async function GET() {
  try {
    const data = await db
      .select()
      .from(seoLogs)
      .orderBy(desc(seoLogs.createdAt))
      .limit(100);

    return NextResponse.json({ data });
  } catch (error) {
    console.error("SEO logs error:", error);
    return NextResponse.json(
      { error: "SEO logları alınamadı" },
      { status: 500 }
    );
  }
}
