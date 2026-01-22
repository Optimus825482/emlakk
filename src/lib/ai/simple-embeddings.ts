/**
 * Simple Keyword-Based Embedding (Final Fallback)
 * No API required, always works
 */

export interface SimpleEmbeddingProvider {
  name: string;
  dimensions: number;
  isAvailable(): Promise<boolean>;
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

/**
 * Simple keyword-based embedding using TF-IDF-like approach
 * This is a last-resort fallback when all API providers fail
 */
export class SimpleKeywordEmbedding implements SimpleEmbeddingProvider {
  name = "simple-keyword";
  dimensions = 384; // Match HuggingFace dimensions for compatibility

  // Common Turkish words to use as features
  private readonly vocabulary = [
    // Real estate terms
    "ilan",
    "satılık",
    "kiralık",
    "daire",
    "ev",
    "arsa",
    "ticari",
    "konut",
    "ofis",
    "fiyat",
    "metrekare",
    "oda",
    "salon",
    "banyo",
    "balkon",
    "kat",
    "bina",
    "site",
    "lokasyon",
    "adres",
    // Location terms
    "hendek",
    "adapazarı",
    "sakarya",
    "mahalle",
    "sokak",
    "cadde",
    "merkez",
    "şehir",
    // Property features
    "yeni",
    "eski",
    "lüks",
    "geniş",
    "küçük",
    "büyük",
    "modern",
    "klasik",
    "güvenlik",
    "otopark",
    "asansör",
    "havuz",
    "bahçe",
    // Actions
    "sat",
    "kirala",
    "ara",
    "bul",
    "göster",
    "listele",
    "filtre",
    "sırala",
    // Status
    "aktif",
    "pasif",
    "satıldı",
    "kiralandı",
    "beklemede",
    // Numbers (as words)
    "bir",
    "iki",
    "üç",
    "dört",
    "beş",
    "altı",
    "yedi",
    "sekiz",
    "dokuz",
    "on",
    // Common words
    "var",
    "yok",
    "kaç",
    "ne",
    "nasıl",
    "nerede",
    "kim",
    "hangi",
    "toplam",
    "sayı",
    "liste",
    "rapor",
    "analiz",
    "istatistik",
    "veri",
    "bilgi",
    "sistem",
    "kullanıcı",
    "admin",
    "yönetim",
  ];

  async isAvailable(): Promise<boolean> {
    return true; // Always available
  }

  /**
   * Generate simple embedding based on keyword presence
   */
  async embed(text: string): Promise<number[]> {
    const normalized = text.toLowerCase().trim();
    const words = normalized.split(/\s+/);

    // Create embedding vector
    const embedding = new Array(this.dimensions).fill(0);

    // First 100 dimensions: vocabulary matching
    this.vocabulary.forEach((keyword, index) => {
      if (index < 100) {
        const count = words.filter((w) => w.includes(keyword)).length;
        embedding[index] = count > 0 ? Math.min(count / words.length, 1) : 0;
      }
    });

    // Next 100 dimensions: character n-grams (2-grams)
    const bigrams = this.extractBigrams(normalized);
    bigrams.forEach((bigram, index) => {
      if (index < 100) {
        embedding[100 + index] = bigram.frequency;
      }
    });

    // Next 100 dimensions: word length distribution
    const lengthDist = this.wordLengthDistribution(words);
    lengthDist.forEach((freq, index) => {
      if (index < 100) {
        embedding[200 + index] = freq;
      }
    });

    // Last 84 dimensions: statistical features
    embedding[300] = words.length / 100; // Normalized word count
    embedding[301] = normalized.length / 1000; // Normalized char count
    embedding[302] = words.filter((w) => w.length > 5).length / words.length; // Long word ratio
    embedding[303] =
      (normalized.match(/[0-9]/g) || []).length / normalized.length; // Number ratio
    embedding[304] =
      (normalized.match(/[.,!?]/g) || []).length / normalized.length; // Punctuation ratio

    // Normalize to unit vector
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0),
    );
    return magnitude > 0 ? embedding.map((val) => val / magnitude) : embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((text) => this.embed(text)));
  }

  /**
   * Extract character bigrams with frequency
   */
  private extractBigrams(
    text: string,
  ): Array<{ bigram: string; frequency: number }> {
    const bigrams = new Map<string, number>();
    for (let i = 0; i < text.length - 1; i++) {
      const bigram = text.substring(i, i + 2);
      bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
    }

    const total = text.length - 1;
    return Array.from(bigrams.entries())
      .map(([bigram, count]) => ({
        bigram,
        frequency: count / total,
      }))
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Word length distribution
   */
  private wordLengthDistribution(words: string[]): number[] {
    const dist = new Array(20).fill(0); // Support words up to length 20
    words.forEach((word) => {
      const len = Math.min(word.length, 19);
      dist[len]++;
    });
    const total = words.length;
    return dist.map((count) => (total > 0 ? count / total : 0));
  }
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(
      `Embedding dimensions mismatch: ${a.length} vs ${b.length}`,
    );
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Example usage:
// const provider = new SimpleKeywordEmbedding();
// const embedding = await provider.embed("Hendek'te satılık daire");
// console.log(`Dimensions: ${embedding.length}`);
