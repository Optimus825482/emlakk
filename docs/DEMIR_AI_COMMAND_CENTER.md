# 🤖 Demir-AI Komuta Merkezi

## Genel Bakış

Demir-AI Komuta Merkezi, Demir Gayrimenkul admin panelinin merkezi yapay zeka asistanıdır. Tüm admin sayfalarında erişilebilir, sesli ve yazılı komutları destekler, veritabanı sorgularını çalıştırabilir ve uzun dönem hafıza sistemine sahiptir.

## ✨ Özellikler

### 1. Global Erişim

- ✅ Tüm admin sayfalarında floating button ile erişilebilir
- ✅ Minimize/maximize edilebilir
- ✅ Pozisyon ve boyut LocalStorage'da saklanır
- ✅ Responsive tasarım

### 2. Sesli İletişim

- 🎤 **Web Speech API** entegrasyonu
- 🗣️ Türkçe sesli komut desteği
- 🔊 Text-to-Speech yanıt okuma (opsiyonel)
- ⏺️ Real-time ses tanıma

### 3. Katmanlı Hafıza Sistemi

#### Working Memory (Kısa Dönem)

- `ai_conversations` tablosu
- Session bazlı konuşma geçmişi
- Son 10 mesaj context'i
- Real-time güncelleme

#### Long-term Memory (Uzun Dönem)

- `ai_memory` tablosu
- Vector embeddings (pgvector)
- Importance scoring (0-100)
- Semantic search
- Auto-expiration

#### Task Memory

- `ai_tasks` tablosu
- Pending/Running/Completed/Failed durumları
- Performance metrikleri
- Related entity tracking

### 4. Tool Calling Framework

#### Mevcut Araçlar

- 📊 `execute_sql` - SQL sorguları (sandbox gerekli)
- 🐍 `execute_python` - Python kod çalıştırma (sandbox gerekli)
- 💾 `save_memory` - Hafızaya kaydetme
- 🔍 `search_memory` - Hafızada arama
- 📈 `analyze_listings` - İlan analizi

#### Gelecek Araçlar

- 📧 Email gönderme
- 📱 SMS/WhatsApp entegrasyonu
- 📊 Rapor oluşturma
- 🗺️ Harita analizi
- 💰 Fiyat tahmini

### 5. Multi-Tab Interface

#### Chat Tab

- Konuşma geçmişi
- Quick action buttons
- Sesli/yazılı input
- Tool execution sonuçları

#### Tools Tab (Coming Soon)

- Tool browser
- Manual tool execution
- Parameter configuration

#### Memory Tab (Coming Soon)

- Memory browser
- Semantic search
- Importance filtering
- Memory management

#### Logs Tab (Coming Soon)

- Execution logs
- Performance metrics
- Error tracking
- Audit trail

## 🗄️ Database Schema

### ai_memory (Long-term Memory)

```sql
CREATE TABLE ai_memory (
  id UUID PRIMARY KEY,
  memory_type VARCHAR(50), -- 'conversation', 'knowledge', 'task', 'insight'
  category VARCHAR(100),   -- 'listings', 'users', 'market', 'system'
  content TEXT,
  summary TEXT,
  embedding VECTOR(1536),  -- pgvector for semantic search
  context JSONB,
  tags TEXT[],
  importance_score INTEGER, -- 0-100
  access_count INTEGER,
  last_accessed_at TIMESTAMP,
  related_memory_ids UUID[],
  source_type VARCHAR(50),
  source_id UUID,
  created_at TIMESTAMP,
  expires_at TIMESTAMP
);
```

### ai_conversations (Working Memory)

