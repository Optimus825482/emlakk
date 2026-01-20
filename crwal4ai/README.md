# 🤖 Sahibinden.com Crawler - FastAPI Service

Production-ready crawler servisi. Admin panel ile tam entegre.

## 🚀 Hızlı Başlangıç

```bash
# 1. Virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# 2. Dependencies
pip install -r requirements.txt

# 3. Environment
cp .env.example .env
# .env dosyasını düzenle (SUPABASE_URL, SUPABASE_KEY)

# 4. Başlat
uvicorn crawler_api:app --host 0.0.0.0 --port 8000 --reload
```

API: `http://localhost:8000`  
Docs: `http://localhost:8000/docs`

## 📡 API Endpoints

| Endpoint        | Method | Açıklama        |
| --------------- | ------ | --------------- |
| `/health`       | GET    | Crawler durumu  |
| `/stats`        | GET    | İstatistikler   |
| `/crawl`        | POST   | Tarama başlat   |
| `/detail`       | POST   | Tek ilan detayı |
| `/detail-batch` | POST   | Toplu detay     |
| `/jobs`         | GET    | Tüm işler       |
| `/jobs/{id}`    | GET    | İş durumu       |

## 🔧 Konfigürasyon

### .env

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-key
HEADLESS=false  # true = production
```

### Rate Limiting

- Base delay: 2-5 saniye
- Adaptive backoff: Otomatik yavaşlama
- Block detection: 429/403 response

## 🎯 Kullanım Örnekleri

### Health Check

```bash
curl http://localhost:8000/health
```

### Tarama Başlat

```bash
curl -X POST http://localhost:8000/crawl \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.sahibinden.com/satilik/sakarya-hendek",
    "maxPages": 5,
    "withDetails": false
  }'
```

### Job Durumu

```bash
curl http://localhost:8000/jobs/job_20250128_143022
```

## 🛡️ Güvenlik

- ✅ Undetected Chrome (Cloudflare bypass)
- ✅ Rate limiting koruması
- ✅ Session management
- ✅ Error handling

## 📊 Monitoring

```bash
# Stats endpoint
curl http://localhost:8000/stats

# Response:
{
  "rate_limiter": {
    "current_delay": 3.2,
    "backoff_level": 0,
    "block_rate": "0.0%"
  },
  "crawler": {
    "ready": true,
    "is_crawling": false
  }
}
```

## 🐳 Docker

```bash
docker build -t sahibinden-crawler .
docker run -d -p 8000:8000 \
  -e SUPABASE_URL=your-url \
  -e SUPABASE_KEY=your-key \
  sahibinden-crawler
```

## 📝 Notlar

- Cloudflare bypass için `HEADLESS=false` önerilir
- Rate limit'e uyun (günde max 500-1000 ilan)
- Duplicate detection otomatik çalışır
- Session korunur, tekrar Cloudflare geçmeye gerek yok

## 🔗 Entegrasyon

Next.js admin panel: `/admin/veri-toplama`

API Routes:

- `/api/crawler/health`
- `/api/crawler/crawl`
- `/api/crawler/listings`
- `/api/crawler/approve`
- `/api/crawler/reject`

## 📚 Daha Fazla

Detaylı dokümantasyon: `../docs/CRAWLER_SETUP.md`
