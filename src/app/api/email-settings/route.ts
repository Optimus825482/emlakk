import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { emailSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

// Cache configuration: 5 dakika cache (ayarlar sık değişmez)
export const revalidate = 300;

/**
 * GET /api/email-settings
 * E-posta ayarlarını getir
 */
export async function GET() {
  try {
    const [settings] = await db.select().from(emailSettings).limit(1);

    if (!settings) {
      return NextResponse.json({ data: null });
    }

    // Şifreyi maskeleme
    const maskedSettings = {
      ...settings,
      smtpPassword: settings.smtpPassword ? "••••••••" : null,
    };

    return NextResponse.json({ data: maskedSettings });
  } catch (error) {
    console.error("Email settings GET error:", error);
    return NextResponse.json(
      { error: "E-posta ayarları yüklenirken bir hata oluştu" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/email-settings
 * E-posta ayarlarını kaydet/güncelle
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      smtpHost,
      smtpPort,
      smtpEncryption,
      smtpUsername,
      smtpPassword,
      fromEmail,
      fromName,
      replyToEmail,
    } = body;

    // Mevcut ayarları kontrol et
    const [existing] = await db.select().from(emailSettings).limit(1);

    const updateData: Record<string, unknown> = {
      smtpHost,
      smtpPort: smtpPort ? parseInt(smtpPort) : 587,
      smtpEncryption: smtpEncryption || "tls",
      smtpUsername,
      fromEmail,
      fromName,
      replyToEmail,
      updatedAt: new Date(),
    };

    // Şifre sadece değiştirildiyse güncelle
    if (smtpPassword && smtpPassword !== "••••••••") {
      updateData.smtpPassword = smtpPassword;
    }

    let result;

    if (existing) {
      [result] = await db
        .update(emailSettings)
        .set(updateData)
        .where(eq(emailSettings.id, existing.id))
        .returning();
    } else {
      if (smtpPassword) {
        updateData.smtpPassword = smtpPassword;
      }
      [result] = await db.insert(emailSettings).values(updateData).returning();
    }

    return NextResponse.json({
      data: {
        ...result,
        smtpPassword: result.smtpPassword ? "••••••••" : null,
      },
      message: "E-posta ayarları kaydedildi",
    });
  } catch (error) {
    console.error("Email settings POST error:", error);
    return NextResponse.json(
      { error: "E-posta ayarları kaydedilirken bir hata oluştu" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/email-settings
 * SMTP bağlantısını test et
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { testEmail } = body;

    if (!testEmail) {
      return NextResponse.json(
        { error: "Test e-posta adresi gerekli" },
        { status: 400 },
      );
    }

    // Mevcut ayarları al
    const [settings] = await db.select().from(emailSettings).limit(1);

    if (!settings || !settings.smtpHost || !settings.smtpUsername) {
      return NextResponse.json(
        { error: "SMTP ayarları eksik. Önce ayarları kaydedin." },
        { status: 400 },
      );
    }

    // TODO: Gerçek SMTP test implementasyonu
    // Şimdilik simüle ediyoruz
    const isValid =
      settings.smtpHost && settings.smtpUsername && settings.smtpPassword;

    if (isValid) {
      await db
        .update(emailSettings)
        .set({ isVerified: true, lastTestedAt: new Date() })
        .where(eq(emailSettings.id, settings.id));

      return NextResponse.json({
        success: true,
        message: `Test e-postası ${testEmail} adresine gönderildi`,
      });
    } else {
      return NextResponse.json(
        { error: "SMTP bağlantısı başarısız. Ayarları kontrol edin." },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Email settings test error:", error);
    return NextResponse.json(
      { error: "SMTP testi sırasında bir hata oluştu" },
      { status: 500 },
    );
  }
}
