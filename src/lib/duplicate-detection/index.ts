/**
 * ULW Duplicate Detection System
 *
 * Gelişmiş duplicate ilan tespiti:
 * 1. Exact ID match (source_id)
 * 2. Fuzzy title match (pg_trgm ile %70+ benzerlik)
 * 3. Price + Location kombinasyonu
 * 4. Composite scoring
 */

import { db } from "@/db";
import { collectedListings } from "@/db/schema";
import { eq, and, ne, sql, isNull, or } from "drizzle-orm";

// Types
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateOf?: string;
  score: number;
  reason?: "exact_id" | "fuzzy_title" | "price_location" | "composite";
  matchedListing?: {
    id: string;
    sourceId: string;
    title: string;
    price: string | null;
    location: string | null;
  };
}

export interface DuplicateCandidate {
  id: string;
  sourceId: string;
  title: string;
  price: string | null;
  priceValue: number | null;
  location: string | null;
  city: string | null;
  district: string | null;
  similarity?: number;
}

export interface DuplicateCheckOptions {
  /** Fuzzy title benzerlik eşiği (0-1, default: 0.7) */
  titleThreshold?: number;
  /** Fiyat toleransı yüzdesi (default: 5) */
  priceTolerance?: number;
  /** Sadece aynı kategorideki ilanları kontrol et */
  sameCategory?: boolean;
  /** Sadece aynı işlem tipindeki ilanları kontrol et */
  sameTransactionType?: boolean;
  /** Kontrol edilecek maksimum aday sayısı */
  maxCandidates?: number;
}

const DEFAULT_OPTIONS: Required<DuplicateCheckOptions> = {
  titleThreshold: 0.7,
  priceTolerance: 5,
  sameCategory: true,
  sameTransactionType: true,
  maxCandidates: 100,
};

/**
 * Tek bir ilan için duplicate kontrolü yapar
 */
