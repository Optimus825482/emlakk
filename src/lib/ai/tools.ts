import { db } from "@/db";
import { listings, contacts, aiMemory } from "@/db/schema";
import { eq, count, desc, like, ilike, and, gte, lte, sql } from "drizzle-orm";

export type AdminToolType =
  | "query_stats"
  | "search_listings"
  | "search_contacts"
  | "navigate_admin"
  | "search_laws"
  | "search_memories"
  | "add_memory"
  | "search_memories"
  | "add_memory"
  | "get_client_history"
  | "run_sql_query"
  | "delegate_to_agent"
  | "web_research";

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export class AdminTools {
  /**
   * Get basic statistics about the system
   */
  async queryStats(
    metric: "listings" | "contacts" | "sales",
    period: "all" | "month" | "week" = "all",
  ): Promise<ToolResult> {
    try {
      if (metric === "listings") {
        const total = await db.select({ count: count() }).from(listings);
        const active = await db
          .select({ count: count() })
          .from(listings)
          .where(eq(listings.status, "active"));
        const sold = await db
          .select({ count: count() })
          .from(listings)
          .where(eq(listings.status, "sold"));

        return {
          success: true,
          data: {
            total: total[0].count,
            active: active[0].count,
            sold: sold[0].count,
          },
          message: `Toplam ${total[0].count} ilan var. ${active[0].count} aktif, ${sold[0].count} satıldı.`,
        };
      }

      if (metric === "contacts") {
        const newContacts = await db
          .select({ count: count() })
          .from(contacts)
          .where(eq(contacts.status, "new"));
        return {
          success: true,
          data: { new: newContacts[0].count },
          message: `${newContacts[0].count} yeni mesajınız var.`,
        };
      }

      return { success: false, error: "Metrik desteklenmiyor." };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Search for listings based on criteria
   */
  async searchListings(query: string): Promise<ToolResult> {
    try {
      // Logic for searching listings
      const results = await db
        .select({
          title: listings.title,
          price: listings.price,
          city: listings.city,
          type: listings.type,
          status: listings.status,
        })
        .from(listings)
        .where(ilike(listings.title, `%${query}%`))
        .limit(5);

      if (results.length === 0) {
        return { success: true, message: "Hiçbir ilan bulunamadı." };
      }

      const summary = results
        .map(
          (l) =>
            `- ${l.title} (${Number(l.price).toLocaleString()} TL) [${l.status}]`,
        )
        .join("\n");
      return {
        success: true,
        data: results,
        message: `Bulunan ilanlar:\n${summary}`,
      };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Navigate command - maps intent to URL
   */
  navigateAdmin(destination: string): ToolResult {
    const minDest = destination.toLowerCase();
    let path = "/admin";
    let label = "Admin Paneli";

    if (minDest.includes("ayar")) {
      path = "/admin/settings";
      label = "Ayarlar";
    } else if (minDest.includes("ilan")) {
      path = "/admin/listings";
      label = "İlanlar";
    } else if (minDest.includes("mesaj") || minDest.includes("iletişim")) {
      path = "/admin/contacts";
      label = "Mesajlar";
    } else if (minDest.includes("analiz") || minDest.includes("pazar")) {
      path = "/admin/sahibinden-inceleme";
      label = "Pazar Analizi";
    } else if (minDest.includes("seo")) {
      path = "/admin/seo";
      label = "SEO Yönetimi";
    }

    return {
      success: true,
      data: { path },
      message: `${label} sayfasına yönlendiriyorum.`,
    };
  }

  /**
   * Law Search (Enhanced with RAG + Knowledge Base)
   */
  async searchLaws(query: string): Promise<ToolResult> {
    try {
      // 1. First check ai_memory for stored law references
      const memoryResults = await db
        .select()
        .from(aiMemory)
        .where(
          and(
            eq(aiMemory.memoryType, "law_reference"),
            ilike(aiMemory.content, `%${query}%`),
          ),
        )
        .limit(3);

      if (memoryResults.length > 0) {
        const summary = memoryResults
          .map((r) => `📜 ${r.content}`)
          .join("\n\n");
        return {
          success: true,
          data: memoryResults,
          message: `Bilgi Tabanından Mevzuat:\n${summary}`,
        };
      }

      // 2. Keyword-based law reference (built-in knowledge)
      const lawKnowledge: Record<string, string> = {
        komisyon: `📜 **Taşınmaz Ticareti Yönetmeliği (Madde 20)**
Alım satım işlemlerinde hizmet bedeli, satış bedelinin KDV hariç %4'ünden fazla olamaz.
- Satıcıdan: %2
- Alıcıdan: %2
- Bu oran tarafların anlaşmasıyla azaltılabilir ancak artırılamaz.`,

        yetki: `📜 **Taşınmaz Ticareti Yönetmeliği (Madde 6)**
Taşınmaz ticareti yapan işletmelerin Yetki Belgesi alması zorunludur.
- Yetki belgesi 5 yıl geçerlidir.
- Belgesiz faaliyet cezai yaptırım gerektirir.`,

        sözleşme: `📜 **Taşınmaz Ticareti Yönetmeliği (Madde 11-13)**
- Sözleşmeler yazılı yapılmalıdır.
- En az 2 nüsha düzenlenmeli, bir nüshası müşteriye verilmelidir.
- Sözleşmede taşınmazın tüm özellikleri ve bedeli açıkça belirtilmelidir.`,

        tapu: `📜 **Tapu Kanunu (Madde 26)**
Tapu sicili alenidir. Herkes tapu kütüğünü inceleyebilir.
- Tapu harçları alım satım bedelinin %4'üdür (alıcı ve satıcıdan %2'şer).
- 2024 itibariyle konut satışlarında %2 tapu harcı uygulanmaktadır.`,

        kira: `📜 **Türk Borçlar Kanunu (Madde 339-356)**
- Kira sözleşmeleri yazılı yapılmalıdır.
- Depozito en fazla 3 aylık kira tutarı olabilir.
- Kira artışı bir önceki yılın TÜFE oranını geçemez (konut için).
- Kiracı, kira bedelini ödemezse en az 30 gün süre verilerek ihtar çekilmelidir.`,

        imar: `📜 **İmar Kanunu (3194 Sayılı)**
- Yapı ruhsatı olmadan inşaat yapılamaz.
- İmar planına aykırı yapılar yıkım kararına tabidir.
- Kat karşılığı inşaat sözleşmeleri noterde yapılmalıdır.`,

        vergi: `📜 **Emlak Vergisi Kanunu**
- Konutlar için binde 1 (büyükşehirlerde binde 2)
- Arsalar için binde 3 (büyükşehirlerde binde 6)
- İşyerleri için binde 2 (büyükşehirlerde binde 4)
Vergi, taşınmazın emlak beyan değeri üzerinden hesaplanır.`,

        vekalet: `📜 **Noterlik Kanunu**
Gayrimenkul alım satımı için verilen vekaletnameler:
- Noterde düzenlenmelidir.
- Özel yetki içermelidir.
- Taşınmazın ada/parsel bilgileri belirtilmelidir.`,

        kat: `📜 **Kat Mülkiyeti Kanunu (634 Sayılı)**
- Ortak alanların kullanımı tüm kat maliklerinin rızasına tabidir.
- Aidat ödemeyenler aleyhine icra takibi başlatılabilir.
- Yönetim planı değişikliği 4/5 çoğunluk gerektirir.`,

        miras: `📜 **Türk Medeni Kanunu - Miras Hukuku (Madde 495-682)**
**Yasal Mirasçılar:**
- 1. Zümre: Altsoy (çocuklar, torunlar)
- 2. Zümre: Ana-baba ve kardeşler
- 3. Zümre: Büyükanne-büyükbaba

**Saklı Pay Oranları:**
- Altsoy için: Yasal miras payının 1/2'si
- Ana-baba için: Yasal miras payının 1/4'ü
- Sağ kalan eş için: Yasal miras payının tamamı

**Eşin Miras Payı:**
- Altsoy ile birlikte: 1/4
- Ana-baba zümresi ile: 1/2
- Büyükanne-büyükbaba zümresi ile: 3/4
- Hiç mirasçı yoksa: Tamamı

**Gayrimenkul Mirası:**
- Tapu intikali için veraset ilamı gerekir.
- Veraset ve intikal vergisi ödenir.
- Mirasçılar anlaşamazsa ortaklığın giderilmesi davası açılabilir.`,

        medeni: `📜 **Türk Medeni Kanunu (4721 Sayılı)**
**Gayrimenkul ile İlgili Hükümler:**

**Ayni Haklar (Madde 683-778):**
- Mülkiyet hakkı tapu siciline tescil ile kazanılır.
- İntifa hakkı, oturma hakkı, üst hakkı gibi sınırlı ayni haklar kurulabilir.

**Eşler Arası Mal Rejimi (Madde 202-281):**
- Edinilmiş mallara katılma rejimi (yasal rejim)
- Evlilik birliği içinde edinilen taşınmazlar ortak maldır.
- Boşanmada değer artış payı hesaplanır.

**Vesayet ve Kayyımlık:**
- Kısıtlı kişilerin taşınmazları için mahkeme izni gerekir.
- Kayyım atanan kişilerin gayrimenkulleri satılamaz (izinsiz).

**Vakıf ve Dernek Taşınmazları:**
- Vakıf taşınmazlarının satışı özel kurallara tabidir.
- Dernek taşınmazları yönetim kurulu kararıyla işlem görür.`,

        veraset: `📜 **Veraset ve İntikal Vergisi Kanunu**
**Vergi Oranları (2024):**
- İlk 1.100.000 TL için: %1
- Sonraki 2.600.000 TL için: %3
- Sonraki 5.500.000 TL için: %5
- Sonraki 10.900.000 TL için: %7
- Fazlası için: %10

**İstisnalar:**
- Eş ve çocuklara intikal eden konutun 1.100.000 TL'si vergiden muaf.
- İvazsız intikallerde (bağış) oran 2 kat uygulanır.

**Süre:**
- Beyanname ölümden itibaren 4 ay içinde verilmelidir.
- Yurt dışında ölüm halinde 6 ay.`,

        ortaklık: `📜 **Ortaklığın Giderilmesi (İzale-i Şüyu)**
**Türk Medeni Kanunu (Madde 698-699)**
- Paydaşlardan her biri ortaklığın giderilmesini isteyebilir.
- Mahkeme, malın aynen taksimini tercih eder.
- Aynen taksim mümkün değilse satış yoluyla ortaklık giderilir.

**Satış Yöntemi:**
- Açık artırma ile satış yapılır.
- Paydaşlar da ihaleye katılabilir.
- Satış bedeli paylar oranında dağıtılır.

**Önemli Notlar:**
- Elbirliği mülkiyetinde tüm mirasçıların davaya dahil edilmesi gerekir.
- Hisse satışı diğer paydaşlara önalım hakkı doğurur.`,
      };

      // Find matching law
      const queryLower = query.toLowerCase();
      for (const [keyword, lawText] of Object.entries(lawKnowledge)) {
        if (queryLower.includes(keyword)) {
          // Store in memory for future reference
          await this.addMemory(lawText, "law_reference");
          return {
            success: true,
            message: lawText,
          };
        }
      }

      // 3. If no match, try web research for legal info
      const webResult = await this.webResearch(
        `Türkiye emlak mevzuat ${query} kanun yönetmelik`,
      );
      if (webResult.success && webResult.message) {
        return {
          success: true,
          message: `Web Araştırması Sonucu:\n${webResult.message}\n\n⚠️ Bu bilgi güncel mevzuatla doğrulanmalıdır.`,
        };
      }

      return {
        success: true,
        message: `Bu konuda hazır mevzuat bilgisi bulunamadı. Genel hükümler için:
- Borçlar Kanunu (Kira, Satış sözleşmeleri)
- Taşınmaz Ticareti Yönetmeliği
- İmar Kanunu
- Kat Mülkiyeti Kanunu
incelenebilir.`,
      };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Search Long Term Memory (Enhanced with categories)
   */
  async searchMemories(query: string, category?: string): Promise<ToolResult> {
    try {
      // Build query conditions
      const conditions = [ilike(aiMemory.content, `%${query}%`)];

      if (category) {
        conditions.push(eq(aiMemory.category, category));
      }

      const results = await db
        .select()
        .from(aiMemory)
        .where(and(...conditions))
        .orderBy(desc(aiMemory.importanceScore), desc(aiMemory.createdAt))
        .limit(5);

      if (results.length === 0) {
        return {
          success: true,
          message: "İlgili bir hafıza kaydı bulunamadı.",
        };
      }

      const summary = results
        .map(
          (r) =>
            `📝 [${r.category || "genel"}] ${r.content}${r.tags && r.tags.length > 0 ? ` (Etiketler: ${r.tags.join(", ")})` : ""}`,
        )
        .join("\n\n");

      // Update access count
      for (const r of results) {
        await db
          .update(aiMemory)
          .set({
            accessCount: (r.accessCount || 0) + 1,
            lastAccessedAt: new Date(),
          })
          .where(eq(aiMemory.id, r.id));
      }

      return {
        success: true,
        data: results,
        message: `Hafızadan ${results.length} kayıt bulundu:\n\n${summary}`,
      };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Add to Memory (Enhanced with metadata)
   */
  async addMemory(
    content: string,
    category: string = "general",
    tags: string[] = [],
    importanceScore: number = 50,
  ): Promise<ToolResult> {
    try {
      // Check for duplicate
      const existing = await db
        .select()
        .from(aiMemory)
        .where(eq(aiMemory.content, content))
        .limit(1);

      if (existing.length > 0) {
        // Update importance if already exists
        await db
          .update(aiMemory)
          .set({
            importanceScore: Math.min(
              100,
              (existing[0].importanceScore || 50) + 10,
            ),
            accessCount: (existing[0].accessCount || 0) + 1,
            lastAccessedAt: new Date(),
          })
          .where(eq(aiMemory.id, existing[0].id));

        return {
          success: true,
          message: "Bu bilgi zaten hafızada var, önemi artırıldı.",
        };
      }

      // Determine memory type based on category
      let memoryType = "long_term";
      if (category === "law_reference") memoryType = "law_reference";
      else if (category === "client_preference")
        memoryType = "client_preference";
      else if (category === "market_insight") memoryType = "market_insight";

      await db.insert(aiMemory).values({
        memoryType,
        category,
        content,
        tags,
        importanceScore,
      });

      return {
        success: true,
        message: `✅ Bilgi hafızaya kaydedildi. Kategori: ${category}, Önem: ${importanceScore}/100`,
      };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Get memories by category
   */
  async getMemoriesByCategory(category: string): Promise<ToolResult> {
    try {
      const results = await db
        .select()
        .from(aiMemory)
        .where(eq(aiMemory.category, category))
        .orderBy(desc(aiMemory.importanceScore))
        .limit(10);

      if (results.length === 0) {
        return {
          success: true,
          message: `"${category}" kategorisinde kayıt bulunamadı.`,
        };
      }

      const summary = results
        .map((r) => `- ${r.content.substring(0, 100)}...`)
        .join("\n");

      return {
        success: true,
        data: results,
        message: `${category} kategorisinde ${results.length} kayıt:\n${summary}`,
      };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Client History
   */
  async getClientHistory(query: string): Promise<ToolResult> {
    try {
      const results = await db
        .select()
        .from(contacts)
        .where(ilike(contacts.name, `%${query}%`))
        .orderBy(desc(contacts.createdAt))
        .limit(5);

      if (results.length === 0)
        return { success: true, message: "Müşteri bulunamadı." };

      const summary = results
        .map(
          (c) =>
            `- ${c.name} (${c.createdAt.toLocaleDateString()}): ${c.message.substring(0, 50)}...`,
        )
        .join("\n");
      return {
        success: true,
        data: results,
        message: `Müşteri Geçmişi:\n${summary}`,
      };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Native Safe SQL Sandbox
   * Allows the AI to run READ-ONLY queries on the database.
   */
  async runSqlQuery(query: string): Promise<ToolResult> {
    try {
      const normalizedQuery = query.trim().toLowerCase();

      // 1. Safety Filter (Strict Read-Only)
      if (!normalizedQuery.startsWith("select")) {
        // Allow 'with' for CTEs, but check logic
        if (!normalizedQuery.startsWith("with")) {
          return {
            success: false,
            error:
              "GÜVENLİK UYARISI: Sadece 'SELECT' sorguları çalıştırılabilir. Veri değiştirme girişimleri engellendi.",
          };
        }
      }

      // Block dangerous keywords
      const dangerousKeywords = [
        "drop",
        "delete",
        "update",
        "insert",
        "alter",
        "truncate",
        "grant",
        "execute",
      ];
      const foundKeywords = dangerousKeywords.filter((w) =>
        normalizedQuery.match(new RegExp(`\\b${w}\\b`)),
      );

      if (foundKeywords.length > 0) {
        return {
          success: false,
          error: `GÜVENLİK UYARISI: Yasaklı komutlar tespit edildi: ${foundKeywords.join(", ")}`,
        };
      }

      // 2. Limit Enforcement (Performance)
      let finalQuery = query;
      if (!normalizedQuery.includes("limit")) {
        finalQuery += " LIMIT 20";
      }

      // 3. Execute
      const result = await db.execute(sql.raw(finalQuery));

      if (result.length === 0) {
        return {
          success: true,
          message: "Sorgu çalıştı ancak sonuç dönmedi (0 satır).",
        };
      }

      return {
        success: true,
        data: result,
        message: `Sorgu başarıyla çalıştırıldı. ${result.length} satır getirildi.`,
      };
    } catch (e: any) {
      return { success: false, error: `SQL Hatası: ${e.message}` };
    }
  }

  /**
   * Web Research using Tavily (or similar)
   */
  async webResearch(query: string): Promise<ToolResult> {
    try {
      const apiKey = process.env.TAVILY_API_KEY;
      if (!apiKey) {
        return {
          success: false,
          error: "TAVILY_API_KEY not configured. Web research disallowed.",
        };
      }

      // Simple fetch implementation for Tavily API
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query: query,
          search_depth: "basic",
          include_answer: true,
          max_results: 3,
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily API responded with ${response.status}`);
      }

      const data = await response.json();
      const summary =
        data.answer ||
        data.results.map((r: any) => `- ${r.title}: ${r.content}`).join("\n");

      return {
        success: true,
        data: data,
        message: `Web Araştırma Sonucu:\n${summary}`,
      };
    } catch (e: any) {
      return { success: false, error: `Web Research Failed: ${e.message}` };
    }
  }
}

export const adminTools = new AdminTools();
