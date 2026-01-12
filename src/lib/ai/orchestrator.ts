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
   * Agent ile chat başlat
   */
  async chat(
    agentType: AgentType,
    messages: DeepSeekMessage[],
    context?: AgentContext
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
    context?: AgentContext
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
    visitorInfo?: { location?: string; previousInterests?: string[] }
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

    try {
      // JSON parse et
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fallback
    }

    return {
      content: response,
      hashtags: ["DemirGayrimenkul", "Hendek", "Sakarya"],
      seoTags: [params.propertyType, params.location],
    };
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
  }> {
    const prompt = `Aşağıdaki ${
      params.region
    } bölgesi ilan verilerini analiz et:

${JSON.stringify(params.listings, null, 2)}

Analiz çıktısı (JSON):
{
  "summary": "Genel pazar özeti",
  "trends": ["trend1", "trend2"],
  "recommendations": ["öneri1", "öneri2"],
  "averagePrice": ortalama_fiyat
}`;

    const response = await this.chat("miner_agent", [
      { role: "user", content: prompt },
    ]);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fallback
    }

    const avgPrice =
      params.listings.reduce((sum, l) => sum + l.price, 0) /
      params.listings.length;

    return {
      summary: response,
      trends: [],
      recommendations: [],
      averagePrice: avgPrice,
    };
  }

  /**
   * Konuşma analizi - Lead score ve intent
   */
  private async analyzeConversation(
    messages: DeepSeekMessage[],
    lastResponse: string
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

      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
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
    context?: AgentContext
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
