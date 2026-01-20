# Sahibinden İnceleme Sistemi

## Genel Bakış

Sahibinden.com'dan emlak ilanlarını toplayan, karşılaştıran ve analiz eden kapsamlı bir sistem.

## Özellikler

### 1. 4 Ana Kategori

- **Konut** (Satılık/Kiralık)
- **Arsa** (Satılık)
- **İşyeri** (Satılık/Kiralık)
- **Bina** (Satılık)

### 2. Veri Toplama

- Undetected ChromeDriver ile Cloudflare bypass
- Adaptive Rate Limiter ile akıllı bekleme
- Batch insert ile hızlı kayıt
- Job tracking ile ilerleme takibi

### 3. Karşılaştırma

- Sahibinden vs Veritabanı karşılaştırması
- Gerçek zamanlı fark hesaplama
- Kategori bazlı istatistikler

### 4. Yeni İlanlar Takibi

- 2 gün boyunca "yeni" olarak işaretleme
- `new_listings` tablosunda saklama
- Otomatik cleanup (2 günden eski kayıtlar silinir)
- Son 24 saat / 48 saat filtreleme

### 5. Kaldırılan İlanlar Takibi

- Crawl sırasında otomatik tespit
- `removed_listings` tablosuna kayıt
- Kaldırılma nedeni ve tarihi
- İlan aktif kalma süresi hesaplama

## Veritabanı Tabloları

### `sahibinden_liste`

Ana ilan tablosu - tüm ilanlar burada saklanır.

```sql
- id (BIGINT, PK)
- baslik (TEXT)
- link (TEXT)
- fiyat (BIGINT)
- konum (TEXT)
- category (TEXT)
- transaction (TEXT)
- resim (TEXT)
- tarih (TIMESTAMPTZ)
- crawled_at (TEXT)
```

### `new_listings`

Son 2 gündeki yeni ilanlar.

```sql
- id (BIGSERIAL, PK)
- listing_id (BIGINT, UNIQUE)
- baslik, link, fiyat, konum, category, transaction, resim
- first_seen_at (TIMESTAMPTZ) -- İlk görülme tarihi
- created_at (TIMESTAMPTZ)
```

**Views:**

- `recent_new_listings` - Son 2 gündeki yeni ilanlar + kaç saat önce eklendiği
- `new_listings_stats` - Kategori bazlı istatistikler

**Function:**

- `cleanup_old_new_listings()` - 2 günden eski kayıtları temizler

### `removed_listings`

Kaldırılan ilanlar.

```sql
- id (BIGSERIAL, PK)
- listing_id (BIGINT, UNIQUE)
- baslik, link, fiyat, konum, category, transaction, resim
- last_seen_at (TIMESTAMPTZ) -- Son görülme
- removed_at (TIMESTAMPTZ) -- Kaldırılma tarihi
- removal_reason (TEXT) -- Neden kaldırıldı
- days_active (INTEGER) -- Kaç gün aktifti
- price_changes (INTEGER) -- Kaç kez fiyat değişti
- last_price (BIGINT) -- Son fiyatı
- notes (TEXT)
```

**Views:**

- `recent_removed_listings` - Son 30 gündeki kaldırılan ilanlar
- `removed_listings_stats` - Kategori bazlı istatistikler

### `category_stats`

Kategori karşılaştırma verileri.

```sql
- id (BIGSERIAL, PK)
- category (TEXT)
- sahibinden_count (INTEGER)
- database_count (INTEGER)
- diff (INTEGER)
- status (TEXT) -- 'new', 'removed', 'synced'
- last_checked_at (TIMESTAMPTZ)
```

## API Endpoints

### GET `/api/crawler/new-listings`

Son 2 gündeki yeni ilanları döner.

**Response:**

```json
{
  "success": true,
  "data": {
    "listings": [...],
    "groupedByCategory": {...},
    "stats": [...],
    "totalNew": 42,
    "last24h": 15,
    "last48h": 27
  }
}
```

### GET `/api/crawler/removed-listings`

Kaldırılan ilanları döner.

**Response:**

```json
{
  "success": true,
  "data": {
    "listings": [...],
    "groupedByCategory": {...},
    "stats": [...],
    "totalRemoved": 18
  }
}
```

### GET `/api/crawler/live-comparison`

