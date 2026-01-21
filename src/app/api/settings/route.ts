import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { withAdmin } from "@/lib/api-auth";

export async function GET() {
  try {
    let [settings] = await db.select().from(siteSettings).limit(1);

    // Eğer ayar yoksa varsayılan oluştur
    if (!settings) {
      [settings] = await db
        .insert(siteSettings)
        .values({
          siteName: "Demir Gayrimenkul",
          siteTagline: "Hendek'in Sağlam Kararı",
          phone: "+90 264 123 45 67",
          email: "info@demirgayrimenkul.com",
          whatsapp: "+90 532 123 45 67",
          address: "Kemaliye Mah. Cumhuriyet Meydanı No:12, Hendek / Sakarya",
          socialMedia: {
            instagram: "https://instagram.com/demirgayrimenkul",
            linkedin: "https://linkedin.com/company/demirgayrimenkul",
          },
          workingHours: {
            weekdays: "09:00 - 18:00",
            saturday: "10:00 - 14:00",
            sunday: "Kapalı",
          },
          footerText: "Geleneksel dürüstlük, modern teknoloji ile buluşuyor.",
          copyrightText: "© 2026 Demir Gayrimenkul. Tüm hakları saklıdır.",
        })
        .returning();
    }

    return NextResponse.json({ data: settings });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json(
      { error: "Ayarlar yüklenirken bir hata oluştu" },
      { status: 500 },
    );
  }
}

export const PATCH = withAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json();
    console.log("PATCH /api/settings - Gelen veri:", body);

    const [existing] = await db.select().from(siteSettings).limit(1);

    if (!existing) {
      console.error("PATCH /api/settings - Ayarlar bulunamadı");
      return NextResponse.json(
        { error: "Ayarlar bulunamadı" },
        { status: 404 },
      );
    }

    console.log("PATCH /api/settings - Mevcut ayarlar:", existing);

    const [updated] = await db
      .update(siteSettings)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(siteSettings.id, existing.id))
      .returning();

    console.log("PATCH /api/settings - Güncellendi:", updated);

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Ayarlar güncellendi",
    });
  } catch (error) {
    console.error("Settings PATCH error:", error);
    return NextResponse.json(
      { error: "Ayarlar güncellenirken bir hata oluştu" },
      { status: 500 },
    );
  }
});

// PUT metodu da ekle (PATCH ile aynı işi yapar, eski kod uyumluluğu için)
export const PUT = PATCH;
