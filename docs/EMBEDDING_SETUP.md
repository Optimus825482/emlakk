# Multi-Provider Embedding System

## 📋 Özet

Demir AI Command Center için 6 katmanlı otomatik fallback embedding sistemi kuruldu.

## 🎯 Provider Sıralaması

1. **Jina AI** (Primary) - Free, Multilingual, 1024D ✅ **WORKING**
   - Status: ✅ Online and tested
   - Dimensions: 1024
   - Model: jina-embeddings-v3
   - Multilingual: ✅ Turkish supported
   - API Key: ✅ Configured
   - URL: https://api.jina.ai/v1/embeddings
   - **Test Result**: Successfully generated 1024D embeddings for Turkish text

2. **LiteLLM** (Fallback 1) - Self-hosted
   - Status: ⚠️ Offline (timeout)
   - Dimensions: 1536
   - Model: text-embedding-3-small
   - URL: http://77.42.68.4:4000

3. **Ollama** (Fallback 2) - Local
   - Status: ❌ Not installed
   - Dimensions: 768
   - Model: nomic-embed-text

4. **HuggingFace** (Fallback 3) - Free API
   - Status: ⚠️ API endpoint changed (404)
   - Dimensions: 384
   - Model: sentence-transformers/all-MiniLM-L6-v2

5. **OpenRouter** (Fallback 4) - Paid API
   - Status: ✅ API key configured
   - Dimensions: 1024

6. **Simple Keyword** (Final Fallback) - Always works
   - Status: ✅ Always available
   - Dimensions: 384
   - Method: TF-IDF-like keyword matching

## 📁 Dosya Yapısı

```
src/lib/ai/
├── embeddings.ts              # Multi-provider service (6 providers)
├── simple-embeddings.ts       # Keyword-based fallback
├── vector-memory.ts           # Updated to use multi-provider
└── voice-assistant.ts         # Voice command system

test_embeddings.js             # Provider test script (6 providers)
test_litellm.js               # LiteLLM specific test
```

## 🔧 Kurulum

### 1. Environment Variables (.env.local)

```bash
# Jina AI (Primary - Free, Multilingual, 1024D) ✅ WORKING
JINA_API_KEY="[configured_in_env_local]"

# LiteLLM (Fallback 1 - Self-hosted)
LITELLM_BASE_URL="http://77.42.68.4:4000"
LITELLM_API_KEY=""  # Optional
LITELLM_EMBEDDING_MODEL="text-embedding-3-small"

# HuggingFace (Fallback 3 - Free API)
HUGGINGFACE_API_KEY="[configured_in_env_local]"

# OpenRouter (Fallback 4 - Paid API)
OPENROUTER_API_KEY="[configured]"

# Ollama (Fallback 2) - No key needed, local installation
# Simple Keyword (Fallback 5) - No key needed, always works
```

### 2. Test Providers

```bash
# Test all providers
node test_embeddings.js

# Expected output:
# ✅ Jina AI: WORKING (1024 dimensions)
# ❌ LiteLLM: OFFLINE
# ❌ Ollama: NOT INSTALLED
# ⚠️ HuggingFace: 404
# ✅ OpenRouter: API KEY FOUND
# ✅ Simple Keyword: ALWAYS AVAILABLE
```

## 💻 Kullanım

### Basic Usage

```typescript
import { getEmbeddingService } from "@/lib/ai/embeddings";

const service = getEmbeddingService();

// Generate embedding (automatic fallback)
const result = await service.embed("Hendek'te satılık daire");
console.log(`Provider: ${result.provider}`); // "jina-ai"
console.log(`Dimensions: ${result.dimensions}`); // 1024
console.log(`Embedding: ${result.embedding}`);

// Batch embedding
const results = await service.embedBatch([
  "satılık daire",
  "kiralık ev",
  "arsa",
]);

// Calculate similarity
const similarity = service.cosineSimilarity(
  result1.embedding,
  result2.embedding,
);
```

### Vector Memory Integration

