/**
 * SEO Agent - DeepSeek-Reasoner ile Otomatik SEO Optimizasyonu
 *
 * Bu agent, içerik eklendiğinde veya güncellendiğinde otomatik olarak:
 * - Meta title ve description oluşturur
 * - Anahtar kelime analizi yapar
 * - Open Graph ve Twitter Card meta'ları oluşturur
 * - Structured Data (JSON-LD) oluşturur
 * - SEO skoru hesaplar ve öneriler sunar
 */

interface SeoInput {
  entityType: "page" | "listing" | "blog";
  entityId: string;
  title: string;
  content: string;
  images?: string[];
  category?: string;
  location?: string;
  price?: number;
  features?: string[];
}

interface SeoOutput {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  focusKeyword: string;
  ogTitle: string;
  ogDescription: string;
  twitterTitle: string;
  twitterDescription: string;
  structuredData: Record<string, unknown>;
  seoScore: number;
  seoAnalysis: {
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
}

const SEO_SYSTEM_PROMPT = `Sen profesyonel bir SEO uzmanısın. Türkiye'de gayrimenkul sektöründe uzmanlaşmış, özellikle Sakarya/Hendek bölgesine odaklanan bir emlak sitesi için SEO optimizasyonu yapıyorsun.

GÖREV: Verilen içerik için mükemmel SEO meta verileri oluştur.

KURALLAR:
1. Meta Title: Max 60 karakter, ana anahtar kelime başta, marka sonda
2. Meta Description: Max 155 karakter, CTA içermeli, anahtar kelime doğal geçmeli
3. Anahtar kelimeler: Yerel SEO odaklı (Hendek, Sakarya), long-tail tercih et
4. Türkçe karakterler doğru kullanılmalı
5. Gayrimenkul sektörüne özgü terimler kullan

HEDEF ANAHTAR KELİMELER:
- Hendek emlak
- Sakarya gayrimenkul
- Hendek satılık ev/daire/arsa
- Hendek kiralık
- Sakarya 2. OSB yakını emlak
- Hendek yatırımlık arsa

JSON formatında yanıt ver.`;

export async function generateSeoMetadata(input: SeoInput): Promise<SeoOutput> {
  try {
    const { getOrchestrator } = await import("@/lib/ai/orchestrator");
    const orchestrator = getOrchestrator();

    const seoData = await orchestrator.generateSeoMetadata({
      title: input.title,
      content: input.content,
      location: input.location,
      category: input.category,
    });

    // Orchestrator'dan gelen temel verileri normalize et (fallbacks ekler, uzunluk kontrol eder)
    return validateAndNormalizeSeo(seoData as any, input);
  } catch (error) {
    console.error("SEO Agent error:", error);
    return generateFallbackSeo(input);
  }
}

function buildUserPrompt(input: SeoInput): string {
  let prompt = `İçerik Tipi: ${input.entityType}\n`;
  prompt += `Başlık: ${input.title}\n`;
  prompt += `İçerik: ${input.content.substring(0, 1000)}...\n`;

  if (input.location) {
    prompt += `Konum: ${input.location}\n`;
  }
  if (input.category) {
    prompt += `Kategori: ${input.category}\n`;
  }
  if (input.price) {
    prompt += `Fiyat: ${input.price.toLocaleString("tr-TR")} TL\n`;
  }
  if (input.features?.length) {
    prompt += `Özellikler: ${input.features.join(", ")}\n`;
  }

  prompt += `\nBu içerik için SEO meta verilerini JSON formatında oluştur:
{
  "metaTitle": "...",
  "metaDescription": "...",
  "keywords": ["...", "..."],
  "focusKeyword": "...",
  "ogTitle": "...",
  "ogDescription": "...",
  "twitterTitle": "...",
  "twitterDescription": "...",
  "structuredData": {...},
  "seoScore": 0-100,
  "seoAnalysis": {
    "strengths": ["..."],
    "weaknesses": ["..."],
    "suggestions": ["..."]
  }
}`;

  return prompt;
}

function validateAndNormalizeSeo(
  data: Partial<SeoOutput>,
  input: SeoInput,
): SeoOutput {
  return {
    metaTitle: truncate(
      data.metaTitle || `${input.title} | Demir Gayrimenkul`,
      60,
    ),
    metaDescription: truncate(data.metaDescription || input.content, 155),
    keywords: data.keywords || extractKeywords(input),
    focusKeyword: data.focusKeyword || "Hendek emlak",
    ogTitle: truncate(data.ogTitle || data.metaTitle || input.title, 95),
    ogDescription: truncate(
      data.ogDescription || data.metaDescription || input.content,
      200,
    ),
    twitterTitle: truncate(
      data.twitterTitle || data.metaTitle || input.title,
      70,
    ),
    twitterDescription: truncate(
      data.twitterDescription || data.metaDescription || input.content,
      200,
    ),
    structuredData: data.structuredData || generateStructuredData(input),
    seoScore: data.seoScore || 70,
    seoAnalysis: data.seoAnalysis || {
      strengths: ["İçerik mevcut"],
      weaknesses: ["Manuel optimizasyon gerekebilir"],
      suggestions: ["Anahtar kelime yoğunluğunu kontrol edin"],
    },
  };
}

function generateFallbackSeo(input: SeoInput): SeoOutput {
  const title = truncate(input.title, 50);
  const desc = truncate(input.content, 140);

  return {
    metaTitle: `${title} | Demir Gayrimenkul Hendek`,
    metaDescription: `${desc}... Hendek'in güvenilir emlak danışmanı Demir Gayrimenkul.`,
    keywords: extractKeywords(input),
    focusKeyword: input.location ? `${input.location} emlak` : "Hendek emlak",
    ogTitle: `${title} | Demir Gayrimenkul`,
    ogDescription: desc,
    twitterTitle: title,
    twitterDescription: desc,
    structuredData: generateStructuredData(input),
    seoScore: 60,
    seoAnalysis: {
      strengths: ["Temel SEO meta verileri oluşturuldu"],
      weaknesses: ["AI optimizasyonu yapılamadı"],
      suggestions: [
        "DeepSeek API anahtarını kontrol edin",
        "Manuel SEO düzenlemesi yapın",
      ],
    },
  };
}

function extractKeywords(input: SeoInput): string[] {
  const keywords = ["Hendek emlak", "Sakarya gayrimenkul", "Demir Gayrimenkul"];

  if (input.location) {
    keywords.push(`${input.location} satılık`);
    keywords.push(`${input.location} kiralık`);
  }

  if (input.category) {
    keywords.push(`Hendek ${input.category.toLowerCase()}`);
  }

  if (input.entityType === "listing") {
    keywords.push("Hendek satılık ev", "Hendek satılık daire");
  }

  return keywords.slice(0, 10);
}

function generateStructuredData(input: SeoInput): Record<string, unknown> {
  const baseData = {
    "@context": "https://schema.org",
    "@type": input.entityType === "listing" ? "RealEstateListing" : "WebPage",
    name: input.title,
    description: truncate(input.content, 200),
    provider: {
      "@type": "RealEstateAgent",
      name: "Demir Gayrimenkul",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Hendek",
        addressRegion: "Sakarya",
        addressCountry: "TR",
      },
    },
  };

