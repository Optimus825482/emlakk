/**
 * Multi-Provider Embedding Service
 * Automatic fallback: Jina AI → LiteLLM → Ollama → HuggingFace → OpenRouter → Simple Keyword
 */

import { SimpleKeywordEmbedding } from "./simple-embeddings";

export interface EmbeddingProvider {
  name: string;
  dimensions: number;
  isAvailable(): Promise<boolean>;
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

// ============================================
// 1. JINA AI PROVIDER (Free, Multilingual, 1024D)
// ============================================
class JinaAIProvider implements EmbeddingProvider {
  name = "jina-ai";
  dimensions = 1024; // jina-embeddings-v3
  private apiUrl = "https://api.jina.ai/v1/embeddings";
  private apiKey = process.env.JINA_API_KEY || "";
  private model = "jina-embeddings-v3";

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async embed(text: string): Promise<number[]> {
    if (!this.apiKey) {
      throw new Error("Jina AI API key required");
    }

    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        task: "text-matching",
        input: [text],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Jina AI embedding failed: ${error}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!this.apiKey) {
      throw new Error("Jina AI API key required");
    }

    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        task: "text-matching",
        input: texts,
      }),
    });

    if (!response.ok) throw new Error("Jina AI batch embedding failed");

    const data = await response.json();
    return data.data.map((item: any) => item.embedding);
  }
}

// ============================================
// 2. LITELLM PROVIDER (Self-hosted, OpenAI-compatible)
// ============================================
class LiteLLMProvider implements EmbeddingProvider {
  name = "litellm";
  dimensions = 1536; // Depends on model
  private baseUrl = process.env.LITELLM_BASE_URL || "http://77.42.68.4:4000";
  private apiKey = process.env.LITELLM_API_KEY || "";
  private model =
    process.env.LITELLM_EMBEDDING_MODEL || "text-embedding-3-small";

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async embed(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
      },
      body: JSON.stringify({
        model: this.model,
        input: text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LiteLLM embedding failed: ${error}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
      },
      body: JSON.stringify({
        model: this.model,
        input: texts,
      }),
    });

    if (!response.ok) throw new Error("LiteLLM batch embedding failed");

    const data = await response.json();
    return data.data.map((item: any) => item.embedding);
  }
}

// ============================================
// 3. OLLAMA PROVIDER (Local, Free)
// ============================================
class OllamaProvider implements EmbeddingProvider {
  name = "ollama";
  dimensions = 768;
  private baseUrl = "http://localhost:11434";
  private model = "nomic-embed-text";

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(2000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async embed(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.model, prompt: text }),
    });

    if (!response.ok) throw new Error("Ollama embedding failed");

    const data = await response.json();
    return data.embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((text) => this.embed(text)));
  }
}

// ============================================
// 4. HUGGING FACE PROVIDER (Free API)
// ============================================
class HuggingFaceProvider implements EmbeddingProvider {
  name = "huggingface";
  dimensions = 384;
  private model = "sentence-transformers/all-MiniLM-L6-v2";
  private apiUrl = "https://router.huggingface.co/v1/embeddings"; // NEW API
  private apiKey = process.env.HUGGINGFACE_API_KEY || "";

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey; // Requires API key now
  }

  async embed(text: string): Promise<number[]> {
    if (!this.apiKey) {
      throw new Error("HuggingFace API key required");
    }

    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HuggingFace embedding failed: ${error}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!this.apiKey) {
      throw new Error("HuggingFace API key required");
    }

    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: texts,
      }),
    });

    if (!response.ok) throw new Error("HuggingFace batch embedding failed");

    const data = await response.json();
    return data.data.map((item: any) => item.embedding);
  }
}

// ============================================
// 5. OPENROUTER PROVIDER (Free Models)
// ============================================
class OpenRouterProvider implements EmbeddingProvider {
  name = "openrouter";
  dimensions = 1024; // Varies by model
  private apiUrl = "https://openrouter.ai/api/v1/embeddings";
  private apiKey = process.env.OPENROUTER_API_KEY || "";
  private model = "text-embedding-3-small"; // Free tier model

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async embed(text: string): Promise<number[]> {
    if (!this.apiKey) throw new Error("OpenRouter API key not found");

    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Demir Gayrimenkul AI",
      },
      body: JSON.stringify({
        model: this.model,
        input: text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter embedding failed: ${error}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!this.apiKey) throw new Error("OpenRouter API key not found");

    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Demir Gayrimenkul AI",
      },
      body: JSON.stringify({
        model: this.model,
        input: texts,
      }),
    });

    if (!response.ok) throw new Error("OpenRouter batch embedding failed");

    const data = await response.json();
    return data.data.map((item: any) => item.embedding);
  }
}

