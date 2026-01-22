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
   * Law Search (RAG Stub)
   */
  async searchLaws(query: string): Promise<ToolResult> {
    // In future: Use vector search on 'ai_memory' where type='law_reference'
    // For now: Return general advice based on keywords

    if (query.includes("komisyon")) {
      return {
        success: true,
        message:
          "Taşınmaz Ticareti Yönetmeliği'ne göre alım satım işlemlerinde hizmet bedeli, satış bedelinin KDV hariç %4'ünden fazla olamaz. (Yüzde 2 satıcı, yüzde 2 alıcı şeklinde uygulanır).",
      };
    }

    if (query.includes("yetki") || query.includes("sözleşme")) {
      return {
        success: true,
        message:
          "Taşınmaz gösteren veya pazarlayan işletmelerin Yetki Belgesi alması zorunludur. Sözleşmeler yazılı yapılmalı ve bir nüshası müşteriye verilmelidir.",
      };
    }

    return {
      success: true,
      message:
        "Bu konuda mevzuatta özel bir madde bulamadım ancak Borçlar Kanunu genel hükümlerine bakılabilir.",
    };
  }

  /**
   * Search Long Term Memory
   */
  async searchMemories(query: string): Promise<ToolResult> {
    try {
      const results = await db
        .select()
        .from(aiMemory)
        .where(
          and(
            eq(aiMemory.memoryType, "long_term"),
            ilike(aiMemory.content, `%${query}%`),
          ),
        )
        .limit(3);

      if (results.length === 0)
        return { success: true, message: "İlgili bir hatıra bulunamadı." };

      const summary = results
        .map((r) => `- ${r.content} (${r.category})`)
        .join("\n");
      return {
        success: true,
        data: results,
        message: `Hatırladıklarım:\n${summary}`,
      };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Add to Memory
   */
  async addMemory(
    content: string,
    category: string = "general",
  ): Promise<ToolResult> {
    try {
      await db.insert(aiMemory).values({
        memoryType: "long_term",
        category,
        content,
      });
      return { success: true, message: "Bilgi hafızaya kaydedildi." };
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
