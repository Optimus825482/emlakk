import { NextRequest, NextResponse } from "next/server";
import { generateListingDescription, ListingData } from "@/lib/deepseek";

/**
 * POST /api/ai/generate-description
 * DeepSeek AI ile akıllı ilan açıklaması üret
 */
export async function POST(request: NextRequest) {
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
        { status: 400 }
      );
    }

    const listingData: ListingData = {
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

    const description = await generateListingDescription(listingData);

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
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: `Açıklama üretilemedi: ${errorMessage}` },
      { status: 500 }
    );
  }
}
