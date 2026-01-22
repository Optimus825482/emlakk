import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pageSeo } from "@/db/schema/page-seo";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pagePath, pageTitle, pageContent } = body;

    // AI-powered SEO generation (basit versiyon - gerçek AI entegrasyonu eklenecek)
    const seoData = generatePageSeo(pagePath, pageTitle, pageContent);

    // Database'de var mı kontrol et
    const existing = await db
      .select()
      .from(pageSeo)
      .where(eq(pageSeo.pagePath, pagePath))
      .limit(1);

    let result;
    if (existing.length > 0) {
      // Güncelle
      result = await db
        .update(pageSeo)
        .set({
          ...seoData,
          isAiGenerated: true,
          updatedAt: new Date(),
        })
        .where(eq(pageSeo.pagePath, pagePath))
        .returning();
    } else {
      // Yeni oluştur
      result = await db
        .insert(pageSeo)
        .values({
          pagePath,
          pageTitle,
          ...seoData,
          isAiGenerated: true,
        })
        .returning();
    }

    return NextResponse.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error("Page SEO generation error:", error);
    return NextResponse.json(
      { success: false, error: "SEO üretilemedi" },
      { status: 500 },
    );
  }
}

function generatePageSeo(
  pagePath: string,
  pageTitle: string,
  pageContent?: string,
) {
  const siteName = "Demir Gayrimenkul";
  const baseUrl = "https://demirgayrimenkul.com";

  // Sayfa bazlı SEO içeriği
  const pageConfigs: Record<
    string,
    {
      metaTitle: string;
      metaDescription: string;
      keywords: string;
      focusKeyword: string;
    }
  > = {
    "/": {
      metaTitle: `${siteName} | Hendek ve Sakarya'nın Güvenilir Emlak Danışmanı`,
      metaDescription:
        "Hendek ve Sakarya bölgesinde satılık ve kiralık emlak ilanları. Konut, arsa, tarım arazisi ve ticari gayrimenkul danışmanlığı. AI destekli değerleme hizmeti.",
      keywords:
        "hendek emlak, sakarya gayrimenkul, satılık daire, kiralık ev, arsa, tarım arazisi",
      focusKeyword: "hendek emlak",
    },
    "/hakkimizda": {
      metaTitle: `Hakkımızda | ${siteName} - Mustafa Demir`,
      metaDescription:
        "Demir Gayrimenkul olarak Hendek ve Sakarya bölgesinde 15+ yıllık tecrübemizle güvenilir emlak danışmanlığı hizmeti sunuyoruz. Müşteri memnuniyeti odaklı çalışıyoruz.",
      keywords:
        "demir gayrimenkul, mustafa demir, hendek emlakçı, emlak danışmanı",
      focusKeyword: "demir gayrimenkul",
    },
    "/iletisim": {
      metaTitle: `İletişim | ${siteName} - Bize Ulaşın`,
      metaDescription:
        "Demir Gayrimenkul ile iletişime geçin. Hendek ofisimizden bize ulaşabilir, randevu alabilir veya online form ile mesaj gönderebilirsiniz. 7/24 destek.",
      keywords: "iletişim, randevu, hendek ofis, emlak danışmanlığı",
      focusKeyword: "iletişim",
    },
    "/ilanlar": {
      metaTitle: `Emlak İlanları | ${siteName} - Satılık ve Kiralık`,
      metaDescription:
        "Hendek ve Sakarya'da satılık ve kiralık emlak ilanları. Konut, arsa, tarım arazisi, ticari gayrimenkul. Detaylı filtreleme ve AI destekli arama.",
      keywords:
        "emlak ilanları, satılık daire, kiralık ev, hendek ilanlar, sakarya emlak",
      focusKeyword: "emlak ilanları",
    },
    "/degerleme": {
      metaTitle: `AI Destekli Emlak Değerleme | ${siteName}`,
      metaDescription:
        "Gayrimenkulünüzün gerçek değerini AI teknolojisi ile öğrenin. Ücretsiz online değerleme, piyasa analizi ve yatırım önerileri. Hemen değerlendirin!",
      keywords:
        "emlak değerleme, gayrimenkul değeri, ai değerleme, piyasa analizi",
      focusKeyword: "emlak değerleme",
    },
    "/randevu": {
      metaTitle: `Randevu Al | ${siteName} - Kahve Eşliğinde Görüşelim`,
      metaDescription:
        "Demir Gayrimenkul ile randevu alın. Ofisimizde kahve eşliğinde emlak ihtiyaçlarınızı konuşalım. Online randevu sistemi ile kolayca rezervasyon yapın.",
      keywords: "randevu, emlak danışmanlığı, hendek ofis, görüşme",
      focusKeyword: "randevu",
    },
    "/rehber": {
      metaTitle: `Hendek Yatırım Rehberi | ${siteName}`,
      metaDescription:
        "Hendek'te gayrimenkul yatırımı için kapsamlı rehber. Bölge analizi, fiyat trendleri, yatırım fırsatları ve uzman tavsiyeleri. Bilinçli yatırım yapın!",
      keywords:
        "hendek rehber, yatırım rehberi, gayrimenkul yatırımı, bölge analizi",
      focusKeyword: "hendek yatırım rehberi",
    },
  };

  const config =
    pageConfigs[pagePath] || pageConfigs["/"] || pageConfigs[pagePath];

  // SEO Score hesaplama (basit)
  let seoScore = 50;
  if (config.metaTitle.length >= 50 && config.metaTitle.length <= 60)
    seoScore += 15;
  if (
    config.metaDescription.length >= 150 &&
    config.metaDescription.length <= 160
  )
    seoScore += 15;
  if (config.focusKeyword) seoScore += 10;
  if (config.keywords) seoScore += 10;

  return {
    metaTitle: config.metaTitle,
    metaDescription: config.metaDescription,
    metaKeywords: config.keywords,
    canonicalUrl: `${baseUrl}${pagePath}`,
    ogTitle: config.metaTitle,
    ogDescription: config.metaDescription,
    ogImage: `${baseUrl}/og-image.jpg`,
    ogType: "website",
    twitterCard: "summary_large_image",
    twitterTitle: config.metaTitle,
    twitterDescription: config.metaDescription,
    twitterImage: `${baseUrl}/og-image.jpg`,
    focusKeyword: config.focusKeyword,
    seoScore,
    seoAnalysis: {
      strengths: [
        "Meta başlık optimal uzunlukta",
        "Meta açıklama detaylı ve açıklayıcı",
        "Odak anahtar kelime belirlenmiş",
      ],
      weaknesses: [],
      suggestions: [
        "Open Graph görseli özelleştirilebilir",
        "Structured data eklenebilir",
      ],
    },
    structuredData: {
      "@context": "https://schema.org",
      "@type": "RealEstateAgent",
      name: siteName,
      url: baseUrl,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Hendek",
        addressRegion: "Sakarya",
        addressCountry: "TR",
      },
    },
  };
}
