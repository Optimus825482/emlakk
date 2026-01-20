import { NextRequest, NextResponse } from "next/server";
import { getOrchestrator } from "@/lib/ai/orchestrator";
import { withAdmin } from "@/lib/api-auth";

export const POST = withAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const {
      listingTitle,
      listingDescription,
      price,
      location,
      propertyType,
      platform,
      features,
    } = body;

    if (!listingTitle || !price || !location || !propertyType || !platform) {
      return NextResponse.json(
        {
          error:
            "Eksik alanlar: listingTitle, price, location, propertyType, platform zorunludur",
        },
        { status: 400 }
      );
    }

    const validPlatforms = ["instagram", "twitter", "linkedin", "facebook"];
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        {
          error: `Gecersiz platform. Gecerli degerler: ${validPlatforms.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    const orchestrator = getOrchestrator();

    const result = await orchestrator.generateContent({
      listingTitle,
      listingDescription: listingDescription || "",
      price: Number(price),
      location,
      propertyType,
      platform,
      features: features || [],
    });

    return NextResponse.json({
      success: true,
      content: result.content,
      hashtags: result.hashtags,
      seoTags: result.seoTags,
      platform,
    });
  } catch (error) {
    console.error("Content Agent hatasi:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Bilinmeyen hata";

    if (errorMessage.includes("DEEPSEEK_API_KEY")) {
      return NextResponse.json(
        { error: "AI servisi yapilandirilmamis. DEEPSEEK_API_KEY gerekli." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: `Icerik uretim hatasi: ${errorMessage}` },
      { status: 500 }
    );
  }
});
