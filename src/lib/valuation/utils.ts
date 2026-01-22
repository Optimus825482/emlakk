/**
 * Mahalle isimlerini standartlaştırır
 * "Dereköy Mh." → "dereköy"
 * "Yeni Mahallesi" → "yeni"
 * "Merkez Mah." → "merkez"
 */
export function normalizeMahalle(mahalle: string | null | undefined): string {
  if (!mahalle) return "";

  return mahalle
    .toLowerCase()
    .trim()
    .replace(/\s*mahallesi\s*$/gi, "")
    .replace(/\s*mahalle\s*$/gi, "")
    .replace(/\s*mah\.?\s*$/gi, "")
    .replace(/\s*mh\.?\s*$/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * İki mahalle isminin eşleşip eşleşmediğini kontrol eder
 * Fuzzy matching: Biri diğerini içeriyorsa eşleşir
 */
export function mahalleMatches(
  mahalle1: string | null | undefined,
  mahalle2: string | null | undefined
): { match: boolean; type: "exact" | "partial" | "none" } {
  const norm1 = normalizeMahalle(mahalle1);
  const norm2 = normalizeMahalle(mahalle2);

  if (!norm1 || !norm2) {
    return { match: false, type: "none" };
  }

  if (norm1 === norm2) {
    return { match: true, type: "exact" };
  }

  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    return { match: true, type: "partial" };
  }

  const words1 = norm1.split(" ").filter((w) => w.length > 2);
  const words2 = norm2.split(" ").filter((w) => w.length > 2);
  const hasCommonWord = words1.some((w1) =>
    words2.some((w2) => w1 === w2 || w1.includes(w2) || w2.includes(w1))
  );

  if (hasCommonWord) {
    return { match: true, type: "partial" };
  }

  return { match: false, type: "none" };
}

/**
 * SQL için mahalle pattern'leri oluşturur (ILIKE için)
 * Örnek: "Dereköy Mh." → ["dereköy", "dereköy mh", "dereköy mahallesi"]
 */
export function getMahallePatterns(mahalle: string | null | undefined): string[] {
  if (!mahalle) return [];

  const normalized = normalizeMahalle(mahalle);
  if (!normalized) return [];

  return [
    normalized,
    `${normalized} mh`,
    `${normalized} mah`,
    `${normalized} mahallesi`,
  ];
}

/**
 * İlçe isimlerini standartlaştırır (büyük/küçük harf farkını giderir)
 */
export function normalizeIlce(ilce: string | null | undefined): string {
  if (!ilce) return "";
  return ilce.toLowerCase().trim();
}

/**
 * İki ilçe isminin eşleşip eşleşmediğini kontrol eder
 */
export function ilceMatches(
  ilce1: string | null | undefined,
  ilce2: string | null | undefined
): boolean {
  return normalizeIlce(ilce1) === normalizeIlce(ilce2);
}