  if (input.entityType === "listing") {
    return {
      ...baseData,
      "@type": "RealEstateListing",
      price: input.price,
      priceCurrency: "TRY",
      address: {
        "@type": "PostalAddress",
        addressLocality: input.location || "Hendek",
        addressRegion: "Sakarya",
        addressCountry: "TR",
      },
    };
  }

  return baseData;
}

function truncate(text: string, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

// SEO Skoru Hesaplama
export function calculateSeoScore(metadata: Partial<SeoOutput>): number {
  let score = 0;

  // Meta Title (20 puan)
  if (metadata.metaTitle) {
    score += 10;
    if (metadata.metaTitle.length >= 30 && metadata.metaTitle.length <= 60)
      score += 10;
  }

  // Meta Description (20 puan)
  if (metadata.metaDescription) {
    score += 10;
    if (
      metadata.metaDescription.length >= 120 &&
      metadata.metaDescription.length <= 155
    )
      score += 10;
  }

  // Keywords (15 puan)
  if (metadata.keywords?.length) {
    score += 5;
    if (metadata.keywords.length >= 3 && metadata.keywords.length <= 10)
      score += 10;
  }

  // Focus Keyword (10 puan)
  if (metadata.focusKeyword) {
    score += 5;
    if (
      metadata.metaTitle
        ?.toLowerCase()
        .includes(metadata.focusKeyword.toLowerCase())
    )
      score += 5;
  }

  // Open Graph (15 puan)
  if (metadata.ogTitle && metadata.ogDescription) score += 15;

  // Twitter Card (10 puan)
  if (metadata.twitterTitle && metadata.twitterDescription) score += 10;

  // Structured Data (10 puan)
  if (
    metadata.structuredData &&
    Object.keys(metadata.structuredData).length > 0
  )
    score += 10;

  return Math.min(score, 100);
}

// Toplu SEO Analizi
export async function analyzeSeoHealth(entityType: string): Promise<{
  total: number;
  optimized: number;
  needsWork: number;
  averageScore: number;
}> {
  // Bu fonksiyon veritabanından SEO verilerini çekip analiz edecek
  // Şimdilik placeholder
  return {
    total: 0,
    optimized: 0,
    needsWork: 0,
    averageScore: 0,
  };
}
