/**
 * AI Agent Orchestrator
 * Demir Gayrimenkul için merkezi agent yönetim sistemi
 *
 * 3 Ana Agent:
 * 1. Demir Agent - Web sitesi asistanı, müşteri chat
 * 2. Miner Agent - İlan kazıma, pazar istihbaratı
 * 3. Content Agent - Sosyal medya içerik üretimi
 */

import { DeepSeekClient, DeepSeekMessage, getDeepSeekClient } from "./deepseek";

export type AgentType = "demir_agent" | "miner_agent" | "content_agent";

export interface AgentContext {
  agentType: AgentType;
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentTask {
  id: string;
  agentType: AgentType;
  taskType: string;
  input: Record<string, unknown>;
  status: "pending" | "running" | "completed" | "failed";
  output?: Record<string, unknown>;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

// Agent System Prompts
const AGENT_PROMPTS: Record<AgentType, string> = {
  demir_agent: `Sen Demir Gayrimenkul'ün AI asistanı "Demir Agent"sın. 
Görevin:
- Müşterilere gayrimenkul konusunda yardımcı olmak
- İlan sorularını yanıtlamak
- Randevu almalarına yardımcı olmak
- Değerleme hakkında bilgi vermek
- Hendek ve Sakarya bölgesi hakkında bilgi vermek

Kurallar:
- Her zaman Türkçe konuş
- Samimi ama profesyonel ol
- Fiyat bilgisi verirken dikkatli ol, güncel fiyatları kontrol etmelerini öner
- Randevu için iletişim bilgilerini al
- Ciddi yatırımcıları tespit et ve lead score'u yükselt

Bölge Bilgisi:
- Hendek: Sakarya'nın önemli ilçesi, OSB bölgesi, sanayi yatırımları
- Fındık bahçeleri: Bölgenin önemli tarımsal varlığı
- Sanayi imarlı arsalar: Yüksek talep görüyor`,

  miner_agent: `Sen Demir Gayrimenkul'ün pazar istihbarat ajanı "Miner Agent"sın.
Görevin:
- Sahibinden, Hepsiemlak, Emlakjet gibi sitelerden ilan verisi toplamak
- Fiyat değişikliklerini takip etmek
- Yeni ilanları tespit etmek
- Kaldırılan ilanları raporlamak
- Pazar trendlerini analiz etmek

Odak Bölgeler:
- Hendek ve çevresi
- Sakarya geneli
- Özellikle: Sanayi imarlı arsalar, fındık bahçeleri, konut imarlı arsalar

Çıktı Formatı:
- Yapılandırılmış JSON veri
- Alarm ve bildirimler
- Trend raporları`,

  content_agent: `Sen Demir Gayrimenkul'ün içerik üretim ajanı "Content Agent"sın.
Görevin:
- İlanlar için sosyal medya içeriği üretmek
- SEO etiketleri oluşturmak
- Profesyonel tanıtım yazıları yazmak
- Hashtag önerileri sunmak
- İçerik takvimi planlamak

Platformlar:
- Instagram: Görsel odaklı, kısa ve çekici
- LinkedIn: Profesyonel, yatırımcı odaklı
- Twitter/X: Kısa, dikkat çekici
- Facebook: Detaylı, topluluk odaklı

Stil:
- Türkçe, akıcı ve profesyonel
- Emoji kullanımı platform bazlı
- Bölgesel anahtar kelimeler: Hendek, Sakarya, OSB, fındık bahçesi
- CTA (Call to Action) içermeli`,
};

export class AgentOrchestrator {
  private client: DeepSeekClient;
  private activeTasks: Map<string, AgentTask> = new Map();

  constructor(client?: DeepSeekClient) {
    this.client = client || getDeepSeekClient();
  }

  /**
   * AI yanıtlarından JSON verisini güvenli bir şekilde ayıklar
   */
  private safeJsonParse<T>(text: string): T | null {
    if (!text) return null;
    try {
      // Markdown bloklarını temizle
      const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      // JSON objesini başından ve sonundan yakala
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");

      if (start !== -1 && end !== -1) {
        const jsonStr = cleaned.substring(start, end + 1);
        return JSON.parse(jsonStr) as T;
      }

      return JSON.parse(cleaned) as T;
    } catch (e) {
      console.error("AI JSON Parse Hatası:", e, "\nYanıt:", text);
      return null;
    }
  }

  /**
   * Agent ile chat başlat
   */
  async chat(
    agentType: AgentType,
    messages: DeepSeekMessage[],
    context?: AgentContext,
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(agentType, context);
    const fullMessages: DeepSeekMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    return this.client.chat(fullMessages);
  }

  /**
   * Streaming chat
   */
  async *chatStream(
    agentType: AgentType,
    messages: DeepSeekMessage[],
    context?: AgentContext,
  ): AsyncGenerator<string, void, unknown> {
    const systemPrompt = this.buildSystemPrompt(agentType, context);
    const fullMessages: DeepSeekMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    yield* this.client.chatStream(fullMessages);
  }

  /**
   * Demir Agent - Müşteri chat yanıtı
   */
  async demirAgentChat(
    userMessage: string,
    chatHistory: DeepSeekMessage[] = [],
    visitorInfo?: { location?: string; previousInterests?: string[] },
  ): Promise<{ response: string; leadScore: number; intent: string }> {
    const contextInfo = visitorInfo
      ? `\n\nZiyaretçi Bilgisi:\n- Konum: ${
          visitorInfo.location || "Bilinmiyor"
        }\n- Önceki İlgi Alanları: ${
          visitorInfo.previousInterests?.join(", ") || "Yok"
        }`
      : "";

    const messages: DeepSeekMessage[] = [
      ...chatHistory,
      { role: "user", content: userMessage },
    ];

    const response = await this.chat("demir_agent", messages, {
      agentType: "demir_agent",
      metadata: { visitorInfo, contextInfo },
    });

    // Lead score ve intent analizi
    const analysis = await this.analyzeConversation(messages, response);

    return {
      response,
      leadScore: analysis.leadScore,
      intent: analysis.intent,
    };
  }

  /**
   * Content Agent - İçerik üretimi
   */
  async generateContent(params: {
    listingTitle: string;
    listingDescription: string;
    price: number;
    location: string;
    propertyType: string;
    platform: "instagram" | "twitter" | "linkedin" | "facebook";
    features?: string[];
  }): Promise<{
    content: string;
    hashtags: string[];
    seoTags: string[];
  }> {
    const prompt = `Aşağıdaki ilan için ${params.platform} paylaşımı oluştur:

İlan Başlığı: ${params.listingTitle}
Açıklama: ${params.listingDescription}
Fiyat: ${params.price.toLocaleString("tr-TR")} TL
Konum: ${params.location}
Tür: ${params.propertyType}
${params.features?.length ? `Özellikler: ${params.features.join(", ")}` : ""}

Çıktı formatı (JSON):
{
  "content": "Paylaşım metni",
  "hashtags": ["hashtag1", "hashtag2"],
  "seoTags": ["seo1", "seo2"]
}`;

    const response = await this.chat("content_agent", [
      { role: "user", content: prompt },
    ]);

    const parsed = this.safeJsonParse<{
      content: string;
      hashtags: string[];
      seoTags: string[];
    }>(response);

    if (parsed) {
      return parsed;
    }

    return {
      content: response,
      hashtags: ["DemirGayrimenkul", "Hendek", "Sakarya"],
      seoTags: [params.propertyType, params.location],
    };
  }

  /**
   * Content Agent - Genel sosyal medya içeriği üretimi
   */
  async generateGeneralContent(params: {
    type: string;
    category?: string;
    customPrompt?: string;
    platforms: string[];
    tone: string;
    companyInfo: { name: string; [key: string]: unknown };
  }): Promise<
    Array<{
      platform: string;
      content: string;
      hashtags?: string[];
      imagePrompt?: string;
    }>
  > {
    const contents = [];
    for (const platform of params.platforms) {
      const prompt = `Sen bir gayrimenkul sosyal medya uzmanısın. ${params.companyInfo.name} için ${platform} platformunda ${params.category} postu oluştur.
      ${params.customPrompt ? `Özel konu: ${params.customPrompt}` : ""}
      Ton: ${params.tone}
      Çıktı formatı (JSON):
      { "content": "içerik", "hashtags": ["h1", "h2"], "imagePrompt": "görsel önerisi" }`;

      const response = await this.chat("content_agent", [
        { role: "user", content: prompt },
      ]);
      const parsed = this.safeJsonParse<{
        content: string;
        hashtags?: string[];
        imagePrompt?: string;
      }>(response);
      contents.push({ platform, ...(parsed || { content: response }) });
    }
    return contents;
  }

  /**
   * SEO Agent - SEO Analiz ve Meta Veri Üretimi
   */
  async generateSeoMetadata(params: {
    title: string;
    content: string;
    location?: string;
    category?: string;
  }): Promise<{
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    focusKeyword: string;
    seoScore: number;
  }> {
    const prompt = `Aşağıdaki içerik için SEO optimizasyonu yap:
    Başlık: ${params.title}
    İçerik: ${params.content}
    Konum: ${params.location || "Hendek, Sakarya"}
    
    Çıktı formatı (JSON):
    {
      "metaTitle": "SEO Başlığı",
      "metaDescription": "SEO Açıklaması",
      "keywords": ["anahtar1", "anahtar2"],
      "focusKeyword": "odak kelime",
      "seoScore": 0-100 arası puan
    }`;

    const response = await this.chat("content_agent", [
      { role: "user", content: prompt },
    ]);

    const parsed = this.safeJsonParse<{
      metaTitle: string;
      metaDescription: string;
      keywords: string[];
      focusKeyword: string;
      seoScore: number;
    }>(response);
    return (
      parsed || {
        metaTitle: params.title,
        metaDescription: params.content.slice(0, 160),
        keywords: [],
        focusKeyword: "",
        seoScore: 50,
      }
    );
  }

  /**
   * Miner Agent - Pazar analizi
   */
  async analyzeMarket(params: {
    listings: Array<{
      title: string;
      price: number;
      location: string;
      type: string;
    }>;
    region: string;
  }): Promise<{
    summary: string;
    trends: string[];
    recommendations: string[];
    averagePrice: number;
    visualData: {
      priceDistribution: Array<{ range: string; count: number }>;
      typeBreakdown: Array<{ type: string; value: number }>;
      comparativePrices: Array<{ region: string; avgPrice: number }>;
    };
  }> {
    const prompt = `Aşağıdaki ${
      params.region
    } bölgesi ilan verilerini analiz et ve görselleştirme için yapısal veri hazırla:

${JSON.stringify(params.listings, null, 2)}

Analiz çıktısı tam olarak şu JSON formatında olmalıdır:
{
  "summary": "Pazarın derinlemesine analizi",
  "trends": ["3-5 adet trend cümlesi"],
  "recommendations": ["Stratejik öneriler"],
  "averagePrice": 1234567,
  "visualData": {
    "priceDistribution": [
      {"range": "0-1M", "count": 5},
      {"range": "1M-2M", "count": 12}
    ],
    "typeBreakdown": [
      {"type": "Arsa", "value": 40},
      {"type": "Konut", "value": 60}
    ],
    "comparativePrices": [
      {"region": "${params.region}", "avgPrice": 1234567},
      {"region": "Komşu Bölge 1", "avgPrice": 1100000},
      {"region": "Komşu Bölge 2", "avgPrice": 1400000}
    ]
  }
}`;

    const response = await this.chat("miner_agent", [
      { role: "user", content: prompt },
    ]);

    const parsed = this.safeJsonParse<{
      summary: string;
      trends: string[];
      recommendations: string[];
      averagePrice: number;
      visualData: {
        priceDistribution: Array<{ range: string; count: number }>;
        typeBreakdown: Array<{ type: string; value: number }>;
        comparativePrices: Array<{ region: string; avgPrice: number }>;
      };
    }>(response);

    if (parsed) {
      return parsed;
    }

    const avgPrice =
      params.listings.length > 0
        ? params.listings.reduce((sum, l) => sum + l.price, 0) /
          params.listings.length
        : 0;

    return {
      summary: response,
      trends: [],
      recommendations: [],
      averagePrice: avgPrice,
      visualData: {
        priceDistribution: [],
        typeBreakdown: [],
        comparativePrices: [{ region: params.region, avgPrice: avgPrice }],
      },
    };
  }

  /**
   * Konuşma analizi - Lead score ve intent
   */
  private async analyzeConversation(
    messages: DeepSeekMessage[],
    lastResponse: string,
  ): Promise<{ leadScore: number; intent: string }> {
    const analysisPrompt = `Aşağıdaki konuşmayı analiz et ve JSON formatında yanıt ver:

Konuşma:
${messages.map((m) => `${m.role}: ${m.content}`).join("\n")}

Son yanıt: ${lastResponse}

Analiz (JSON):
{
  "leadScore": 0-100 arası puan (ciddi yatırımcı = yüksek),
  "intent": "buy" | "sell" | "rent" | "valuation" | "info" | "other"
}`;

    try {
      const analysis = await this.client.chat([
        {
          role: "system",
          content:
            "Sen bir konuşma analiz uzmanısın. Sadece JSON formatında yanıt ver.",
        },
        { role: "user", content: analysisPrompt },
      ]);

      const parsed = this.safeJsonParse<{ leadScore: number; intent: string }>(
        analysis,
      );

      if (parsed) {
        return {
          leadScore: Math.min(100, Math.max(0, parsed.leadScore || 50)),
          intent: parsed.intent || "info",
        };
      }
    } catch {
      // Fallback
    }

    return { leadScore: 50, intent: "info" };
  }

  /**
   * System prompt oluştur
   */
  private buildSystemPrompt(
    agentType: AgentType,
    context?: AgentContext,
  ): string {
    let prompt = AGENT_PROMPTS[agentType];

    if (context?.metadata) {
      const contextInfo = context.metadata.contextInfo;
      if (contextInfo) {
        prompt += `\n\n${contextInfo}`;
      }
    }

    return prompt;
  }
}

// Singleton instance
let orchestrator: AgentOrchestrator | null = null;

export function getOrchestrator(): AgentOrchestrator {
  if (!orchestrator) {
    orchestrator = new AgentOrchestrator();
  }
  return orchestrator;
}
