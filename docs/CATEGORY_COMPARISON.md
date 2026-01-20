# Kategori Karşılaştırma - Sahibinden vs Database

## 🎯 Özellik

Crawler başlamadan önce **Sahibinden'deki ilan sayılarını** okuyup **veritabanımızdakilerle karşılaştırır**.

## 📊 Ne Gösterir?

### 1. Yeni İlanlar (🆕 NEW)

```
Sahibinden: 838 ilan
Database: 606 ilan
Fark: +232 yeni ilan
```

### 2. Kaldırılan İlanlar (📤 REMOVED)

```
Sahibinden: 100 ilan
Database: 120 ilan
Fark: -20 kaldırılan ilan
```

### 3. Senkron (✅ SYNCED)

```
Sahibinden: 16 ilan
Database: 16 ilan
Fark: 0 (senkron)
```

## 🔧 Teknik Detaylar

### Backend (Python Crawler)

**Dosya:** `crwal4ai/sahibinden_uc_batch_supabase.py`

#### 1. Ana Sayfadan Kategori Sayılarını Oku

```python
def extract_category_counts(self, html: str) -> Dict[str, int]:
    """
    https://www.sahibinden.com/emlak/sakarya-hendek

    HTML:
    <li class="cl1">
        <a href="/emlak-konut/sakarya-hendek">Konut</a>
        <span>(838)</span>
    </li>

    Returns:
        {"konut": 838, "arsa": 1286, "isyeri": 143, "bina": 16}
    """
```

#### 2. Veritabanı ile Karşılaştır

```python
def compare_with_database(self, sahibinden_counts: Dict[str, int]) -> Dict:
    """
    Returns:
    {
        "konut": {
            "sahibinden": 838,
            "database": 606,
            "diff": 232,
            "status": "new"
        },
        "arsa": {
            "sahibinden": 1286,
            "database": 1257,
            "diff": 29,
            "status": "new"
        },
        ...
    }
    """
```

#### 3. Crawler Başlangıcında Çalıştır

```python
def run(self, categories, max_pages):
    # İLK ÖNCE: Kategori analizi
    main_page_url = "https://www.sahibinden.com/emlak/sakarya-hendek"
    main_html = self.navigate(main_page_url)

    sahibinden_counts = self.extract_category_counts(main_html)
    comparison = self.compare_with_database(sahibinden_counts)

    # Job'a kaydet
    self._update_job_stats(extra_data={"category_comparison": comparison})

    # Özet log
    total_new = sum(c["diff"] for c in comparison.values() if c["status"] == "new")
    total_removed = sum(abs(c["diff"]) for c in comparison.values() if c["status"] == "removed")

    logger.info(f"🆕 Toplam yeni ilan: {total_new:,}")
    logger.info(f"📤 Toplam kaldırılan: {total_removed:,}")

    # Sonra kategorileri tara...
```

### Frontend (Admin Panel)

**Dosya:** `src/app/admin/veri-toplama/page.tsx`

#### UI Bileşeni

```tsx
{
  /* Kategori Karşılaştırması */
}
{
  activeJob.stats?.category_comparison && (
    <div className="bg-slate-700/50 p-4 rounded">
      <p className="text-xs text-slate-400 mb-3 font-bold uppercase">
        📊 Kategori Analizi (Sahibinden vs Database)
      </p>

      {/* Her kategori için kart */}
      {Object.entries(activeJob.stats.category_comparison).map(
        ([category, data]) => (
          <div key={category} className="card">
            <div className="header">
              <p>{category}</p>
              {data.status === "new" && <span>🆕 YENİ</span>}
              {data.status === "removed" && <span>📤 KALDIRILDI</span>}
              {data.status === "synced" && <span>✅ SENKRON</span>}
            </div>

            <div className="stats">
              <div>Sahibinden: {data.sahibinden}</div>
              <div>Database: {data.database}</div>
              <div>
                Fark: {data.diff > 0 ? "+" : ""}
                {data.diff}
              </div>
            </div>
          </div>
        ),
      )}

      {/* Özet */}
      <div className="summary">
        <div>Toplam Yeni: +{totalNew}</div>
        <div>Toplam Kaldırılan: -{totalRemoved}</div>
      </div>
    </div>
  );
}
```

## 📈 Örnek Görünüm

