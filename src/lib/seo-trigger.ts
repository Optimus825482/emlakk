/**
 * SEO Trigger - İçerik eklendiğinde/güncellendiğinde otomatik SEO oluşturma
 * NOT: Workflow sistemi kaldırıldı. Bu fonksiyonlar artık hiçbir şey yapmıyor.
 * Geriye dönük uyumluluk için bırakıldı.
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
 * NOT: Workflow sistemi kaldırıldı, bu fonksiyon artık hiçbir şey yapmıyor
 */
export function triggerSeoGeneration(input: SeoTriggerInput): void {
  // No-op: Workflow sistemi kaldırıldı
  console.log(
    `[DEPRECATED] SEO generation ignored for ${input.entityType}:${input.entityId}`,
  );
}

/**
 * Toplu SEO oluşturma - Tüm içerikler için SEO oluştur
 * NOT: Workflow sistemi kaldırıldı, bu fonksiyon artık hiçbir şey yapmıyor
 */
export async function triggerBulkSeoGeneration(
  entityType: "page" | "listing" | "blog",
): Promise<{ triggered: number; errors: number }> {
  // No-op: Workflow sistemi kaldırıldı
  console.log(`[DEPRECATED] Bulk SEO generation ignored for ${entityType}`);
  return { triggered: 0, errors: 0 };
}
