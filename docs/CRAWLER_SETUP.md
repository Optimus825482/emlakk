# 🏠 Sahibinden.com Crawler Kurulum ve Kullanım Kılavuzu

## 📋 Genel Bakış

Bu crawler sistemi, Sahibinden.com'dan emlak ilanlarını otomatik olarak toplar ve admin paneline entegre eder.

**Özellikler:**

- ✅ Cloudflare bypass (Undetected Chrome)
- ✅ Rate limiting koruması
- ✅ Duplicate detection
- ✅ FastAPI REST API
- ✅ Next.js Admin Panel entegrasyonu
- ✅ Supabase otomatik kayıt
- ✅ Real-time progress tracking

---

## 🚀 Hızlı Başlangıç

### 1. Crawler Servisini Başlat

```bash
cd crwal4ai

# Virtual environment oluştur (ilk kez)
python -m venv venv

# Aktive et
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Bağımlılıkları yükle
pip install -r requirements.txt

# Crawler API'yi başlat
uvicorn crawler_api:app --host 0.0.0.0 --port 8000 --reload
```

Crawler şimdi `http://localhost:8000` adresinde çalışıyor.

### 2. Next.js Uygulamasını Başlat

```bash
# Ana dizinde
npm run dev
```

### 3. Admin Panele Git

```
http://localhost:3000/admin/veri-toplama
```

---

## 📁 Dosya Yapısı

```
demir-gayrimenkul/
├── crwal4ai/                          # Python Crawler
│   ├── crawler_api.py                 # FastAPI REST API
│   ├── sahibinden_auto_crawler.py     # Ana crawler logic
│   ├── rate_limiter.py                # Rate limiting
│   ├── requirements.txt               # Python dependencies
│   └── .env                           # Crawler config
│
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   └── veri-toplama/
│   │   │       └── page.tsx           # Admin UI
│   │   └── api/
│   │       └── crawler/               # Next.js API Routes
│   │           ├── health/            # Crawler durumu
│   │           ├── crawl/             # Tarama başlat
│   │           ├── listings/          # İlanları listele
│   │           ├── approve/           # İlanları onayla
│   │           ├── reject/            # İlanları reddet
│   │           └── jobs/[jobId]/      # Job durumu
│   │
│   └── db/
│       └── schema/
│           └── collected-listings.ts  # Supabase schema
```

---

## 🔧 Konfigürasyon

### Crawler (.env)

```bash
# crwal4ai/.env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-key
HEADLESS=false  # true = headless mode (production)
```

### Next.js (.env.local)

```bash
CRAWLER_API_URL=http://localhost:8000
```

---

## 🎯 Kullanım

### Admin Panel Üzerinden

1. **Veri Toplama** sayfasına git
2. Kategori seç (Konut Satılık, Kiralık, vb.)
3. Maksimum sayfa sayısını belirle (1-50)
4. "Taramayı Başlat" butonuna tıkla
5. Progress'i takip et
6. Toplanan ilanları onayla/reddet

### API Üzerinden

#### Crawler Durumu

```bash
curl http://localhost:8000/health
```

#### Tarama Başlat

```bash
curl -X POST http://localhost:8000/crawl \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.sahibinden.com/satilik/sakarya-hendek",
    "maxPages": 5,
    "withDetails": false
  }'
```

#### Job Durumu

```bash
curl http://localhost:8000/jobs/{jobId}
```

---

## 📊 Veri Akışı

```
Sahibinden.com
    ↓
[Python Crawler] → FastAPI
    ↓
[Next.js API] → Supabase (collected_listings)
    ↓
[Admin Panel] → Onay/Red
    ↓
Supabase (listings) → Public Website
```

---

## 🛡️ Güvenlik ve Rate Limiting

### Rate Limiter Stratejisi

Crawler, Sahibinden.com'un rate limit'lerine uyum sağlamak için akıllı bir sistem kullanır:

- **Base Delay:** 2-5 saniye (rastgele)
- **Adaptive Backoff:** Block tespit edilirse otomatik yavaşlama
- **Request Tracking:** Her 10 istekte ekstra bekleme
- **Block Detection:** 429/403 response'larını tespit eder

### Cloudflare Bypass

- **Undetected Chrome:** Bot detection'ı bypass eder
- **User Profile:** Session ve cookie'leri korur
- **Stealth Mode:** Browser fingerprint'i gizler

---

## 🔍 Duplicate Detection

Sistem, mükerrer ilanları otomatik tespit eder:

1. **Source ID Check:** Sahibinden ilan ID'sine göre
2. **URL Check:** Aynı URL'den gelen ilanlar
3. **Title + Price:** Benzer başlık ve fiyat kombinasyonu

Duplicate ilanlar `duplicate` status'ü alır ve ana tabloya aktarılmaz.