export async function checkDuplicate(
  listing: {
    sourceId: string;
    title: string;
    priceValue?: number | null;
    city?: string | null;
    district?: string | null;
    category?: string;
    transactionType?: string;
  },
  options: DuplicateCheckOptions = {}
): Promise<DuplicateCheckResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // 1. Exact ID match - en hızlı kontrol
  const exactMatch = await db
    .select({
      id: collectedListings.id,
      sourceId: collectedListings.sourceId,
      title: collectedListings.title,
      price: collectedListings.price,
      location: collectedListings.location,
    })
    .from(collectedListings)
    .where(
      and(
        eq(collectedListings.sourceId, listing.sourceId),
        ne(collectedListings.status, "duplicate")
      )
    )
    .limit(1);

  if (exactMatch.length > 0) {
    return {
      isDuplicate: true,
      duplicateOf: exactMatch[0].id,
      score: 100,
      reason: "exact_id",
      matchedListing: exactMatch[0],
    };
  }

  // 2. Fuzzy title match + price/location kontrolü
  const conditions = [
    ne(collectedListings.status, "duplicate"),
    isNull(collectedListings.duplicateOf),
  ];

  // Kategori filtresi
  if (opts.sameCategory && listing.category) {
    conditions.push(
      eq(
        collectedListings.category,
        listing.category as "konut" | "arsa" | "isyeri" | "bina"
      )
    );
  }

  // İşlem tipi filtresi
  if (opts.sameTransactionType && listing.transactionType) {
    conditions.push(
      eq(
        collectedListings.transactionType,
        listing.transactionType as
          | "satilik"
          | "kiralik"
          | "devren-satilik"
          | "devren-kiralik"
          | "kat-karsiligi"
      )
    );
  }

  // Lokasyon filtresi (varsa)
  if (listing.city) {
    conditions.push(eq(collectedListings.city, listing.city));
  }
  if (listing.district) {
    conditions.push(eq(collectedListings.district, listing.district));
  }

  // pg_trgm ile fuzzy title search
  const candidates = await db
    .select({
      id: collectedListings.id,
      sourceId: collectedListings.sourceId,
      title: collectedListings.title,
      price: collectedListings.price,
      priceValue: collectedListings.priceValue,
      location: collectedListings.location,
      city: collectedListings.city,
      district: collectedListings.district,
      similarity:
        sql<number>`similarity(${collectedListings.title}, ${listing.title})`.as(
          "similarity"
        ),
    })
    .from(collectedListings)
    .where(
      and(
        ...conditions,
        sql`similarity(${collectedListings.title}, ${listing.title}) > ${opts.titleThreshold}`
      )
    )
    .orderBy(sql`similarity(${collectedListings.title}, ${listing.title}) DESC`)
    .limit(opts.maxCandidates);

  if (candidates.length === 0) {
    return { isDuplicate: false, score: 0 };
  }

  // En iyi eşleşmeyi bul
  for (const candidate of candidates) {
    const titleScore = (candidate.similarity || 0) * 100;

    // Fiyat kontrolü
    let priceScore = 0;
    if (listing.priceValue && candidate.priceValue) {
      const priceDiff =
        Math.abs(
          (listing.priceValue - Number(candidate.priceValue)) /
            listing.priceValue
        ) * 100;
      if (priceDiff <= opts.priceTolerance) {
        priceScore = 100 - priceDiff * 2; // Fark arttıkça skor düşer
      }
    }

    // Lokasyon kontrolü
    let locationScore = 0;
    if (listing.city && candidate.city && listing.city === candidate.city) {
      locationScore += 30;
    }
    if (
      listing.district &&
      candidate.district &&
      listing.district === candidate.district
    ) {
      locationScore += 70;
    }

    // Composite score hesapla
    // Title: %50, Price: %30, Location: %20
    const compositeScore =
      titleScore * 0.5 + priceScore * 0.3 + locationScore * 0.2;

    // Yüksek title benzerliği (%85+) tek başına yeterli
    if (titleScore >= 85) {
      return {
        isDuplicate: true,
        duplicateOf: candidate.id,
        score: Math.round(titleScore),
        reason: "fuzzy_title",
        matchedListing: {
          id: candidate.id,
          sourceId: candidate.sourceId,
          title: candidate.title,
          price: candidate.price,
          location: candidate.location,
        },
      };
    }

    // Fiyat + lokasyon eşleşmesi ile orta title benzerliği
    if (titleScore >= 70 && priceScore >= 80 && locationScore >= 70) {
      return {
        isDuplicate: true,
        duplicateOf: candidate.id,
        score: Math.round(compositeScore),
        reason: "composite",
        matchedListing: {
          id: candidate.id,
          sourceId: candidate.sourceId,
          title: candidate.title,
          price: candidate.price,
          location: candidate.location,
        },
      };
    }

    // Aynı fiyat + aynı lokasyon (farklı başlık olsa bile)
    if (priceScore >= 95 && locationScore >= 100 && titleScore >= 50) {
      return {
        isDuplicate: true,
        duplicateOf: candidate.id,
        score: Math.round(compositeScore),
        reason: "price_location",
        matchedListing: {
          id: candidate.id,
          sourceId: candidate.sourceId,
          title: candidate.title,
          price: candidate.price,
          location: candidate.location,
        },
      };
    }
  }

  // En yüksek skorlu adayı döndür (duplicate değilse bile)
  const bestCandidate = candidates[0];
  const bestScore =
    (bestCandidate.similarity || 0) * 100 * 0.5 +
    (listing.priceValue && bestCandidate.priceValue
      ? Math.max(
          0,
          100 -
            Math.abs(
              (listing.priceValue - Number(bestCandidate.priceValue)) /
                listing.priceValue
            ) *
              100 *
              2
        ) * 0.3
      : 0);

  return {
    isDuplicate: false,
    score: Math.round(bestScore),
  };
}

/**
 * Bir ilanı duplicate olarak işaretler
 */
export async function markAsDuplicate(
  listingId: string,
  duplicateOf: string,
  score: number,
  reason: string
): Promise<void> {
  await db
    .update(collectedListings)
    .set({
      status: "duplicate",
      duplicateOf,
      duplicateScore: String(score),
      duplicateReason: reason,
      processedAt: new Date(),
    })
    .where(eq(collectedListings.id, listingId));
}

/**
 * Toplu duplicate taraması yapar
 */