```
┌─────────────────────────────────────────────────────────┐
│ 📊 Kategori Analizi (Sahibinden vs Database)           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│ │ Konut        │  │ Arsa         │  │ İşyeri       │  │
│ │ 🆕 YENİ      │  │ 🆕 YENİ      │  │ ✅ SENKRON   │  │
│ │              │  │              │  │              │  │
│ │ Sahibinden:  │  │ Sahibinden:  │  │ Sahibinden:  │  │
│ │ 838          │  │ 1,286        │  │ 143          │  │
│ │              │  │              │  │              │  │
│ │ Database:    │  │ Database:    │  │ Database:    │  │
│ │ 606          │  │ 1,257        │  │ 143          │  │
│ │              │  │              │  │              │  │
│ │ Fark: +232   │  │ Fark: +29    │  │ Fark: 0      │  │
│ └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
│ ┌──────────────┐  ┌──────────────┐                    │
│ │ Bina         │  │ Konut Kiralık│                    │
│ │ ✅ SENKRON   │  │ 📤 KALDIRILDI│                    │
│ │              │  │              │                    │
│ │ Sahibinden:  │  │ Sahibinden:  │                    │
│ │ 16           │  │ 200          │                    │
│ │              │  │              │                    │
│ │ Database:    │  │ Database:    │                    │
│ │ 16           │  │ 220          │                    │
│ │              │  │              │                    │
│ │ Fark: 0      │  │ Fark: -20    │                    │
│ └──────────────┘  └──────────────┘                    │
│                                                         │
│ ┌─────────────────────┬─────────────────────┐          │
│ │ Toplam Yeni İlan    │ Toplam Kaldırılan   │          │
│ │      +261           │        -20          │          │
│ └─────────────────────┴─────────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

## 🎯 Kullanım Senaryoları

### Senaryo 1: Günlük Kontrol

```
1. Crawler'ı başlat
2. İlk ekranda kategori analizi görünür
3. Hangi kategoride yeni ilan var görebilirsin
4. Sadece o kategorileri tarayabilirsin
```

### Senaryo 2: Kaldırılan İlan Tespiti

```
1. Analiz: "Konut Kiralık: -20 kaldırılan"
2. Bu ilanlar Sahibinden'den kaldırılmış
3. Veritabanında hala var
4. Manuel olarak "pasif" yapılabilir
```

### Senaryo 3: Senkronizasyon Kontrolü

```
1. Tüm kategoriler "✅ SENKRON" ise
2. Taramaya gerek yok
3. Zaman tasarrufu
```

## 📊 Log Örnekleri

```
2026-01-19 12:00:00 - INFO - 📊 Kategori analizi yapılıyor...
2026-01-19 12:00:05 - INFO -    Konut: 838 ilan
2026-01-19 12:00:05 - INFO -    İş Yeri: 143 ilan
2026-01-19 12:00:05 - INFO -    Arsa: 1,286 ilan
2026-01-19 12:00:05 - INFO -    Bina: 16 ilan
2026-01-19 12:00:05 - INFO - 📊 Kategori sayıları: {'konut': 838, 'isyeri': 143, 'arsa': 1286, 'bina': 16}
2026-01-19 12:00:06 - INFO -    🆕 Konut: +232 yeni ilan (Sahibinden: 838, DB: 606)
2026-01-19 12:00:06 - INFO -    ✅ İşyeri: Senkron (Her ikisi: 143)
2026-01-19 12:00:06 - INFO -    🆕 Arsa: +29 yeni ilan (Sahibinden: 1,286, DB: 1,257)
2026-01-19 12:00:06 - INFO -    ✅ Bina: Senkron (Her ikisi: 16)
2026-01-19 12:00:06 - INFO -
2026-01-19 12:00:06 - INFO - 📈 Analiz Özeti:
2026-01-19 12:00:06 - INFO -    🆕 Toplam yeni ilan: 261
2026-01-19 12:00:06 - INFO -    📤 Toplam kaldırılan: 0
```

## 🚀 Avantajlar

### 1. Proaktif Bilgi

- ✅ Taramadan önce ne bekleyeceğini bilirsin
- ✅ Hangi kategoride değişiklik var görürsün
- ✅ Gereksiz tarama yapmazsın

### 2. Veri Kalitesi

- ✅ Kaldırılan ilanları tespit edersin
- ✅ Veritabanı temizliği yapabilirsin
- ✅ Senkronizasyon kontrolü

### 3. Zaman Tasarrufu

- ✅ Senkron kategorileri atlayabilirsin
- ✅ Sadece değişen kategorileri tararsın
- ✅ Daha hızlı güncelleme

## 🧪 Test

```bash
# Test 1: Crawler başlat ve analizi gözlemle
python sahibinden_uc_batch_supabase.py --categories all

