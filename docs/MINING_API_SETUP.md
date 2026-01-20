# Mining API Kurulum ve Kullanım Kılavuzu

## 🎯 Genel Bakış

Mining API, Sahibinden.com crawler'larını kontrol etmek ve durumlarını takip etmek için FastAPI tabanlı bir backend servisidir.

## 📦 Özellikler

- ✅ Liste crawler (Supabase'e direkt yazma)
- ✅ Detay crawler (Supabase'e direkt yazma)
- ✅ Local crawler'lar (JSON output)
- ✅ Job yönetimi ve tracking
- ✅ Real-time log streaming
- ✅ Background task execution
- ✅ Rate limiting entegrasyonu

## 🚀 Kurulum

### 1. Mining API'yi Başlat

```bash
cd D:\demir\yy\demir-gayrimenkul\crwal4ai
uvicorn mining_api:app --host 0.0.0.0 --port 8765 --reload
```

**Port:** 8765 (crawler_api.py'den farklı!)

### 2. Environment Variables

`.env` dosyasında:

```env
SUPABASE_URL=https://cxeakfwtrlnjcjzvqdip.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here
SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Next.js Environment

`demir-gayrimenkul/.env.local`:

```env
MINING_API_URL=http://localhost:8765
```

## 📡 API Endpoints

### Health Check

```bash
GET http://localhost:8765/health
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2026-01-19T08:50:00"
}
```

### Stats

```bash
GET http://localhost:8765/stats
```

**Response:**

```json
{
  "total_listings": 150,
  "active_jobs": 1,
  "recent_24h": 50,
  "pending_details": 30,
  "active_processes": 1,
  "by_category": {
    "konut": 100,
    "isyeri": 30,
    "arsa": 20
  }
}
```

### Start List Crawl

```bash
POST http://localhost:8765/jobs/list-crawl
Content-Type: application/json

{
  "categories": ["konut_satilik"],
  "max_pages": 5,
  "max_listings": null
}
```

**Response:**

```json
{
  "message": "Liste crawler başlatıldı",
  "job_id": "uuid-here"
}
```

### Start Detail Crawl

```bash
POST http://localhost:8765/jobs/detail-crawl
Content-Type: application/json

{
  "max_listings": 50
}
```

### Get Job Status

```bash
GET http://localhost:8765/jobs/{job_id}
```

**Response:**

```json
{
  "job": {
    "id": "uuid",
    "job_type": "list_crawl",
    "source": "sahibinden",
    "status": "running",
    "progress": { "current": 3, "total": 5, "percentage": 60 },
    "stats": { "total_listings": 45 },
    "created_at": "2026-01-19T08:50:00",
    "started_at": "2026-01-19T08:50:05",
    "completed_at": null,
    "error_message": null
  },
  "logs": [
    {
      "id": "log-uuid",
      "job_id": "uuid",
      "level": "info",
      "message": "3. sayfa taranıyor...",
      "created_at": "2026-01-19T08:50:15"
    }
  ]
}
```

### Cancel Job

```bash
POST http://localhost:8765/jobs/{job_id}/cancel
```

### List Jobs

```bash
GET http://localhost:8765/jobs?limit=20&status=running
```

### Get Logs

```bash
GET http://localhost:8765/jobs/{job_id}/logs?limit=50
```

### Stream Logs (Polling)

```bash
GET http://localhost:8765/logs/stream?job_id={job_id}&last_id={last_log_id}
```

## 🔄 Next.js Entegrasyonu

### API Routes

Tüm Next.js API route'ları `mining_api.py`'ye yönlendirildi:

1. **POST /api/crawler/crawl** → `POST /jobs/list-crawl`
2. **GET /api/crawler/health** → `GET /health`
3. **GET /api/crawler/jobs/[jobId]** → `GET /jobs/{job_id}`

### Frontend Kullanımı

Admin panel: `http://localhost:3000/admin/veri-toplama`

```typescript
// Crawler başlat
const response = await fetch("/api/crawler/crawl", {
  method: "POST",
  body: JSON.stringify({
    url: "https://www.sahibinden.com/satilik-konut/sakarya-hendek",
    maxPages: 5,
    withDetails: false,
  }),
});

const { jobId } = await response.json();

// Job durumunu kontrol et
const jobResponse = await fetch(`/api/crawler/jobs/${jobId}`);
const job = await jobResponse.json();
```

## 🗄️ Database Schema

### mining_jobs

```sql
CREATE TABLE mining_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,  -- 'list_crawl', 'detail_crawl', etc.
  source TEXT NOT NULL,     -- 'sahibinden', 'emlakjet', etc.
  status TEXT NOT NULL,     -- 'pending', 'running', 'completed', 'failed', 'cancelled'
  config JSONB,
  progress JSONB,
  stats JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### mining_logs

```sql
CREATE TABLE mining_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES mining_jobs(id) ON DELETE CASCADE,
  level TEXT NOT NULL,  -- 'info', 'warning', 'error', 'success'
  message TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### sahibinden_liste

```sql
CREATE TABLE sahibinden_liste (
  id SERIAL PRIMARY KEY,
  ilan_no TEXT UNIQUE NOT NULL,
  baslik TEXT,
  fiyat TEXT,
  konum TEXT,
  tarih TEXT,
  link TEXT,
  resim TEXT,
  category TEXT,
  detay_cekildi BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔧 Crawler Scripts

### Liste Crawler (Supabase)

```bash
python sahibinden_uc_batch_supabase.py \
  --categories konut_satilik \
  --max-pages 5 \
  --job-id uuid-here
```

**Özellikler:**

- Supabase'e direkt yazma
- Duplicate detection
- Rate limiting
- Cloudflare bypass

### Detay Crawler (Supabase)

```bash
python sahibinden_uc_detail_supabase.py \
  --max-listings 50 \
  --job-id uuid-here
```

**Özellikler:**

- Pending listelerden detay çekme
- Supabase'e direkt yazma
- Retry mechanism

### Local Crawler (JSON)

```bash
python sahibinden_uc_batch.py \
  --categories konut_satilik \
  --max-pages 5 \
  --job-id uuid-here
```

**Özellikler:**

- JSON output
- Local file storage
- Test amaçlı

## ⚠️ Önemli Notlar

### Cloudflare Bypass

İlk çalıştırmada Chrome penceresi açılır ve manuel geçiş gerekebilir:

1. Chrome penceresi açılır
2. Cloudflare challenge'ı manuel geç
3. Crawler otomatik devam eder

### Rate Limiting

`rate_limiter.py` adaptive rate limiting kullanır:

- Başlangıç: 2-4 saniye delay
- Cloudflare block: Exponential backoff
- Success: Delay azalır

### Process Management

Mining API background process'leri yönetir:

- `active_processes` dict'te tracking
- Shutdown'da otomatik terminate
- Cancel endpoint ile manuel terminate

## 🐛 Troubleshooting

### Mining API çalışmıyor

```bash
# Port kontrolü
netstat -ano | findstr :8765

# Logs kontrol
# Terminal'de uvicorn output'u kontrol et
```

### Crawler hata veriyor

```bash
# Job logs kontrol et
GET http://localhost:8765/jobs/{job_id}/logs

# Supabase connection kontrol et
# .env dosyasında SUPABASE_SERVICE_KEY var mı?
```

### Duplicate if **name** hatası

✅ Düzeltildi! `sahibinden_uc_batch_supabase.py` dosyasında sadece bir tane `if __name__ == "__main__":` bloğu var.

## 📊 Monitoring

### Active Jobs

```bash
GET http://localhost:8765/jobs?status=running
```

### Recent Logs

```bash
GET http://localhost:8765/logs?limit=100&level=error
```

### Stats Dashboard

Admin panel: `http://localhost:3000/admin/veri-toplama`

## 🔄 Workflow

1. **Start Mining API:** `uvicorn mining_api:app --port 8765 --reload`
2. **Open Admin Panel:** `http://localhost:3000/admin/veri-toplama`
3. **Start Crawler:** "Taramayı Başlat" butonuna tıkla
4. **Monitor:** Job durumunu ve logları izle
5. **Check Results:** Supabase'de `sahibinden_liste` tablosunu kontrol et

## 📝 Version History

- **v1.0.0** (19 Ocak 2026): İlk release
  - Liste crawler entegrasyonu
  - Detay crawler entegrasyonu
  - Job management
  - Log streaming
  - Next.js API entegrasyonu