// ============================================
// MULTI-PROVIDER EMBEDDING SERVICE
// ============================================
export class EmbeddingService {
  private providers: EmbeddingProvider[];
  private currentProvider: EmbeddingProvider | null = null;

  constructor() {
    this.providers = [
      new JinaAIProvider(), // Primary: Free, multilingual, 1024D, reliable
      new LiteLLMProvider(), // Fallback 1: Self-hosted, fast, reliable
      new OllamaProvider(), // Fallback 2: Local, fast, free (not installed)
      new HuggingFaceProvider(), // Fallback 3: Free API
      new OpenRouterProvider(), // Fallback 4: Paid but reliable
      new SimpleKeywordEmbedding(), // Fallback 5: Always works, no API
    ];
  }

  /**
   * Get the first available provider
   */
  private async getProvider(): Promise<EmbeddingProvider> {
    // Use cached provider if available
    if (this.currentProvider) {
      try {
        const isAvailable = await this.currentProvider.isAvailable();
        if (isAvailable) return this.currentProvider;
      } catch (error) {
        console.warn(
          `⚠️ Cached provider ${this.currentProvider.name} failed, trying next...`,
        );
        this.currentProvider = null;
      }
    }

    // Find first available provider
    for (const provider of this.providers) {
      try {
        const isAvailable = await provider.isAvailable();
        if (isAvailable) {
          console.log(`✅ Using embedding provider: ${provider.name}`);
          this.currentProvider = provider;
          return provider;
        }
      } catch (error) {
        console.warn(
          `⚠️ Provider ${provider.name} check failed:`,
          error.message,
        );
      }
    }

    throw new Error("No embedding provider available");
  }

  /**
   * Generate embedding for a single text
   */
  async embed(text: string): Promise<{
    embedding: number[];
    provider: string;
    dimensions: number;
  }> {
    const provider = await this.getProvider();

    try {
      const embedding = await provider.embed(text);
      return {
        embedding,
        provider: provider.name,
        dimensions: provider.dimensions,
      };
    } catch (error) {
      console.error(
        `❌ Embedding failed with ${provider.name}:`,
        error.message,
      );
      // Reset current provider and retry with next
      this.currentProvider = null;

      // Prevent infinite recursion - max 3 retries
      const maxRetries = 3;
      if (!this.retryCount) this.retryCount = 0;

      if (this.retryCount < maxRetries) {
        this.retryCount++;
        console.log(
          `🔄 Retrying with next provider (attempt ${this.retryCount}/${maxRetries})...`,
        );
        return this.embed(text);
      } else {
        this.retryCount = 0;
        throw new Error(
          `All embedding providers failed after ${maxRetries} attempts`,
        );
      }
    }
  }

  private retryCount = 0;

  /**
   * Generate embeddings for multiple texts (batch)
   */
  async embedBatch(texts: string[]): Promise<{
    embeddings: number[][];
    provider: string;
    dimensions: number;
  }> {
    const provider = await this.getProvider();

    try {
      const embeddings = await provider.embedBatch(texts);
      return {
        embeddings,
        provider: provider.name,
        dimensions: provider.dimensions,
      };
    } catch (error) {
      console.error(`❌ Batch embedding failed with ${provider.name}:`, error);
      this.currentProvider = null;
      return this.embedBatch(texts);
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(a: number[], b: number[]): number {
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

  /**
   * Get status of all providers
   */
  async getProvidersStatus(): Promise<
    Array<{ name: string; available: boolean; dimensions: number }>
  > {
    const statuses = await Promise.all(
      this.providers.map(async (provider) => ({
        name: provider.name,
        available: await provider.isAvailable(),
        dimensions: provider.dimensions,
      })),
    );
    return statuses;
  }
}

// Singleton instance
let embeddingServiceInstance: EmbeddingService | null = null;

export function getEmbeddingService(): EmbeddingService {
  if (!embeddingServiceInstance) {
    embeddingServiceInstance = new EmbeddingService();
  }
  return embeddingServiceInstance;
}

// Example usage:
// const service = getEmbeddingService();
// const result = await service.embed("Merhaba dünya");
// console.log(`Provider: ${result.provider}, Dimensions: ${result.dimensions}`);