export async function scanForDuplicates(
  options: DuplicateCheckOptions & {
    /** Sadece belirli bir tarihten sonra eklenen ilanları tara */
    since?: Date;
    /** Dry run - değişiklik yapmadan sadece raporla */
    dryRun?: boolean;
    /** İşlem callback'i */
    onProgress?: (processed: number, found: number) => void;
  } = {}
): Promise<{
  scanned: number;
  duplicatesFound: number;
  duplicates: Array<{
    id: string;
    sourceId: string;
    title: string;
    duplicateOf: string;
    score: number;
    reason: string;
  }>;
}> {
  const { since, dryRun = false, onProgress, ...checkOptions } = options;

  // Taranacak ilanları al
  const conditions = [
    ne(collectedListings.status, "duplicate"),
    isNull(collectedListings.duplicateOf),
  ];

  if (since) {
    conditions.push(sql`${collectedListings.crawledAt} >= ${since}`);
  }

  const listings = await db
    .select({
      id: collectedListings.id,
      sourceId: collectedListings.sourceId,
      title: collectedListings.title,
      priceValue: collectedListings.priceValue,
      city: collectedListings.city,
      district: collectedListings.district,
      category: collectedListings.category,
      transactionType: collectedListings.transactionType,
    })
    .from(collectedListings)
    .where(and(...conditions))
    .orderBy(sql`${collectedListings.crawledAt} ASC`);

  const duplicates: Array<{
    id: string;
    sourceId: string;
    title: string;
    duplicateOf: string;
    score: number;
    reason: string;
  }> = [];

  let processed = 0;

  for (const listing of listings) {
    const result = await checkDuplicate(
      {
        sourceId: listing.sourceId,
        title: listing.title,
        priceValue: listing.priceValue ? Number(listing.priceValue) : null,
        city: listing.city,
        district: listing.district,
        category: listing.category,
        transactionType: listing.transactionType,
      },
      checkOptions
    );

    if (result.isDuplicate && result.duplicateOf && result.reason) {
      duplicates.push({
        id: listing.id,
        sourceId: listing.sourceId,
        title: listing.title,
        duplicateOf: result.duplicateOf,
        score: result.score,
        reason: result.reason,
      });

      if (!dryRun) {
        await markAsDuplicate(
          listing.id,
          result.duplicateOf,
          result.score,
          result.reason
        );
      }
    }

    processed++;
    if (onProgress && processed % 10 === 0) {
      onProgress(processed, duplicates.length);
    }
  }

  return {
    scanned: listings.length,
    duplicatesFound: duplicates.length,
    duplicates,
  };
}

/**
 * Duplicate istatistiklerini döndürür
 */
export async function getDuplicateStats(): Promise<{
  total: number;
  duplicates: number;
  byReason: Record<string, number>;
  recentDuplicates: Array<{
    id: string;
    title: string;
    duplicateOf: string;
    score: number;
    reason: string;
  }>;
}> {
  // Toplam ve duplicate sayısı
  const counts = await db
    .select({
      status: collectedListings.status,
      count: sql<number>`count(*)`,
    })
    .from(collectedListings)
    .groupBy(collectedListings.status);

  const total = counts.reduce((sum, c) => sum + Number(c.count), 0);
  const duplicates = counts.find((c) => c.status === "duplicate")?.count || 0;

  // Reason bazında dağılım
  const byReasonResult = await db
    .select({
      reason: collectedListings.duplicateReason,
      count: sql<number>`count(*)`,
    })
    .from(collectedListings)
    .where(eq(collectedListings.status, "duplicate"))
    .groupBy(collectedListings.duplicateReason);

  const byReason: Record<string, number> = {};
  for (const r of byReasonResult) {
    if (r.reason) {
      byReason[r.reason] = Number(r.count);
    }
  }

  // Son duplicate'ler
  const recentDuplicates = await db
    .select({
      id: collectedListings.id,
      title: collectedListings.title,
      duplicateOf: collectedListings.duplicateOf,
      score: collectedListings.duplicateScore,
      reason: collectedListings.duplicateReason,
    })
    .from(collectedListings)
    .where(eq(collectedListings.status, "duplicate"))
    .orderBy(sql`${collectedListings.processedAt} DESC`)
    .limit(10);

  return {
    total,
    duplicates: Number(duplicates),
    byReason,
    recentDuplicates: recentDuplicates.map((d) => ({
      id: d.id,
      title: d.title,
      duplicateOf: d.duplicateOf || "",
      score: Number(d.score) || 0,
      reason: d.reason || "",
    })),
  };
}
