import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  founderProfile,
  visionPillars,
  companyPrinciples,
  manifesto,
} from "@/db/schema";
import { eq, asc } from "drizzle-orm";

// GET - Tüm hakkımızda verilerini getir
export async function GET() {
  try {
    const [founder] = await db.select().from(founderProfile).limit(1);

    const pillars = await db
      .select()
      .from(visionPillars)
      .where(eq(visionPillars.isActive, true))
      .orderBy(asc(visionPillars.sortOrder));

    const principles = await db
      .select()
      .from(companyPrinciples)
      .where(eq(companyPrinciples.isActive, true))
      .orderBy(asc(companyPrinciples.sortOrder));

    const [manifestoData] = await db
      .select()
      .from(manifesto)
      .where(eq(manifesto.isActive, true))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: {
        founder: founder || null,
        pillars,
        principles,
        manifesto: manifestoData || null,
      },
    });
  } catch (error) {
    console.error("About page fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Veriler yüklenirken hata oluştu" },
      { status: 500 },
    );
  }
}

// PUT - Kurucu bilgilerini güncelle
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { founder: founderData } = body;

    if (!founderData) {
      return NextResponse.json(
        { error: "Kurucu bilgileri gerekli" },
        { status: 400 },
      );
    }

    // id'yi ayır, geri kalanını al
    const {
      id: _id,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...updateData
    } = founderData;

    // Mevcut kaydı kontrol et
    const [existing] = await db.select().from(founderProfile).limit(1);

    if (existing) {
      // Güncelle
      await db
        .update(founderProfile)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(founderProfile.id, existing.id));
    } else {
      // Yeni kayıt oluştur
      await db.insert(founderProfile).values({
        name: updateData.name || "Mustafa Demir",
        title: updateData.title || "Kurucu & Genel Müdür",
        image: updateData.image,
        badgeText: updateData.badgeText,
        heroTitle: updateData.heroTitle,
        heroTitleHighlight: updateData.heroTitleHighlight,
        narrativeTitle: updateData.narrativeTitle,
        narrativeParagraph1: updateData.narrativeParagraph1,
        narrativeParagraph2: updateData.narrativeParagraph2,
        narrativeDividerText: updateData.narrativeDividerText,
      });
    }

    return NextResponse.json({
      success: true,
      data: { message: "Güncellendi" },
    });
  } catch (error) {
    console.error("Founder update error:", error);
    return NextResponse.json(
      { error: "Güncelleme sırasında hata oluştu" },
      { status: 500 },
    );
  }
}
