# Database Schema Fix - Özet Rapor

**Tarih:** 2025-01-27  
**Durum:** ✅ TAMAMLANDI

---

## 🎯 Sorun

Mining API ve Crawler sistemi eksik tablo/kolonlar nedeniyle çalışmıyordu.

### Hatalar:

1. `mining_jobs.job_type` kolonu eksik
2. `mining_jobs.source` kolonu eksik
3. `mining_jobs.config` kolonu eksik
4. `mining_jobs.progress` kolonu eksik
5. `mining_jobs.stats` kolonu eksik
6. `sahibinden_liste.tarih` kolonu eksik
7. `mining_jobs.category`, `transaction`, `job_id` kolonları NOT NULL (ama kullanılmıyor)

---

## ✅ Çözüm

### 1. Eksik Kolonlar Eklendi

```sql
-- mining_jobs tablosu
ALTER TABLE mining_jobs
ADD COLUMN job_type VARCHAR(50) NOT NULL,
ADD COLUMN source VARCHAR(50) DEFAULT 'sahibinden' NOT NULL,
ADD COLUMN config JSONB DEFAULT '{}',
ADD COLUMN progress JSONB DEFAULT '{}',
ADD COLUMN stats JSONB DEFAULT '{}';

-- sahibinden_liste tablosu
ALTER TABLE sahibinden_liste
ADD COLUMN tarih TEXT;
```

### 2. Schema Düzeltmeleri

```sql
-- Eski kolonları nullable yap (artık kullanılmıyor)
ALTER TABLE mining_jobs
ALTER COLUMN category DROP NOT NULL,
ALTER COLUMN transaction DROP NOT NULL,
ALTER COLUMN job_id DROP NOT NULL;
```

**Neden?**

- Yeni API tasarımı `config` JSONB kolonunda kategori/transaction bilgilerini saklıyor
- `job_id` kolonu gereksiz (zaten `id` primary key var)

### 3. Index'ler Eklendi

```sql
CREATE INDEX idx_mining_jobs_job_type ON mining_jobs(job_type);
CREATE INDEX idx_mining_jobs_status_type ON mining_jobs(status, job_type);
CREATE INDEX idx_mining_jobs_source ON mining_jobs(source);
```

---

## 🧪 Test Sonuçları

### Mining API Test

```bash
POST /jobs/list-crawl
{
  "categories": ["konut_satilik"],
  "max_pages": 2
}

✅ Response: 200 OK
{
  "message": "Liste crawler başlatıldı",
  "job_id": "f18a1368-75cf-4da6-aba7-f20f13587fc6"
}
```

### Crawler Test

```
✅ Browser başlatıldı
✅ Cloudflare bypass başarılı
✅ İlanlar çekildi ve kaydedildi
✅ Job progress güncellendi
```

---

## 📊 Veritabanı Durumu

### mining_jobs Tablosu (Final Schema)

| Kolon       | Tip         | Nullable | Default           | Açıklama                                     |
| ----------- | ----------- | -------- | ----------------- | -------------------------------------------- |
| id          | UUID        | NO       | gen_random_uuid() | Primary key                                  |
| job_type    | VARCHAR(50) | NO       | -                 | Job tipi (list_crawl, detail_crawl)          |
| source      | VARCHAR(50) | NO       | 'sahibinden'      | Kaynak (sahibinden, emlakjet)                |
| status      | VARCHAR     | NO       | 'pending'         | Durum (pending, running, completed, failed)  |
| config      | JSONB       | YES      | '{}'              | Job konfigürasyonu (categories, max_pages)   |
| progress    | JSONB       | YES      | '{}'              | İlerleme durumu (current, total, percentage) |
| stats       | JSONB       | YES      | '{}'              | İstatistikler (detaylı metrikler)            |
| category    | VARCHAR     | YES      | -                 | ⚠️ DEPRECATED (config'de saklanıyor)         |
| transaction | VARCHAR     | YES      | -                 | ⚠️ DEPRECATED (config'de saklanıyor)         |
| job_id      | VARCHAR     | YES      | -                 | ⚠️ DEPRECATED (id kullanılıyor)              |
| created_at  | TIMESTAMPTZ | NO       | now()             | Oluşturulma zamanı                           |
| updated_at  | TIMESTAMPTZ | NO       | now()             | Güncellenme zamanı                           |

### sahibinden_liste Tablosu (Final Schema)

| Kolon       | Tip         | Nullable | Açıklama                             |
| ----------- | ----------- | -------- | ------------------------------------ |
| id          | BIGINT      | NO       | İlan ID (sahibinden.com)             |
| baslik      | TEXT        | YES      | İlan başlığı                         |
| link        | TEXT        | YES      | İlan linki                           |
| fiyat       | BIGINT      | YES      | Fiyat (TL)                           |
| konum       | TEXT        | YES      | Konum                                |
| category    | TEXT        | NO       | Kategori (konut, arsa, isyeri, bina) |
| transaction | TEXT        | NO       | İşlem tipi (satilik, kiralik)        |
| resim       | TEXT        | YES      | Resim URL                            |
| tarih       | TEXT        | YES      | İlan tarihi (string)                 |
| crawled_at  | TIMESTAMPTZ | NO       | Taranma zamanı                       |
| updated_at  | TIMESTAMPTZ | NO       | Güncellenme zamanı                   |
| created_at  | TIMESTAMPTZ | NO       | Oluşturulma zamanı                   |

---

## 🚀 Sonraki Adımlar

1. ✅ Mining API çalışıyor
2. ✅ Crawler çalışıyor
3. ⏳ Frontend'de job takibi test edilecek
4. ⏳ Removed listings detection optimize edilecek
5. ⏳ Price history tracking test edilecek

---

## 📝 Notlar

### API Kullanımı

```python
# Job oluşturma
job_data = {
    "job_type": "list_crawl",
    "source": "sahibinden",
    "status": "pending",
    "config": {
        "categories": ["konut_satilik", "arsa_satilik"],
        "max_pages": 50
    },
    "progress": {"current": 0, "total": 0, "percentage": 0},
    "stats": {}
}
```

### Crawler Kullanımı

```bash
# Liste crawler
python sahibinden_uc_batch_supabase.py --categories konut_satilik arsa_satilik --max-pages 50 --job-id <uuid>

# Mining API ile
curl -X POST http://localhost:8765/jobs/list-crawl \
  -H "Content-Type: application/json" \
  -d '{"categories": ["konut_satilik"], "max_pages": 50}'
```

---

**Hazırlayan:** Kiro AI Agent  
**Versiyon:** 1.0  
**Durum:** Production Ready ✅