# Beklenen çıktı:
# 📊 Kategori analizi yapılıyor...
#    Konut: 838 ilan
#    Arsa: 1,286 ilan
#    ...
# 🆕 Toplam yeni ilan: 261
# 📤 Toplam kaldırılan: 0

# Test 2: Admin panelinde görüntüle
# http://localhost:3000/admin/veri-toplama
# "Taramayı Başlat" tıkla
# "Kategori Analizi" kartını gör
```

## 📝 Notlar

- Analiz **her crawler başlangıcında** otomatik çalışır
- Ana emlak sayfası (`/emlak/sakarya-hendek`) taranır
- Karşılaştırma **job stats'a** kaydedilir
- Frontend **real-time** güncellenir
- Kaldırılan ilanlar **otomatik silinmez** (manuel kontrol gerekir)

---

**Tarih:** 2026-01-19
**Durum:** ✅ Implement Edildi - `_update_job_stats()` Metodu Eklendi
**Test:** ⏳ Test Edilmeye Hazır

## ✅ Son Güncelleme (2026-01-19)

### Eklenen: `_update_job_stats()` Metodu

**Problem:** Backend'de `_update_job_stats()` metodu tanımlı değildi, bu yüzden `category_comparison` verisi job'a kaydedilmiyordu.

**Çözüm:** Metod eklendi:

```python
def _update_job_stats(self, extra_data: dict = None):
    """Job stats'ı güncelle (category_comparison gibi ekstra veriler için)"""
    if not self.job_id or not self.supabase:
        return
    try:
        update_data = {
            "stats": {**self.stats, **(extra_data or {})},
            "updated_at": datetime.now().isoformat(),
        }
        self.supabase.table("mining_jobs").update(update_data).eq("id", self.job_id).execute()
        logger.debug(f"Job stats güncellendi: {extra_data}")
    except Exception as e:
        logger.warning(f"Job stats güncellenemedi: {e}")
```

**Kullanım:**

```python
# run() metodunda
comparison = self.compare_with_database(sahibinden_counts)
self._update_job_stats(extra_data={"category_comparison": comparison})
```

### Tüm Özellikler Tamamlandı ✅

1. ✅ `extract_category_counts()` - Ana sayfadan kategori sayılarını okur
2. ✅ `compare_with_database()` - Sahibinden vs DB karşılaştırması yapar
3. ✅ `_update_job_stats()` - **YENİ** - Karşılaştırma sonucunu job'a kaydeder
4. ✅ `run()` - Analizi crawler başlamadan önce yapar
5. ✅ Frontend UI - Kategori karşılaştırma kartları
6. ✅ API - Job stats'ı döndürür
7. ✅ Real-time polling - Otomatik güncelleme

### Test Senaryoları

#### Test 1: Backend Console

```bash
cd yy/demir-gayrimenkul/crwal4ai
python sahibinden_uc_batch_supabase.py --categories konut_satilik --max-pages 2 --job-id test-123
```

**Beklenen:**

```
📊 Kategori analizi yapılıyor...
   Konut: 838 ilan
   Arsa: 1,286 ilan
   ...
📈 Analiz Özeti:
   🆕 Toplam yeni ilan: 232
   📤 Toplam kaldırılan: 0
```

#### Test 2: Frontend UI

1. `/admin/veri-toplama` sayfasına git
2. "Taramayı Başlat" tıkla
3. "Aktif İş" bölümünde "Kategori Analizi" kartlarını gör
4. Real-time güncellemeyi gözlemle

**Beklenen:**

- Her kategori için kart görünmeli
- Status doğru olmalı (🆕/📤/✅)
- Özet doğru hesaplanmalı

#### Test 3: Database Kontrolü

```sql
-- Supabase'de job'u kontrol et
SELECT stats FROM mining_jobs WHERE id = 'test-123';

-- Beklenen:
{
  "category_comparison": {
    "konut": {
      "sahibinden": 838,
      "database": 606,
      "diff": 232,
      "status": "new"
    },
    ...
  }
}
```
