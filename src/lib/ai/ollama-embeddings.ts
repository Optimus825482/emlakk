/**
 * Ollama Embeddings Service
 * Local, free, and fast embeddings using Ollama
 */

export interface OllamaEmbeddingConfig {
  model: string; // 'nomic-embed-text' or 'mxbai-embed-large'
  baseUrl: string;
  dimensions: number;
}

export class OllamaEmbeddings {
  private config: OllamaEmbeddingConfig;

  constructor(config: Partial<OllamaEmbeddingConfig> = {}) {
    this.config = {
      model: "nomic-embed-text", // 768 dimensions, best for Turkish
      baseUrl: "http://localhost:11434",
      dimensions: 768,
      ...config,
    };
  }

  /**
   * Generate embedding for a single text
   */
  async embed(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.config.model,
          prompt: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.embedding;
    } catch (error) {
      console.error("Ollama embedding error:", error);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts (batch)
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    const embeddings = await Promise.all(texts.map((text) => this.embed(text)));
    return embeddings;
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error("Embeddings must have same dimensions");
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

  /**
   * Check if Ollama is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        method: "GET",
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get available models
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`);
      const data = await response.json();
      return data.models.map((m: any) => m.name);
    } catch {
      return [];
    }
  }
}

// Singleton instance
let ollamaInstance: OllamaEmbeddings | null = null;

export function getOllamaEmbeddings(): OllamaEmbeddings {
  if (!ollamaInstance) {
    ollamaInstance = new OllamaEmbeddings();
  }
  return ollamaInstance;
}

// Example usage:
// const ollama = getOllamaEmbeddings();
// const embedding = await ollama.embed("Merhaba dünya");
// console.log(embedding.length); // 768
