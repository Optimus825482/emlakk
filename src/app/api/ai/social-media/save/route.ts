import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

interface SaveRequest {
  type: "general" | "listing";
  category?: string;
  platform: string;
  content: string;
  hashtags: string[];
  imagePrompt?: string;
  listingId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SaveRequest = await request.json();
    const {
      type,
      category,
      platform,
      content,
      hashtags,
      imagePrompt,
      listingId,
    } = body;

    if (!content || !platform) {
      return NextResponse.json(
        { error: "İçerik ve platform zorunlu" },
        { status: 400 }
      );
    }

    // Basit bir kayıt - ileride social_media_contents tablosu oluşturulabilir
    // Şimdilik sadece başarılı yanıt dönüyoruz
    console.log("Social media content saved:", {
      type,
      category,
      platform,
      contentLength: content.length,
      hashtagCount: hashtags.length,
      hasImagePrompt: !!imagePrompt,
      listingId,
      savedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "İçerik kaydedildi",
      data: {
        type,
        category,
        platform,
        content,
        hashtags,
        imagePrompt,
        listingId,
      },
    });
  } catch (error) {
    console.error("Social media save error:", error);
    return NextResponse.json(
      { error: "İçerik kaydedilirken hata oluştu" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // İleride kaydedilen içerikleri listelemek için
  return NextResponse.json({
    contents: [],
    message: "Henüz kaydedilmiş içerik yok",
  });
}
