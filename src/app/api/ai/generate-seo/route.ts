import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, type, location, price, area, features } = body;

    // Basit SEO üretimi (AI entegrasyonu için hazır)
    // TODO: Gerçek AI entegrasyonu eklenecek (OpenAI, Anthropic, vb.)

    const typeLabels: Record<string, string> = {
      konut: "Konut",
      sanayi: "Sanayi",
      tarim: "Tarım Arazisi",
      ticari: "Ticari",
      arsa: "Arsa",
    };

    const typeLabel = typeLabels[type] || "Emlak";
    const priceFormatted = price
      ? `${parseInt(price).toLocaleString("tr-TR")}₺`
      : "";
    const areaFormatted = area ? `${area}m²` : "";

    // Meta Title Üretimi (50-60 karakter ideal)
    let metaTitle = title;
    if (location && priceFormatted) {
      metaTitle = `${title} - ${location} | ${areaFormatted} | ${priceFormatted}`;
    } else if (location) {
      metaTitle = `${title} - ${location} | ${typeLabel}`;
    }

    // 60 karakteri aşıyorsa kısalt
    if (metaTitle.length > 60) {
      metaTitle = `${title.slice(0, 40)}... - ${location}`;
    }

    // Meta Description Üretimi (150-160 karakter ideal)
    let metaDescription = description?.slice(0, 160) || "";

    if (!metaDescription) {
      const parts = [
        location ? `${location}'de` : "",
        typeLabel.toLowerCase(),
        areaFormatted,
        priceFormatted,
        features.length > 0 ? features.join(", ") : "",
      ].filter(Boolean);

      metaDescription = `${parts.join(" ")}. Detaylı bilgi ve fotoğraflar için hemen inceleyin! Demir Gayrimenkul güvencesiyle.`;
    }

    // 160 karakteri aşıyorsa kısalt
    if (metaDescription.length > 160) {
      metaDescription = metaDescription.slice(0, 157) + "...";
    }

    return NextResponse.json({
      success: true,
      metaTitle,
      metaDescription,
      keywords: [
        typeLabel.toLowerCase(),
        location?.toLowerCase(),
        "satılık",
        "kiralık",
        "emlak",
        "gayrimenkul",
        "hendek",
        "sakarya",
      ]
        .filter(Boolean)
        .join(", "),
    });
  } catch (error) {
    console.error("SEO generation error:", error);
    return NextResponse.json(
      { success: false, error: "SEO üretilirken hata oluştu" },
      { status: 500 },
    );
  }
}