Sahibinden vs DB karşılaştırması.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "category": "konut",
      "sahibinden_count": 838,
      "database_count": 606,
      "diff": 232,
      "status": "new",
      "last_checked_at": "2026-01-19T..."
    }
  ]
}
```

### POST `/api/crawler/start`

Crawler'ı başlatır.

**Request:**

```json
{
  "categories": ["konut_satilik", "arsa_satilik"],
  "maxPages": 5
}
```

**Response:**

```json
{
  "success": true,
  "jobId": "uuid",
  "message": "Crawler başlatıldı"
}
```

### GET `/api/crawler/jobs/[jobId]`

Job durumunu döner.

## Crawler Workflow

1. **Başlatma**
   - Kategoriler seçilir
   - Job oluşturulur
   - Browser başlatılır

2. **Kategori Analizi**
   - Ana emlak sayfasından kategori sayıları çekilir
   - DB ile karşılaştırılır
   - Farklar hesaplanır

3. **Kategori Crawl**
   - Her kategori için:
     - Sayfa sayfa tarama
     - Batch insert ile kayıt
     - Yeni ilanları `new_listings`'e ekle
     - Progress güncelleme

4. **Kaldırılan İlan Tespiti**
   - Kategori tamamlandığında:
     - DB'deki ilanlar vs crawl edilen ilanlar
     - Fark = kaldırılan ilanlar
     - `removed_listings`'e kaydet

5. **Tamamlanma**
   - İstatistikler güncellenir
   - Job tamamlandı olarak işaretlenir
   - Browser kapatılır

## Kullanım

### Admin Paneli

1. **Sahibinden İnceleme** sayfasına git
2. Kategori seç (Konut, Arsa, İşyeri, Bina)
3. Toplanacak alt kategorileri seç (Satılık/Kiralık)
4. "Veri Toplamayı Başlat" butonuna tıkla
5. İlerlemeyi takip et
6. Sonuçları görüntüle:
   - Karşılaştırma (Sahibinden vs DB)
   - Yeni İlanlar (Son 2 gün)
   - Kaldırılan İlanlar

### Python Script

```bash
cd crwal4ai

# Tek kategori
python sahibinden_uc_batch_supabase.py --categories konut_satilik --max-pages 5

# Çoklu kategori
python sahibinden_uc_batch_supabase.py --categories konut_satilik arsa_satilik --max-pages 10

# Job ID ile
python sahibinden_uc_batch_supabase.py --categories konut_satilik --job-id <uuid>
```

## Önemli Notlar

### Rate Limiting

- Adaptive Rate Limiter kullanılır
- Base delay: 3.5 saniye
- Block algılandığında: 90 saniye cooldown
- Dakikada max 12 istek

### Cloudflare Bypass

- Undetected ChromeDriver kullanılır
- Custom Chromium binary: `C:\Users\erkan\undetected-chromium\chromium\chrome-win\chrome.exe`
- Version: 146
- Human-like davranış (scroll, delay, vb.)

### Performans

- Batch insert kullanılır (tek request'te 50 ilan)
- Duplicate kontrolü `seen_ids` set'i ile
- Sayfa başına ~50 ilan
- Kategori başına max 100 sayfa

### Bakım

- `new_listings` tablosu: 2 günde bir temizlenir
- `cleanup_old_new_listings()` fonksiyonu manuel çalıştırılabilir
- Crawler logları `mining_logs` tablosunda

## Dosya Yapısı

```
crwal4ai/
├── sahibinden_uc_batch_supabase.py  # Ana crawler
├── rate_limiter.py                   # Adaptive rate limiter
├── create_new_listings_table.sql     # Yeni ilanlar şeması
├── create_removed_listings_table.sql # Kaldırılan ilanlar şeması
└── create_category_stats_table.sql   # Karşılaştırma şeması

src/
├── app/
│   ├── admin/
│   │   └── sahibinden-inceleme/
│   │       └── page.tsx              # Ana sayfa
│   └── api/
│       └── crawler/
│           ├── new-listings/route.ts
│           ├── removed-listings/route.ts
│           ├── live-comparison/route.ts
│           └── start/route.ts
└── components/
    └── admin/
        └── new-listings-tracker.tsx  # Yeni ilanlar component
```

## Gelecek İyileştirmeler

- [ ] Fiyat değişikliği takibi
- [ ] Email bildirimleri (yeni/kaldırılan ilanlar)
- [ ] Trend analizi (hangi bölgeler popüler)
- [ ] Otomatik crawler scheduling (cron)
- [ ] Export özelliği (Excel, CSV)
- [ ] Gelişmiş filtreleme ve arama