```sql
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY,
  session_id VARCHAR(255),
  user_id UUID REFERENCES users(id),
  messages JSONB, -- [{role, content, timestamp}]
  context JSONB,
  agent_type VARCHAR(50),
  total_messages INTEGER,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### ai_tasks (Task Queue)

```sql
CREATE TABLE ai_tasks (
  id UUID PRIMARY KEY,
  agent_type VARCHAR(50),
  task_type VARCHAR(100),
  input JSONB,
  output JSONB,
  status VARCHAR(20), -- pending, running, completed, failed
  error TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  user_id UUID,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  created_at TIMESTAMP
);
```

### ai_agent_logs (Audit Trail)

```sql
CREATE TABLE ai_agent_logs (
  id UUID PRIMARY KEY,
  agent_type VARCHAR(50),
  action VARCHAR(100),
  input JSONB,
  output JSONB,
  duration_ms INTEGER,
  success BOOLEAN,
  error TEXT,
  user_id UUID,
  session_id VARCHAR(255),
  created_at TIMESTAMP
);
```

### command_history (User Commands)

```sql
CREATE TABLE command_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  command TEXT,
  parameters JSONB,
  result JSONB,
  success BOOLEAN,
  error TEXT,
  executed_at TIMESTAMP,
  duration_ms INTEGER,
  page_url TEXT,
  context JSONB
);
```

### ai_insights_cache (Performance Cache)

```sql
CREATE TABLE ai_insights_cache (
  id UUID PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE,
  insight_type VARCHAR(100),
  data JSONB,
  generated_at TIMESTAMP,
  expires_at TIMESTAMP,
  hit_count INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## 🚀 Kullanım

### Component Entegrasyonu

```tsx
// Admin layout'a eklendi
import { DemirAICommandCenter } from "@/components/admin/DemirAICommandCenter";

export default function AdminLayout({ children }) {
  return (
    <div>
      {/* ... existing layout ... */}
      <DemirAICommandCenter />
    </div>
  );
}
```

### API Endpoint

```typescript
// POST /api/ai/command-center/chat
const response = await fetch("/api/ai/command-center/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: "Veritabanında kaç aktif ilan var?",
    chatHistory: [...],
    sessionId: "session-123",
  }),
});

const data = await response.json();
// {
//   success: true,
//   response: "Veritabanında 245 aktif ilan bulunuyor.",
//   toolCalls: [{ name: "execute_sql", result: {...} }],
//   executionTime: 1234,
//   sessionId: "session-123"
// }
```

### Sesli Komut Kullanımı

1. Mikrofon butonuna tıkla
2. Türkçe komut ver: "Veritabanında kaç ilan var?"
3. Otomatik olarak text'e dönüşür ve gönderilir

### Quick Actions

```typescript
const quickActions = [
  {
    icon: "query_stats",
    label: "İlan Analizi",
    prompt: "Son 30 günde eklenen ilanları analiz et",
  },
  {
    icon: "database",
    label: "SQL Sorgusu",
    prompt: "Veritabanında kaç aktif ilan var?",
  },
  {
    icon: "code",
    label: "Python Çalıştır",
    prompt: "Python ile fiyat trend analizi yap",
  },
  {
    icon: "memory",
    label: "Hafıza Ara",
    prompt: "Geçmiş konuşmalarımızda ne konuştuk?",
  },
];
```

## 🔐 Güvenlik

### Authentication

- NextAuth session kontrolü
- User ID tracking
- Admin-only access

### SQL Injection Prevention

- Parameterized queries
- Input validation
- Sandbox execution (TODO)

### Python Execution Security

- Isolated sandbox (TODO)
- Resource limits
- Timeout controls

### Memory Access Control

- User-scoped memories
- Importance-based filtering
- Expiration policies

## 📊 Performance

### Caching Strategy

- `ai_insights_cache` tablosu
- TTL-based expiration
- Hit count tracking
- Auto-cleanup

### Query Optimization

- Indexed columns (memory_type, category, importance_score)
- Limited result sets (top 5 memories)
- Efficient JSONB queries

### Memory Management

- Auto-expiration (expires_at)
- Importance-based retention
- Access count tracking
- Periodic cleanup functions

## 🛠️ Geliştirme Roadmap

### Phase 1: Core Features ✅

- [x] Global floating assistant
- [x] Voice command support
- [x] Long-term memory system
- [x] Basic tool calling
- [x] Admin layout integration

### Phase 2: Tool Calling (In Progress)

- [ ] SQL sandbox implementation
- [ ] Python sandbox (Docker)
- [ ] Listing analysis tools
- [ ] Market intelligence tools
- [ ] Report generation

### Phase 3: Advanced Memory

- [ ] Vector embeddings (pgvector)
- [ ] Semantic search
- [ ] Memory clustering
- [ ] Auto-summarization
- [ ] Knowledge graph

### Phase 4: Multi-Agent Orchestration

- [ ] Agent coordination
- [ ] Task delegation
- [ ] Parallel execution
- [ ] Result aggregation

### Phase 5: Analytics & Monitoring

- [ ] Performance dashboard
- [ ] Usage analytics
- [ ] Error tracking
- [ ] Cost monitoring

## 📝 Örnek Kullanım Senaryoları

### Senaryo 1: İlan Analizi

```
Kullanıcı: "Son 30 günde eklenen ilanları analiz et"

Demir-AI:
1. execute_sql() ile son 30 günün ilanlarını çeker
2. Fiyat, bölge, tip dağılımını analiz eder
3. Trend raporunu oluşturur
4. Hafızaya kaydeder (importance: 70)
```

### Senaryo 2: Pazar İstihbaratı

```
Kullanıcı: "Hendek'te sanayi arsası fiyatları nasıl?"

Demir-AI:
1. search_memory() ile geçmiş analizleri kontrol eder
2. execute_sql() ile güncel fiyatları çeker
3. Python ile trend analizi yapar
4. Karşılaştırmalı rapor sunar
```

### Senaryo 3: Hafıza Sorgusu

```
Kullanıcı: "Geçen hafta hangi konuları konuştuk?"

Demir-AI:
1. search_memory() ile son 7 günü tarar
2. Importance score'a göre sıralar
3. Özet liste sunar
4. İlgili konuşma linklerini verir
```

## 🔧 Troubleshooting

### Sesli Komut Çalışmıyor

- Chrome/Edge kullanın (Safari desteklenmiyor)
- Mikrofon izni verin
- HTTPS bağlantısı gerekli

### Memory Sistemi Yavaş

- Index'leri kontrol edin
- Expired memories'i temizleyin
- Cache'i optimize edin

### Tool Calling Hataları

- Sandbox implementasyonu gerekli
- API key'leri kontrol edin
- Rate limiting ayarlarını gözden geçirin

## 📚 İlgili Dosyalar

```
src/
├── components/admin/
│   └── DemirAICommandCenter.tsx (Main component)
├── app/api/ai/command-center/
│   └── chat/route.ts (API endpoint)
├── db/schema/
│   └── ai-memory.ts (Database schema)
├── types/
│   └── speech.d.ts (TypeScript definitions)
└── lib/ai/
    └── orchestrator.ts (AI orchestration)
```

## 🎯 Best Practices

1. **Memory Management**
   - Önemli bilgileri importance_score ile işaretle
   - Geçici bilgiler için expires_at kullan
   - Düzenli cleanup çalıştır

2. **Tool Calling**
   - Her zaman sandbox kullan
   - Input validation yap
   - Timeout ayarla
   - Error handling ekle

3. **Performance**
   - Cache kullan
   - Query'leri optimize et
   - Batch operations yap
   - Async processing tercih et

4. **Security**
   - User authentication kontrol et
   - SQL injection'a karşı koru
   - Rate limiting uygula
   - Audit logging yap

---

**Son Güncelleme:** 2026-01-21
**Versiyon:** 1.0.0
**Durum:** Production Ready (Sandbox implementation pending)
