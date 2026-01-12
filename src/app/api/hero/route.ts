import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contentSections } from "@/db/schema";
import { eq } from "drizzle-orm";

const HERO_KEY = "hero_main";

// Hero varsayılan değerleri
const defaultHeroData = {
  badge: "Hendek'in Premium Gayrimenkulü",
  title: "Demir Gayrimenkul:",
  titleHighlight: "Akıllı",
  titleAccent: "Yatırım",
  titleEnd: "Demir Güven.",
  description:
    "Yılların getirdiği yerel esnaf samimiyetini, küresel dünyanın veri bilimiyle harmanlıyoruz.",
  ctaPrimary: "Hendek'i Keşfedin",
  ctaSecondary: "Mülk Değerleme Platformu",
  founderName: "Mustafa Demir",
  founderTitle: "Gayrimenkul Danışmanı",
  founderQuote: "Bence değil, Verilere göre yatırım...",
  founderImage: "",
  feature1Icon: "speed",
  feature1Title: "Hızlı Satış Analizi",
  feature1Desc: "Saniyeler içinde AI destekli değerleme.",
  feature2Icon: "school",
  feature2Title: "Hendek Yatırım Rehberi",
  feature2Desc: "Uzman eğitimsel içgörüler.",
  feature3Icon: "location_city",
  feature3Title: "Yaşam Alanı Keşfet",
  feature3Desc: "Hayalinizdeki yaşam alanını bulun.",
};

// GET - Hero verilerini getir
export async function GET() {
  try {
    const [content] = await db
      .select()
      .from(contentSections)
      .where(eq(contentSections.key, HERO_KEY))
      .limit(1);

    if (!content) {
      // Kayıt yoksa varsayılan değerleri döndür
      return NextResponse.json(defaultHeroData);
    }

    // data alanından hero verilerini çıkar
    const heroData = (content.data as Record<string, unknown>) || {};

    return NextResponse.json({
      id: content.id,
      ...defaultHeroData,
      ...heroData,
    });
  } catch (error) {
    console.error("Hero GET error:", error);
    return NextResponse.json(
      { error: "Hero verileri alınamadı" },
      { status: 500 }
    );
  }
}

// PUT - Hero verilerini güncelle
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Mevcut kaydı kontrol et
    const [existing] = await db
      .select()
      .from(contentSections)
      .where(eq(contentSections.key, HERO_KEY))
      .limit(1);

    if (existing) {
      // Güncelle
      const [updated] = await db
        .update(contentSections)
        .set({
          data: body,
          image: body.founderImage || null,
          updatedAt: new Date(),
        })
        .where(eq(contentSections.key, HERO_KEY))
        .returning();

      return NextResponse.json({
        id: updated.id,
        ...body,
      });
    } else {
      // Yeni kayıt oluştur
      const [created] = await db
        .insert(contentSections)
        .values({
          key: HERO_KEY,
          type: "hero",
          title: "Ana Sayfa Hero",
          data: body,
          image: body.founderImage || null,
          isActive: true,
        })
        .returning();

      return NextResponse.json({
        id: created.id,
        ...body,
      });
    }
  } catch (error) {
    console.error("Hero PUT error:", error);
    return NextResponse.json(
      { error: "Hero verileri kaydedilemedi" },
      { status: 500 }
    );
  }
}
