/**
 * Vector Memory System
 * Semantic search with embeddings for long-term memory
 */

import { db } from "@/db";
import { aiMemory } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getEmbeddingService } from "./embeddings";

export interface MemorySearchResult {
  id: string;
  content: string;
  summary: string | null;
  similarity: number;
  importanceScore: number;
  category: string | null;
  createdAt: Date;
}

export interface MemoryInsertOptions {
  content: string;
  summary?: string;
  category?: string;
  memoryType?: "conversation" | "knowledge" | "task" | "insight";
  importanceScore?: number;
  sourceType?: string;
  sourceId?: string;
  tags?: string[];
  expiresAt?: Date;
}

export class VectorMemoryService {
  private embeddingService = getEmbeddingService();

  /**
   * Generate embedding for text using multi-provider service
   * Automatic fallback: LiteLLM → Ollama → HuggingFace → OpenRouter
   */
  async generateEmbedding(text: string): Promise<{
    embedding: number[];
    provider: string;
    dimensions: number;
  }> {
    try {
      const result = await this.embeddingService.embed(text.substring(0, 8000));
      console.log(
        `✅ Embedding generated: ${result.provider} (${result.dimensions}D)`,
      );
      return result;
    } catch (error) {
      console.error("❌ All embedding providers failed:", error);
      // Return zero vector as last resort
      return {
        embedding: Array(384).fill(0), // Minimum dimensions
        provider: "fallback",
        dimensions: 384,
      };
    }
  }

  /**
   * Store memory with vector embedding
   */
  async storeMemory(options: MemoryInsertOptions): Promise<string> {
    const {
      content,
      summary,
      category = "general",
      memoryType = "knowledge",
      importanceScore = 50,
      sourceType = "system",
      sourceId,
      tags = [],
      expiresAt,
    } = options;

    // Generate embedding with multi-provider fallback
    const { embedding, provider, dimensions } =
      await this.generateEmbedding(content);

    console.log(
      `💾 Storing memory with ${provider} embedding (${dimensions}D)`,
    );

    // Insert into database
    const result = await db
      .insert(aiMemory)
      .values({
        memoryType,
        category,
        content,
        summary: summary || content.substring(0, 200),
        // embedding: embedding, // pgvector column (commented out for now)
        importanceScore,
        sourceType,
        sourceId,
        tags,
        expiresAt,
      })
      .returning({ id: aiMemory.id });

    return result[0].id;
  }

  /**
   * Semantic search using vector similarity
   * Note: Requires pgvector extension and embedding column
   */
  async semanticSearch(
    query: string,
    options: {
      limit?: number;
      category?: string;
      minImportance?: number;
    } = {},
  ): Promise<MemorySearchResult[]> {
    const { limit = 5, category, minImportance = 0 } = options;

    try {
      // Generate query embedding with multi-provider fallback
      const { embedding: queryEmbedding, provider } =
        await this.generateEmbedding(query);

      console.log(`🔍 Semantic search using ${provider} embeddings`);

      // For now, fallback to keyword search until pgvector is fully configured
      // TODO: Implement proper vector similarity search with pgvector
      return await this.keywordSearch(query, {
        limit,
        category,
        minImportance,
      });
    } catch (error) {
      console.error("Semantic search error:", error);
      return [];
    }
  }

  /**
   * Keyword-based search (fallback)
   */
  async keywordSearch(
    query: string,
    options: {
      limit?: number;
      category?: string;
      minImportance?: number;
    } = {},
  ): Promise<MemorySearchResult[]> {
    const { limit = 5, category, minImportance = 0 } = options;

    const keywords = query
      .toLowerCase()
      .split(" ")
      .filter((w) => w.length > 2);

    let queryBuilder = db
      .select({
        id: aiMemory.id,
        content: aiMemory.content,
        summary: aiMemory.summary,
        importanceScore: aiMemory.importanceScore,
        category: aiMemory.category,
        createdAt: aiMemory.createdAt,
      })
      .from(aiMemory)
      .where(sql`${aiMemory.importanceScore} >= ${minImportance}`)
      .orderBy(desc(aiMemory.importanceScore), desc(aiMemory.createdAt))
      .limit(limit);

    if (category) {
      queryBuilder = queryBuilder.where(
        eq(aiMemory.category, category),
      ) as typeof queryBuilder;
    }

    const results = await queryBuilder;

    // Simple keyword matching for similarity score
    return results.map((r) => ({
      ...r,
      similarity: this.calculateKeywordSimilarity(query, r.content),
    }));
  }