---

## 📈 İstatistikler ve Monitoring

### Crawler Stats

```bash
curl http://localhost:8000/stats
```

**Dönen Bilgiler:**

- Rate limiter durumu
- Aktif job sayısı
- Block rate (%)
- Current delay

### Admin Panel Stats

- Bekleyen ilanlar
- Onaylanan ilanlar
- Toplam ilan sayısı
- Başarı oranı

---

## 🐛 Troubleshooting

### Crawler Başlamıyor

**Sorun:** `Crawler API'ye ulaşılamıyor`

**Çözüm:**

```bash
# Crawler servisinin çalıştığından emin ol
cd crwal4ai
uvicorn crawler_api:app --host 0.0.0.0 --port 8000
```

### Cloudflare Challenge

**Sorun:** Cloudflare challenge geçilemiyor

**Çözüm:**

1. `HEADLESS=false` olarak ayarla
2. Manuel olarak Cloudflare'ı geç
3. Session korunur, sonraki istekler otomatik geçer

### Rate Limit

**Sorun:** Çok fazla 429 hatası

**Çözüm:**

- `maxPages` değerini düşür
- Rate limiter otomatik olarak yavaşlar
- Birkaç dakika bekle

### Duplicate İlanlar

**Sorun:** Tüm ilanlar duplicate olarak işaretleniyor

**Çözüm:**

```sql
-- Supabase'de duplicate flag'leri temizle
UPDATE collected_listings
SET status = 'pending'
WHERE status = 'duplicate';
```

---

## 🚀 Production Deployment

### Docker ile Deploy

```bash
cd crwal4ai

# Docker image oluştur
docker build -t sahibinden-crawler .

# Container başlat
docker run -d \
  -p 8000:8000 \
  -e SUPABASE_URL=your-url \
  -e SUPABASE_KEY=your-key \
  -e HEADLESS=true \
  --name crawler \
  sahibinden-crawler
```

### Systemd Service (Linux)

```bash
# /etc/systemd/system/crawler.service
[Unit]
Description=Sahibinden Crawler API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/demir-gayrimenkul/crwal4ai
Environment="PATH=/var/www/demir-gayrimenkul/crwal4ai/venv/bin"
ExecStart=/var/www/demir-gayrimenkul/crwal4ai/venv/bin/uvicorn crawler_api:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable crawler
sudo systemctl start crawler
sudo systemctl status crawler
```

---

## 📝 API Referansı

### GET /health

Crawler durumunu kontrol eder.

**Response:**

```json
{
  "status": "healthy",
  "crawler_ready": true,
  "is_crawling": false,
  "active_jobs": 0,
  "rate_limiter": {
    "current_delay": 3.2,
    "backoff_level": 0,
    "block_rate": "0.0%"
  }
}
```

### POST /crawl

Tarama başlatır.

**Request:**

```json
{
  "url": "https://www.sahibinden.com/satilik/sakarya-hendek",
  "maxPages": 5,
  "withDetails": false,
  "maxDetails": 10
}
```

**Response:**

```json
{
  "success": true,
  "jobId": "job_20250128_143022",
  "totalListings": 45,
  "message": "5 sayfa tarandı, 45 ilan bulundu"
}
```

### GET /jobs/{jobId}

Job durumunu sorgular.

**Response:**

```json
{
  "id": "job_20250128_143022",
  "status": "completed",
  "url": "https://www.sahibinden.com/satilik/sakarya-hendek",
  "startedAt": "2025-01-28T14:30:22",
  "completedAt": "2025-01-28T14:35:18",
  "totalListings": 45
}
```

---

## 🎓 Best Practices

### 1. Rate Limiting'e Uyun

- Günde maksimum 500-1000 ilan çekin
- Gece saatlerinde çalıştırın
- Aynı kategoriyi sık sık taramayın

### 2. Duplicate Kontrolü

- Her taramadan önce mevcut ilanları kontrol edin
- `sourceId` bazlı duplicate detection kullanın

### 3. Monitoring

- Crawler health'i düzenli kontrol edin
- Rate limiter stats'ları takip edin
- Block rate %10'un üzerine çıkarsa durdurun

### 4. Data Quality

- Onaylamadan önce ilanları manuel kontrol edin
- Eksik bilgili ilanları reddedin
- Fiyat ve konum bilgisi zorunlu

---

## 📞 Destek

Sorun yaşarsanız:

1. Crawler logs'ları kontrol edin
2. `/health` endpoint'ini test edin
3. Supabase bağlantısını doğrulayın
4. Rate limiter stats'larına bakın

---

**Hazırlayan:** DEMİR-NET AI Team  
**Versiyon:** 1.0.0  
**Son Güncelleme:** 28 Ocak 2025
