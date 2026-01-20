import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { seoMetadata, seoLogs } from "@/db/schema/seo";
import { generateSeoMetadata, calculateSeoScore } from "@/lib/seo-agent";
import { eq, and } from "drizzle-orm";
import { withAdmin } from "@/lib/api-auth";

export const POST = withAdmin(async (request: NextRequest) => {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const {
      entityType,
      entityId,
      title,
      content,
      images,
      category,
      location,
      price,
      features,
    } = body;

    if (!entityType || !entityId || !title) {
      return NextResponse.json(
        { error: "entityType, entityId ve title zorunlu" },
        { status: 400 }
      );
    }

    const [logEntry] = await db
      .insert(seoLogs)
      .values({
        entityType,
        entityId,
        action: "generate",
        status: "pending",
        input: { title, contentLength: content?.length || 0 },
      })
      .returning();

    const seoData = await generateSeoMetadata({
      entityType,
      entityId,
      title,
      content: content || title,
      images,
      category,
      location,
      price,
      features,
    });

    const seoScore = calculateSeoScore(seoData);

    const [existing] = await db
      .select()
      .from(seoMetadata)
      .where(
        and(
          eq(seoMetadata.entityType, entityType),
          eq(seoMetadata.entityId, entityId)
        )
      )
      .limit(1);

    let result;

    if (existing) {
      [result] = await db
        .update(seoMetadata)
        .set({
          entityTitle: title,
          metaTitle: seoData.metaTitle,
          metaDescription: seoData.metaDescription,
          keywords: seoData.keywords,
          focusKeyword: seoData.focusKeyword,
          ogTitle: seoData.ogTitle,
          ogDescription: seoData.ogDescription,
          twitterTitle: seoData.twitterTitle,
          twitterDescription: seoData.twitterDescription,
          structuredData: seoData.structuredData,
          seoScore,
          seoAnalysis: seoData.seoAnalysis,
          isAiGenerated: true,
          aiModel: "deepseek-reasoner",
          lastAiUpdate: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(seoMetadata.id, existing.id))
        .returning();
    } else {
      [result] = await db
        .insert(seoMetadata)
        .values({
          entityType,
          entityId,
          entityTitle: title,
          metaTitle: seoData.metaTitle,
          metaDescription: seoData.metaDescription,
          keywords: seoData.keywords,
          focusKeyword: seoData.focusKeyword,
          ogTitle: seoData.ogTitle,
          ogDescription: seoData.ogDescription,
          twitterTitle: seoData.twitterTitle,
          twitterDescription: seoData.twitterDescription,
          structuredData: seoData.structuredData,
          seoScore,
          seoAnalysis: seoData.seoAnalysis,
          isAiGenerated: true,
          aiModel: "deepseek-reasoner",
          lastAiUpdate: new Date(),
        })
        .returning();
    }

    const processingTime = Date.now() - startTime;
    await db
      .update(seoLogs)
      .set({
        status: "success",
        output: { seoScore, metaTitle: seoData.metaTitle },
        processingTime,
        aiModel: "deepseek-reasoner",
      })
      .where(eq(seoLogs.id, logEntry.id));

    return NextResponse.json({
      success: true,
      data: result,
      seoScore,
      processingTime,
    });
  } catch (error) {
    console.error("SEO generate error:", error);
    return NextResponse.json(
      { error: "SEO olusturulurken hata olustu" },
      { status: 500 }
    );
  }
});