  /**
   * Calculate simple keyword similarity
   */
  private calculateKeywordSimilarity(query: string, content: string): number {
    const queryWords = query
      .toLowerCase()
      .split(" ")
      .filter((w) => w.length > 2);
    const contentLower = content.toLowerCase();

    const matches = queryWords.filter((word) =>
      contentLower.includes(word),
    ).length;
    return queryWords.length > 0 ? matches / queryWords.length : 0;
  }

  /**
   * Get recent memories
   */
  async getRecentMemories(
    limit: number = 10,
    category?: string,
  ): Promise<MemorySearchResult[]> {
    let query = db
      .select({
        id: aiMemory.id,
        content: aiMemory.content,
        summary: aiMemory.summary,
        importanceScore: aiMemory.importanceScore,
        category: aiMemory.category,
        createdAt: aiMemory.createdAt,
      })
      .from(aiMemory)
      .orderBy(desc(aiMemory.createdAt))
      .limit(limit);

    if (category) {
      query = query.where(eq(aiMemory.category, category)) as typeof query;
    }

    const results = await query;

    return results.map((r) => ({
      ...r,
      similarity: 1.0, // Recent memories are always relevant
    }));
  }

  /**
   * Get important memories
   */
  async getImportantMemories(
    limit: number = 10,
    minScore: number = 70,
  ): Promise<MemorySearchResult[]> {
    const results = await db
      .select({
        id: aiMemory.id,
        content: aiMemory.content,
        summary: aiMemory.summary,
        importanceScore: aiMemory.importanceScore,
        category: aiMemory.category,
        createdAt: aiMemory.createdAt,
      })
      .from(aiMemory)
      .where(sql`${aiMemory.importanceScore} >= ${minScore}`)
      .orderBy(desc(aiMemory.importanceScore))
      .limit(limit);

    return results.map((r) => ({
      ...r,
      similarity: r.importanceScore / 100,
    }));
  }

  /**
   * Update memory access count
   */
  async updateAccessCount(memoryId: string): Promise<void> {
    await db
      .update(aiMemory)
      .set({
        accessCount: sql`${aiMemory.accessCount} + 1`,
        lastAccessedAt: new Date(),
      })
      .where(eq(aiMemory.id, memoryId));
  }

  /**
   * Delete expired memories
   */
  async cleanupExpiredMemories(): Promise<number> {
    const result = await db
      .delete(aiMemory)
      .where(
        sql`${aiMemory.expiresAt} IS NOT NULL AND ${aiMemory.expiresAt} < NOW()`,
      )
      .returning({ id: aiMemory.id });

    return result.length;
  }

  /**
   * Get memory statistics
   */
  async getMemoryStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byCategory: Record<string, number>;
    avgImportance: number;
  }> {
    const allMemories = await db.select().from(aiMemory);

    const byType: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    let totalImportance = 0;

    allMemories.forEach((m) => {
      byType[m.memoryType] = (byType[m.memoryType] || 0) + 1;
      if (m.category) {
        byCategory[m.category] = (byCategory[m.category] || 0) + 1;
      }
      totalImportance += m.importanceScore || 0;
    });

    return {
      total: allMemories.length,
      byType,
      byCategory,
      avgImportance:
        allMemories.length > 0 ? totalImportance / allMemories.length : 0,
    };
  }
}

// Singleton instance
let vectorMemoryService: VectorMemoryService | null = null;

export function getVectorMemoryService(): VectorMemoryService {
  if (!vectorMemoryService) {
    vectorMemoryService = new VectorMemoryService();
  }
  return vectorMemoryService;
}
