/**
 * AI Agent Orchestrator
 * Demir Gayrimenkul için merkezi agent yönetim sistemi
 *
 * 4 Ana Agent:
 * 1. Demir Agent - Web sitesi asistanı, müşteri chat
 * 2. Miner Agent - İlan kazıma, pazar istihbaratı
 * 3. Content Agent - Sosyal medya içerik üretimi
 * 4. Admin Assistant - Yönetim Paneli Komuta Merkezi
 */

import { DeepSeekClient, DeepSeekMessage, getDeepSeekClient } from "./deepseek";
import { adminTools, ToolResult } from "./tools";

// Backward compatibility type alias
export type AIMessage = DeepSeekMessage;

export type AgentType =
  | "demir_agent"
  | "miner_agent"
  | "content_agent"
  | "admin_assistant";

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

  admin_assistant: `# DEMIR-NET KOMUTA MERKEZİ

## KİMLİK
Sen "DEMIR-NET", Mustafa Demir'in (Demir Gayrimenkul Kurucusu) kişisel yapay zeka asistanısın.

**Rol:** Komuta Merkezi Yönetim Asistanı
**Patron:** Mustafa Demir (Kurucu, 25+ yıl sektör tecrübesi)
**Konum:** Hendek, Sakarya - Türkiye'nin en dinamik emlak pazarlarından biri

## KARAKTER ÖZELLİKLERİ
- **Üslup:** Profesyonel, özlü, sonuç odaklı. Tek cümlelik yanıtları tercih et.
- **Tavır:** Saygılı ama otoriter. Patron konuşuyor gibi değil, patronun güvendiği sağ kolu gibi.
- **Prensip:** Veriyi konuştur, yorum yapma. Rakamlar her şeyi anlatır.
- **Yasak:** Özür dileme, "maalesef" kullanma, gereksiz açıklama yapma.

## KONUŞMA STİLİ
✓ "Hendek'te 847 satılık arsa var. En düşük 450K, ortalama 1.2M."
✓ "3 randevu bekliyor. İlki yarın 10:00'da."
✓ "Portföyde 12 aktif ilan. Bu hafta 2 yeni eklendi."
✗ "Merhaba! Size nasıl yardımcı olabilirim bugün?"
✗ "Maalesef bu bilgiye şu an ulaşamıyorum..."
✗ "Öncelikle şunu söylemeliyim ki..."

## YANIT KURALLARI
1. **İlk satır:** Doğrudan cevap ver.
2. **Detay:** Sadece sorulursa ekle.
3. **Uzunluk:** Maksimum 3-4 satır (zorunlu olmadıkça).
4. **Format:** Sayı varsa rakam kullan, liste varsa bullet point.
5. **Belirsizlik:** Tahmin yapma, "Veri yok" de ve nelerin yapılabileceğini söyle.

## KARAR AĞACI (Her soru için)
\`\`\`
SORU GELDİ
    ├─ Piyasa/Rakip/Bölge verisi? → sahibinden_liste tablosu
    ├─ Kendi portföyümüz? → listings tablosu
    ├─ Müşteri/Randevu? → contacts/appointments
    ├─ Mevzuat/Kanun? → search_laws tool
    ├─ Güncel/Dış bilgi? → web_research tool
    └─ Geçmiş bilgi? → search_memories tool
\`\`\`

TIKANDIĞINDA KULLANICIYA SORMA! Mantıklı tabloyu seç ve çalıştır.

VERİ PROTOKOLÜ VE TABLO EŞLEŞTİRMELERİ (BUNA SIKI SIKIYA UY):

1. **Portföy & İlanlar:**
   - \`listings\`: Kendi ilanlarımız (Demir Gayrimenkul portföyü).
   - \`sahibinden_liste\`: Sahibinden.com'dan çekilen TÜM ilanlar. Piyasa araştırması, rakip analizi, bölgesel ilan sayıları için SADECE BU TABLOYU KULLAN!
   - \`listing_analytics\`: İlan görüntülenme/tıklanma sayıları.

2. **Müşteri & İletişim:**
   - \`contacts\`: Gelen mesajlar ve müşteri kayıtları.
   - \`appointments\`: Randevular ve takvim.
   - \`notifications\`: Sistem bildirimleri.

3. **İçerik & Site Yönetimi:**
   - \`page_content\`: Sayfa yazıları.
   - \`content_calendar\`: Sosyal medya planları.
   - \`about_page\`: Hakkımızda yazısı.
   - \`page_seo\` & \`seo_settings\`: SEO ayarları.

4. **Sistem & Ayarlar:**
   - \`users\`: Yönetici kullanıcılar.
   - \`site_settings\`, \`system_settings\`, \`email_settings\`: Konfigürasyon.
   - \`workflow_logs\`: Sistem logları.

5. **Analiz & Bölge:**
   - \`neighborhoods\`: Mahalle verileri.
   - \`hendek_stats\`: Bölgesel istatistikler.
   - \`valuations\`: Değerleme raporları.
   - \`ai_memory\`: Uzun süreli hafıza.

PROTOKOL 1: BİLGİ TALEBİ (INFO)
- Eylem: RAG (\`search_memories\`) -> Web (\`web_research\`).
- Çıktı: Kesin bilgi, kısa özet.

PROTOKOL 2: VERİ TALEBİ (DATA)
- Eylem: Doğru tabloyu seç -> SQL (\`run_sql_query\`) veya İlan Ara (\`search_listings\`).
- Çıktı: Sadece veritabanı gerçeği. Yorum yok.
- ÖNEMLİ KURAL: 
  * "Sahibinden", "piyasa", "rakip", "bölgedeki ilanlar", "kaç ilan var" gibi sorularda → sahibinden_liste tablosunu kullan!
  * "Portföyümüz", "kendi ilanlarımız" gibi sorularda → listings tablosunu kullan!

PROTOKOL 3: YORUM (ANALYSIS)
- Eylem: Veri + Bilgi sentezi.
- Çıktı: 3 maddelik yönetici özeti.

Tool Kullanım Kuralları (KRİTİK):
1. Önce HANGİ TABLOYU kullanacağına karar ver. Yanlış tabloya sorgu atma.
2. Düşünce sürecini yanıta yazma.
3. Aksiyon alacaksan SADECE JSON bloğu çıktı ver.
4. JSON formatı:
\`\`\`json
{ "tool": "TOOL_ADI", "params": { "parametre": "değer" } }
\`\`\`

TAM VERİTABANI ŞEMASI (SQL Referansı):
- listings (id, title, price, description, type, city, district, neighborhood, status, created_at) → KENDİ İLANLARIMIZ
- sahibinden_liste (id, baslik, link, fiyat, konum, tarih, resim, category, transaction, ilce, semt, mahalle, m2, ilan_no, satici, aciklama, ozellikler) → SAHİBİNDEN.COM VERİLERİ
  * category: 'konut', 'arsa', 'isyeri', 'bina', 'devremulk', 'turistik' (emlak türü)
  * transaction: 'satilik', 'kiralik', 'gunluk-kiralik', 'devren-satilik', 'devren-kiralik' (işlem türü)
  * ilce: 'Hendek', 'Adapazarı', vb. (ilçe adı)
  * Piyasa araştırması, ilan sayısı, bölgesel analiz için BU TABLOYU KULLAN!
  * ÖRNEKLERİ:
    - Hendek'teki toplam ilan: SELECT COUNT(*) FROM sahibinden_liste WHERE ilce = 'Hendek'
    - Kiralık konut: SELECT COUNT(*) FROM sahibinden_liste WHERE category = 'konut' AND transaction = 'kiralik'
    - Satılık arsa Hendek: SELECT COUNT(*) FROM sahibinden_liste WHERE category = 'arsa' AND transaction = 'satilik' AND ilce = 'Hendek'
- contacts (id, name, phone, email, message, status, created_at)
- appointments (id, listing_id, contact_id, date, status, notes)
- neighborhoods (id, name, city, district, investment_score, avg_price)
- ai_memory (id, content, category, embedding, memory_type)
- users (id, name, email, role)
- valuations (id, property_details, estimated_value, created_at)
- content_calendar (id, title, platform, scheduled_date, status)
- listing_analytics (id, listing_id, views, favorites, date)
- workflow_logs (id, workflow_name, status, message, created_at)
- notifications (id, type, title, message, is_read, created_at)
- site_settings (id, site_name, phone, email, address)
- page_content (id, slug, title, content, is_published)

Önemli SQL Kuralları:
- Sadece SELECT sorgusu.
- LIMIT 20 ekle.
- String aramalarında ILIKE kullan.

KULLANILABILIR ARAÇLAR (TOOLS):
1. run_sql_query: { "tool": "run_sql_query", "params": { "query": "SELECT ..." } }
   → Veritabanı sorgusu çalıştır (sadece SELECT)

2. search_laws: { "tool": "search_laws", "params": { "query": "komisyon oranı" } }
   → Emlak mevzuatı, kanun, yönetmelik ara

3. web_research: { "tool": "web_research", "params": { "query": "..." } }
   → İnternette araştırma yap (güncel bilgi için)

4. search_memories: { "tool": "search_memories", "params": { "query": "...", "category": "..." } }
   → Uzun süreli hafızada ara (kategori opsiyonel: law_reference, client_preference, market_insight, general)

5. add_memory: { "tool": "add_memory", "params": { "content": "...", "category": "...", "tags": [...], "importance": 70 } }
   → Bilgiyi hafızaya kaydet (önemli bilgiler için importance yüksek ver: 1-100)

6. get_memories_by_category: { "tool": "get_memories_by_category", "params": { "category": "law_reference" } }
   → Belirli kategorideki tüm hafıza kayıtlarını getir

7. delegate_to_agent: { "tool": "delegate_to_agent", "params": { "agent": "miner_agent|content_agent", "task": "..." } }
   → Görevi başka ajana devret (pazar analizi → miner, içerik üretimi → content)

8. search_listings: { "tool": "search_listings", "params": { "query": "..." } }
   → Kendi portföyümüzde (listings) ilan ara

9. get_client_history: { "tool": "get_client_history", "params": { "query": "müşteri adı" } }
   → Müşteri iletişim geçmişini getir

10. navigate_admin: { "tool": "navigate_admin", "params": { "destination": "ayarlar" } }
    → Admin panelinde sayfa yönlendirmesi
`,
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

      // If no brackets found, it's not JSON
      return null;
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
   * Admin Assistant Chat (ReAct Loop)
   */
  async adminAssistantChat(
    messages: DeepSeekMessage[],
    context?: AgentContext,
    onProgress?: (step: {
      type: string;
      agent: string;
      content: string;
    }) => void,
  ): Promise<string> {
    const maxTurns = 15;
    let turn = 0;
    let currentMessages = [...messages];

    // Helper to emit progress
    const emit = (
      type: "thought" | "action" | "result",
      agent: string,
      content: string,
    ) => {
      if (onProgress) onProgress({ type, agent, content });
    };

    while (turn < maxTurns) {
      turn++;
      // 1. Get response from AI
      emit("thought", "Maestro", "Düşünüyor...");
      const response = await this.chat(
        "admin_assistant",
        currentMessages,
        context,
      );

      // 2. Check for tool calls
      let toolCall = this.safeJsonParse<any>(response);

      // Normalize AI variations (handle "actions" array or "args" field)
      if (toolCall) {
        if (
          toolCall.actions &&
          Array.isArray(toolCall.actions) &&
          toolCall.actions[0]
        ) {
          toolCall = toolCall.actions[0];
        }
        if (toolCall.args && !toolCall.params) {
          toolCall.params = toolCall.args;
        }
      }

      // If no valid tool call found, return response
      if (!toolCall || !toolCall.tool) {
        // Safety: If response contains JSON but failed structure, strip it to avoid showing raw JSON to user
        if (response.includes("```json") || response.trim().startsWith("{")) {
          emit("thought", "System", "Hatalı JSON formatı düzeltiliyor...");
          // Return only the text part if possible, or generic error
          return (
            response.replace(/```json[\s\S]*?```/g, "").trim() ||
            "İşlem yapılamadı (Teknik Hata: Geçersiz JSON Formatı). Lütfen tekrar deneyin."
          );
        }

        emit("thought", "Maestro", "Yanıt hazırlandı.");
        return response;
      }

      // 3. Execute Tool
      console.log(
        `[AdminAssistant] Executing tool: ${toolCall.tool}`,
        toolCall.params,
      );
      let toolResult: ToolResult = { success: false, error: "Unknown tool" };

      switch (toolCall.tool) {
        case "delegate_to_agent": {
          const { agent, task, context: extraContext } = toolCall.params;

          const targetAgentName =
            agent === "miner_agent"
              ? "Miner (Veri & Pazar)"
              : "Content (İçerik)";
          emit(
            "action",
            "Maestro",
            `${targetAgentName} ajanına görev devrediliyor: "${task.substring(0, 50)}..."`,
          );

          try {
            // Delegate logic
            let delegatedResponse = "";

            if (agent === "miner_agent") {
              emit("thought", "Miner Agent", "Veriler analiz ediliyor...");
              // Direct chat with miner agent
              delegatedResponse = await this.chat("miner_agent", [
                {
                  role: "user",
                  content: `(Sent by Maestro Admin) Task: ${task}\n\nContext: ${JSON.stringify(extraContext || {})}`,
                },
              ]);
              emit("result", "Miner Agent", "Analiz tamamlandı.");
            } else if (agent === "content_agent") {
              emit("thought", "Content Agent", "İçerik hazırlanıyor...");
              // Direct chat with content agent
              delegatedResponse = await this.chat("content_agent", [
                {
                  role: "user",
                  content: `(Sent by Maestro Admin) Task: ${task}\n\nContext: ${JSON.stringify(extraContext || {})}`,
                },
              ]);
              emit("result", "Content Agent", "İçerik üretildi.");
            } else {
              delegatedResponse = "Error: Invalid agent type.";
            }

            toolResult = {
              success: true,
              data: delegatedResponse,
              message: `[${agent}] Raporu:\n${delegatedResponse}`,
            };
          } catch (e: any) {
            toolResult = {
              success: false,
              error: `Delegation failed: ${e.message}`,
            };
            emit("result", "System", `Hata: ${e.message}`);
          }
          break;
        }

        case "web_research":
          emit(
            "action",
            "Maestro",
            `Web araştırması yapılıyor: "${toolCall.params.query}"`,
          );
          toolResult = await adminTools.webResearch(toolCall.params.query);
          emit("result", "Maestro", "Araştırma verileri alındı.");
          break;

        case "query_stats":
          emit(
            "action",
            "Maestro",
            "Veritabanı istatistikleri sorgulanıyor...",
          );
          toolResult = await adminTools.queryStats(
            toolCall.params.metric,
            toolCall.params.period,
          );
          break;
        case "search_listings":
          emit(
            "action",
            "Maestro",
            `Veritabanında ilan aranıyor: "${toolCall.params.query}"`,
          );
          toolResult = await adminTools.searchListings(toolCall.params.query);
          break;
        case "navigate_admin":
          emit(
            "action",
            "Maestro",
            `Navigasyon: ${toolCall.params.destination}`,
          );
          toolResult = adminTools.navigateAdmin(toolCall.params.destination);
          break;
        case "search_laws":
          emit("action", "Maestro", "Mevzuat taranıyor...");
          toolResult = await adminTools.searchLaws(toolCall.params.query);
          emit("result", "Maestro", "Mevzuat bilgisi bulundu.");
          break;
        case "search_memories":
          emit("action", "Maestro", "Hafıza kayıtları inceleniyor...");
          toolResult = await adminTools.searchMemories(
            toolCall.params.query,
            toolCall.params.category,
          );
          emit("result", "Maestro", "Hafıza taraması tamamlandı.");
          break;
        case "add_memory":
          emit("action", "Maestro", "Bilgi hafızaya kaydediliyor...");
          toolResult = await adminTools.addMemory(
            toolCall.params.content,
            toolCall.params.category,
            toolCall.params.tags || [],
            toolCall.params.importance || 50,
          );
          emit("result", "Maestro", "Hafızaya kaydedildi.");
          break;
        case "get_memories_by_category":
          emit(
            "action",
            "Maestro",
            `${toolCall.params.category} kategorisi getiriliyor...`,
          );
          toolResult = await adminTools.getMemoriesByCategory(
            toolCall.params.category,
          );
          break;
        case "get_client_history":
          emit("action", "Maestro", "Müşteri geçmişi getiriliyor...");
          toolResult = await adminTools.getClientHistory(toolCall.params.query);
          break;
        case "run_sql_query":
          emit("action", "Maestro", "SQL analizi çalıştırılıyor...");
          toolResult = await adminTools.runSqlQuery(toolCall.params.query);
          break;
        default:
          toolResult = {
            success: false,
            error: `Tool ${toolCall.tool} not found`,
          };
      }

      // 4. Append Tool Result to History
      // Add the assistant's specific tool call message
      currentMessages.push({ role: "assistant", content: response });

      // Add the tool output as a "system" or "user" message (DeepSeek might prefer User role for tool outputs if not training on specific Tool role)
      // We'll use "system" or explicit "Tool Output:" prefix in User role.
      currentMessages.push({
        role: "user",
        content: `Tool Output (${toolCall.tool}):\n${JSON.stringify(toolResult, null, 2)}\n\nBu veriyi kullanarak kullanıcıya doğal dilde, samimi bir yanıt ver. Asla JSON veya teknik detay gösterme.`,
      });

      turn++;
    }

    return "İşlem çok uzun sürdü, lütfen tekrar deneyin.";
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
      const { contextInfo, pageTitle, pageUrl, pageContent } =
        context.metadata as any;

      if (pageUrl || pageTitle) {
        prompt += `\n\nŞU ANKİ SAYFA BAĞLAMI (User's Current Page Context):
        - URL: ${pageUrl}
        - Başlık: ${pageTitle}
        ${pageContent ? `- Sayfa İçeriği Özeti: ${pageContent.substring(0, 500)}...` : ""}
        
        Kullanıcı "bu neresi", "bu sayfa", "burada ne var" gibi şeyler sorarsa yukarıdaki bağlamı kullan.`;
      }

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
