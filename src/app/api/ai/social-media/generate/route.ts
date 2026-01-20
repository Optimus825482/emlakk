import { NextRequest, NextResponse } from "next/server";
import { getOrchestrator } from "@/lib/ai/orchestrator";

interface GenerateRequest {
  type: "general" | "listing";
  category?: string;
  customPrompt?: string;
  platforms: string[];
  tone: "professional" | "friendly" | "casual";
  companyInfo: {
    name: string;
    location: string;
    slogan: string;
    phone: string;
    website: string;
  };
  listing?: {
    title: string;
    price: number;
    location: string;
    features: string[];
    description?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const {
      type,
      category,
      customPrompt,
      platforms,
      tone,
      companyInfo,
      listing,
    } = body;

    if (!platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: "En az bir platform seçilmeli" },
        { status: 400 },
      );
    }

    const orchestrator = getOrchestrator();

    // Eğer ilan bazlı ise özel metod, genel ise genel metod çağrılır
    let contents = [];

    if (type === "listing" && listing) {
      for (const platform of platforms) {
        const result = await orchestrator.generateContent({
          listingTitle: listing.title,
          listingDescription: listing.description || "",
          price: listing.price,
          location: listing.location,
          propertyType: "gayrimenkul",
          platform: platform as any,
          features: listing.features,
        });
        contents.push({ platform, ...result });
      }
    } else {
      contents = await orchestrator.generateGeneralContent({
        type,
        category,
        customPrompt,
        platforms,
        tone,
        companyInfo,
      });
    }

    return NextResponse.json({ contents });
  } catch (error) {
    console.error("Social media generate error:", error);
    return NextResponse.json(
      { error: "İçerik üretilirken hata oluştu" },
      { status: 500 },
    );
  }
}

function generateFallbackContent(
  platform: string,
  type: string,
  category: string | undefined,
  companyInfo: GenerateRequest["companyInfo"],
  listing?: GenerateRequest["listing"],
) {
  if (type === "listing" && listing) {
    return {
      platform,
      content: `🏠 ${listing.title}\n\n📍 ${
        listing.location
      }\n💰 ${listing.price.toLocaleString("tr-TR")} TL\n\n✨ ${listing.features
        .slice(0, 3)
        .join(" • ")}\n\n📞 Detaylı bilgi için: ${companyInfo.phone}\n\n${
        companyInfo.name
      } - ${companyInfo.slogan}`,
      hashtags: [
        "gayrimenkul",
        "satılık",
        "emlak",
        companyInfo.location.toLowerCase().replace(/\s/g, ""),
      ],
      imagePrompt: "Profesyonel emlak fotoğrafı, modern ve aydınlık",
    };
  }

  const templates: Record<string, { content: string; hashtags: string[] }> = {
    firma_tanitim: {
      content: `🏢 ${companyInfo.name}\n\n${companyInfo.location}'da güvenilir gayrimenkul danışmanlığı.\n\n✅ Profesyonel hizmet\n✅ Şeffaf süreç\n✅ Müşteri memnuniyeti\n\n📞 ${companyInfo.phone}\n🌐 ${companyInfo.website}`,
      hashtags: [
        "gayrimenkul",
        "emlak",
        "güvenilir",
        companyInfo.location.toLowerCase(),
      ],
    },
    sektor_haberi: {
      content: `📊 Gayrimenkul Piyasası Güncel\n\nSektördeki son gelişmeleri takip edin!\n\n${companyInfo.name} olarak sizleri bilgilendirmeye devam ediyoruz.\n\n📞 ${companyInfo.phone}`,
      hashtags: ["gayrimenkul", "piyasa", "yatırım", "emlak"],
    },
    motivasyon: {
      content: `🏡 Hayalinizdeki eve bir adım daha yakınsınız!\n\nDoğru yatırım, doğru zamanlama ve doğru danışman ile her şey mümkün.\n\n${companyInfo.name} yanınızda! 💪\n\n📞 ${companyInfo.phone}`,
      hashtags: ["evsahibiol", "hayaller", "yatırım", "gayrimenkul"],
    },
    default: {
      content: `${companyInfo.name}\n${companyInfo.slogan}\n\n📍 ${companyInfo.location}\n📞 ${companyInfo.phone}\n🌐 ${companyInfo.website}`,
      hashtags: ["gayrimenkul", "emlak", companyInfo.location.toLowerCase()],
    },
  };

  const template = templates[category || "default"] || templates.default;

  return {
    platform,
    content: template.content,
    hashtags: template.hashtags,
    imagePrompt: "Profesyonel gayrimenkul görseli",
  };
}