```typescript
import { getVectorMemoryService } from "@/lib/ai/vector-memory";

const memory = getVectorMemoryService();

// Store memory (uses Jina AI embeddings)
await memory.storeMemory({
  content: "Hendek'te 50 aktif ilan var",
  category: "statistics",
  importanceScore: 80,
});

// Semantic search (uses Jina AI embeddings)
const results = await memory.semanticSearch("Kaç ilan var?", {
  limit: 5,
  minImportance: 50,
});
```

## 🔍 Provider Status Check

```typescript
const service = getEmbeddingService();
const statuses = await service.getProvidersStatus();

statuses.forEach((status) => {
  console.log(
    `${status.name}: ${status.available ? "AVAILABLE" : "UNAVAILABLE"}`,
  );
});
```

## 📊 Current Status

| Provider       | Status           | Dimensions | Notes                                 |
| -------------- | ---------------- | ---------- | ------------------------------------- |
| Jina AI        | ✅ **WORKING**   | 1024       | Primary provider, tested successfully |
| LiteLLM        | ⚠️ Offline       | 1536       | Optional: Start server                |
| Ollama         | ❌ Not installed | 768        | Optional: Install locally             |
| HuggingFace    | ⚠️ API changed   | 384        | API endpoint updated                  |
| OpenRouter     | ✅ Ready         | 1024       | API key configured                    |
| Simple Keyword | ✅ Ready         | 384        | Always works                          |

## ✅ Garantili Çalışma

**Jina AI primary provider olarak çalışıyor!**

- ✅ 1024 boyutlu embeddings
- ✅ Multilingual (Türkçe destekli)
- ✅ Ücretsiz
- ✅ Güvenilir ve hızlı

Jina AI erişilemez olsa bile, Simple Keyword provider her zaman çalışır.

## 🔄 Automatic Fallback Flow

```
User Request
    ↓
Try Jina AI (free, multilingual, 1024D) ✅ PRIMARY
    ↓ (if fails)
Try LiteLLM (self-hosted, fast)
    ↓ (if fails)
Try Ollama (local, free)
    ↓ (if fails)
Try HuggingFace (free API)
    ↓ (if fails)
Try OpenRouter (paid, reliable)
    ↓ (if fails)
Use Simple Keyword (always works)
    ↓
Return embedding ✅
```

## 🎯 Jina AI Advantages

1. **Free**: No cost, generous rate limits
2. **Multilingual**: Native Turkish support
3. **High Quality**: 1024 dimensions for better semantic understanding
4. **Fast**: Low latency, reliable API
5. **No Setup**: Cloud-based, no installation needed

## 📝 Implementation Details

### EmbeddingService Class

- **Singleton pattern**: `getEmbeddingService()`
- **Automatic provider selection**: Tries providers in order
- **Caching**: Remembers last working provider
- **Error handling**: Graceful fallback on failure
- **Batch support**: Efficient batch embedding

### Jina AI Provider

```typescript
class JinaAIProvider implements EmbeddingProvider {
  name = "jina-ai";
  dimensions = 1024;
  private apiUrl = "https://api.jina.ai/v1/embeddings";
  private model = "jina-embeddings-v3";

  async embed(text: string): Promise<number[]> {
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

    const data = await response.json();
    return data.data[0].embedding;
  }
}
```

## 🎯 Next Steps

1. ✅ Jina AI integrated and tested
2. ✅ Multi-provider system implemented
3. ✅ Simple keyword fallback added
4. ✅ Vector memory updated
5. ⏳ Enable pgvector for true semantic search (optional)
6. ⏳ Start LiteLLM server (optional backup)

## 📚 References

- Jina AI: https://jina.ai/embeddings/
- LiteLLM: https://docs.litellm.ai/
- Ollama: https://ollama.ai/
- HuggingFace: https://huggingface.co/docs/api-inference/
- OpenRouter: https://openrouter.ai/docs

---

**Created**: 2026-01-21
**Status**: ✅ Implemented and tested with Jina AI
**Primary Provider**: ✅ Jina AI (1024D, multilingual, free)
**Fallback**: ✅ Guaranteed to work (Simple Keyword)
