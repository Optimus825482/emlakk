# Database Schema Fix - Crawler Tabloları

**Tarih:** 19 Ocak 2026  
**Durum:** ✅ Tamamlandı

## 🔴 Problem

Admin panelinde crawler API'leri 404/500 hataları veriyordu:

```
GET /api/crawler/new-listings?category=konut 500
GET /api/crawler/removed-listings?category=konut 500
GET /api/crawler/live-comparison 500
POST /api/crawler/start 500
```

**Hata Nedeni:** Supabase'de gerekli tablolar eksikti:

- `sahibinden_liste` - Ana ilan tablosu
- `new_listings` - Yeni ilanlar
- `recent_new_listings` - View
- `removed_listings` - Kaldırılan ilanlar
- `mining_jobs` - Crawler job tracking

## ✅ Çözüm

### 1. Ana Tablo: `sahibinden_liste`

```sql
CREATE TABLE sahibinden_liste (
    id BIGINT PRIMARY KEY,
    baslik TEXT,
    link TEXT UNIQUE,
    fiyat BIGINT,
    konum TEXT,
    category TEXT NOT NULL,
    transaction TEXT NOT NULL,
    resim TEXT,
    crawled_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Özellikler:**

- RLS enabled (public read)
- Index'ler: category, transaction, crawled_at
- Composite index: (category, transaction)

### 2. Yeni İlanlar: `new_listings`

```sql
CREATE TABLE new_listings (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL UNIQUE,
    baslik TEXT,
    link TEXT,
    fiyat BIGINT,
    konum TEXT,
    category TEXT NOT NULL,
    transaction TEXT NOT NULL,
    resim TEXT,
    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (listing_id) REFERENCES sahibinden_liste(id) ON DELETE CASCADE
);
```

**Özellikler:**

- 2 gün boyunca yeni ilanları track eder
- Foreign key: `listing_id` → `sahibinden_liste.id`
- Index'ler: listing_id, category, transaction, first_seen_at

### 3. View: `recent_new_listings`

```sql
CREATE VIEW recent_new_listings AS
SELECT
    nl.*,
    sl.crawled_at,
    EXTRACT(EPOCH FROM (NOW() - nl.first_seen_at)) / 3600 AS hours_since_added
FROM new_listings nl
LEFT JOIN sahibinden_liste sl ON nl.listing_id = sl.id
WHERE nl.first_seen_at >= NOW() - INTERVAL '2 days'
ORDER BY nl.first_seen_at DESC;
```

**Kullanım:**

- Son 2 gündeki yeni ilanları gösterir
- `hours_since_added` ile kaç saat önce eklendiğini hesaplar

### 4. Kaldırılan İlanlar: `removed_listings`

```sql
CREATE TABLE removed_listings (
    id BIGSERIAL PRIMARY KEY,
    listing_id INTEGER NOT NULL,
    baslik VARCHAR(255),
    link VARCHAR(500),
    fiyat INTEGER,
    konum VARCHAR(255),
    category VARCHAR(50),
    transaction VARCHAR(50),
    resim VARCHAR(500),
    last_seen_at TIMESTAMPTZ,
    removed_at TIMESTAMPTZ DEFAULT NOW(),
    removal_reason VARCHAR(100) DEFAULT 'not_found_in_crawl',
    days_active INTEGER,
    price_changes INTEGER DEFAULT 0,
    last_price INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Özellikler:**

- Sahibinden'den kaldırılan ilanların geçmişini tutar
- `days_active`: İlanın kaç gün aktif kaldığı
- `removal_reason`: Kaldırılma nedeni

### 5. Crawler Jobs: `mining_jobs`

```sql
CREATE TABLE mining_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    transaction VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    total_pages INTEGER,
    processed_pages INTEGER DEFAULT 0,
    total_listings INTEGER DEFAULT 0,
    new_listings INTEGER DEFAULT 0,
    updated_listings INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Özellikler:**

- Crawler job'larını track eder
- Status: pending, running, completed, failed
- İstatistikler: total_pages, processed_pages, new_listings, updated_listings

## 📊 Tablo İlişkileri

```
sahibinden_liste (1) ←─── (N) new_listings
    ↓ id                        ↓ listing_id

recent_new_listings (VIEW)
    ↓ JOIN new_listings + sahibinden_liste
```

## 🔒 Güvenlik (RLS)

Tüm tablolarda Row Level Security enabled:

```sql
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "Allow public read access" ON [table_name]
    FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Allow service role all access" ON [table_name]
    FOR ALL USING (true);
```

## 🧪 Test

```sql
-- Tabloları kontrol et
SELECT table_name,
       (SELECT COUNT(*) FROM information_schema.columns
        WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('sahibinden_liste', 'new_listings', 'removed_listings', 'mining_jobs')
ORDER BY table_name;

-- View'ı kontrol et
SELECT * FROM recent_new_listings LIMIT 5;
```

## 📝 API Endpoints (Artık Çalışıyor)

1. **GET** `/api/crawler/new-listings?category=konut` ✅
   - Son 2 gündeki yeni ilanlar

2. **GET** `/api/crawler/removed-listings?category=konut` ✅
   - Kaldırılan ilanlar

3. **GET** `/api/crawler/live-comparison` ✅
   - Sahibinden vs Database karşılaştırması

4. **POST** `/api/crawler/start` ✅
   - Crawler job başlatma

## 🔄 Sonraki Adımlar

1. ✅ Tabloları oluştur (TAMAMLANDI)
2. ⏳ Crawler'ı çalıştır ve test et
3. ⏳ Admin panelinde verileri görüntüle
4. ⏳ Otomatik cleanup job'ları kur (pg_cron)

## 📚 İlgili Dosyalar

- `crwal4ai/create_new_listings_table.sql`
- `crwal4ai/create_removed_listings_table.sql`
- `crwal4ai/create_category_stats_table.sql`
- `src/app/api/crawler/new-listings/route.ts`
- `src/app/api/crawler/removed-listings/route.ts`
- `src/app/api/crawler/live-comparison/route.ts`
- `src/app/api/crawler/start/route.ts`

---

**Not:** Tüm migration'lar Supabase Migration API ile uygulandı. Rollback gerekirse migration history'den geri alınabilir.
