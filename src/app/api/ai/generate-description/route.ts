import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/api-auth";

/**
 * POST /api/ai/generate-description
 * DeepSeek AI ile akıllı ilan açıklaması üret (Admin only)
 */
export const POST = withAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json();

    // Zorunlu alanları kontrol et
    if (
      !body.title ||
      !body.type ||
      !body.area ||
      !body.price ||
      !body.address
    ) {
      return NextResponse.json(
        {
          error: "Eksik alanlar: title, type, area, price, address zorunludur",
        },
        { status: 400 },
      );
    }

    const listingData = {
      title: body.title,
      type: body.type,
      transactionType: body.transactionType || "sale",
      area: parseInt(body.area),
      price: parseFloat(body.price),
      address: body.address,
      district: body.district,
      neighborhood: body.neighborhood,
      features: body.features,
    };

    const { getOrchestrator } = await import("@/lib/ai/orchestrator");
    const orchestrator = getOrchestrator();

    const result = await orchestrator.generateContent({
      listingTitle: body.title,
      listingDescription: body.description || "",
      price: parseFloat(body.price),
      location: body.address,
      propertyType: body.type,
      platform: "instagram", // Genel açıklama için varsayılan
      features: body.features,
    });

    const description = result.content;

    return NextResponse.json({
      success: true,
      description,
    });
  } catch (error) {
    console.error("AI açıklama üretme hatası:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Bilinmeyen hata";

    // API key yoksa özel mesaj
    if (errorMessage.includes("DEEPSEEK_API_KEY")) {
      return NextResponse.json(
        {
          error:
            "AI servisi yapılandırılmamış. Lütfen DEEPSEEK_API_KEY'i ayarlayın.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: `Açıklama üretilemedi: ${errorMessage}` },
      { status: 500 },
    );
  }
});
