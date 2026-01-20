/**
 * SEO Trigger - İçerik eklendiğinde/güncellendiğinde otomatik SEO oluşturma
 */

interface SeoTriggerInput {
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

/**
 * Arka planda SEO oluşturma işlemini tetikler
 * Non-blocking - ana işlemi bekletmez
 */
export function triggerSeoGeneration(input: SeoTriggerInput): void {
  // Async olarak çalıştır, ana işlemi bloklamadan
  setImmediate(async () => {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      await fetch(`${baseUrl}/api/seo/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      console.log(`[SEO] Triggered for ${input.entityType}:${input.entityId}`);
    } catch (error) {
      console.error("[SEO] Trigger failed:", error);
    }
  });
}

/**
 * Toplu SEO oluşturma - Tüm içerikler için SEO oluştur
 */
export async function triggerBulkSeoGeneration(
  entityType: "page" | "listing" | "blog"
): Promise<{ triggered: number; errors: number }> {
  let triggered = 0;
  let errors = 0;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // İlgili içerikleri getir
    const response = await fetch(
      `${baseUrl}/api/${
        entityType === "listing" ? "listings" : entityType
      }s?limit=100`
    );

    if (!response.ok) {
      throw new Error("İçerikler alınamadı");
    }

    const { data } = await response.json();

    for (const item of data) {
      try {
        await fetch(`${baseUrl}/api/seo/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityType,
            entityId: item.id || item.slug,
            title: item.title || item.name,
            content: item.description || item.content || item.title,
            location: item.address || item.location,
            category: item.type || item.category,
            price: item.price,
            features: item.features,
          }),
        });
        triggered++;
      } catch {
        errors++;
      }
    }
  } catch (error) {
    console.error("[SEO] Bulk trigger failed:", error);
  }

  return { triggered, errors };
}
