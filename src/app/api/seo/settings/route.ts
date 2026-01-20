import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { seoSettings } from "@/db/schema/seo";
import { eq } from "drizzle-orm";

/**
 * GET /api/seo/settings
 * SEO ayarlarını getir
 */
export async function GET() {
  try {
    const [settings] = await db.select().from(seoSettings).limit(1);

    // Varsayılan ayarlar
    const defaultSettings = {
      siteName: "Demir Gayrimenkul",
      siteDescription: "Hendek ve Sakarya bölgesinin güvenilir emlak danışmanı",
      defaultOgImage: "",
      twitterHandle: "",
      googleSiteVerification: "",
      googleAnalyticsId: "",
      autoGenerateSeo: true,
      seoLanguage: "tr",
      targetRegion: "Hendek, Sakarya",
      industryKeywords: [
        "emlak",
        "gayrimenkul",
        "satılık",
        "kiralık",
        "arsa",
        "daire",
      ],
      sitemapEnabled: true,
    };

    return NextResponse.json({ data: settings || defaultSettings });
  } catch (error) {
    console.error("SEO settings GET error:", error);
    return NextResponse.json(
      { error: "SEO ayarları alınamadı" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/seo/settings
 * SEO ayarlarını güncelle
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Mevcut ayarları kontrol et
    const [existing] = await db.select().from(seoSettings).limit(1);

    let result;

    if (existing) {
      // Güncelle
      [result] = await db
        .update(seoSettings)
        .set({
          ...body,
          updatedAt: new Date(),
        })
        .where(eq(seoSettings.id, existing.id))
        .returning();
    } else {
      // Yeni oluştur
      [result] = await db.insert(seoSettings).values(body).returning();
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("SEO settings PUT error:", error);
    return NextResponse.json(
      { error: "SEO ayarları kaydedilemedi" },
      { status: 500 }
    );
  }
}
