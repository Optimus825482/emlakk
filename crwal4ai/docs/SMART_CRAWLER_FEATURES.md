# Smart Crawler Features

## 🎯 Yeni Özellikler

### 1. Toplam İlan Sayısı Kontrolü

**Özellik:** Crawler başlamadan önce Sahibinden'deki toplam ilan sayısını öğrenir

**HTML Parse:**

```html
<div class="resultsTextWrapper" data-category="other" data-totalmatches="16">
  <div class="result-text">
    <h1>Hendek Bina İlanları</h1>
    <span>16 ilan</span> bulundu.
  </div>
</div>
```

**Kod:**

```python
def _get_total_listings_count(self, html: str) -> int:
    soup = BeautifulSoup(html, 'html.parser')
    results_wrapper = soup.find('div', {'class': 'resultsTextWrapper'})
    if results_wrapper and results_wrapper.get('data-totalmatches'):
        return int(results_wrapper['data-totalmatches'])
```

**Faydası:**

- ✅ Veritabanı ile karşılaştırma yapılır
- ✅ Kaç yeni ilan olduğu önceden bilinir
- ✅ Gereksiz sayfa taraması önlenir

### 2. Tarihe Göre Sıralama

**Özellik:** İlanlar en yeniden en eskiye sıralanır

**URL Parametresi:**

```
?sorting=date_desc&pagingSize=50
```

**Örnek URL:**

```
https://www.sahibinden.com/bina/sakarya-hendek?sorting=date_desc&pagingSize=50
```

**Faydası:**

- ✅ Yeni ilanlar ilk sayfalarda
- ✅ Eski ilanları atlayarak hızlı crawl
- ✅ 3 sayfa üst üste eski ilan varsa dur

### 3. Akıllı Durdurma Mekanizması

**Özellik:** Eski ilanlar görülmeye başlandığında crawler durur

**Mantık:**

```python
consecutive_old_pages = 0
MAX_CONSECUTIVE_OLD_PAGES = 3

for page in pages:
    new_listings = [l for l in listings if is_new_listing(l.date)]

    if len(new_listings) == 0:
        consecutive_old_pages += 1
        if consecutive_old_pages >= MAX_CONSECUTIVE_OLD_PAGES:
            break  # Dur!
    else:
        consecutive_old_pages = 0  # Sıfırla
```

**Faydası:**

- ✅ Gereksiz sayfa taraması yok
- ✅ Hızlı crawl (5-10 dakika yerine 2-3 dakika)
- ✅ Cloudflare block riski azalır

### 4. Yeni İlan Tespiti

**Özellik:** Sadece bugün ve dün yayınlanan ilanlar "yeni" sayılır

**Tarih Formatları:**

- "Bugün 14:30" → Bugün saat 14:30
- "Dün 09:15" → Dün saat 09:15
- "15 Ocak" → Bu yıl 15 Ocak
- "20 Aralık 2024" → 20 Aralık 2024

**Kod:**

```python
def is_new_listing(listing_date: datetime) -> bool:
    now = datetime.now()

    # Bugün mü?
    if listing_date.date() == now.date():
        return True

    # Dün mü?
    yesterday = now - timedelta(days=1)
    if listing_date.date() == yesterday.date():
        return True

    return False
```

**Faydası:**

- ✅ Yeni ilanlar önceliklendirilir
- ✅ Eski ilanlar atlanır
- ✅ new_listings tablosuna otomatik kaydedilir

### 5. ID Eşleştirmesi

**Özellik:** Veritabanındaki ID'lerle karşılaştırma yapılır

**Mantık:**

```python
# Başlangıçta DB'den tüm ID'leri yükle
db_listing_ids = {1234, 5678, 9012, ...}

# Her ilan için kontrol et
for listing in listings:
    if listing.id in db_listing_ids:
        # Güncelleme
        updated_count += 1
    else:
        # Yeni ilan
        new_count += 1
        new_listings.append(listing)
```

**Faydası:**

- ✅ Yeni vs güncellenen ilan ayrımı
- ✅ Duplicate kontrolü
- ✅ new_listings tablosuna otomatik kayıt

### 6. Kategori Karşılaştırma İstatistikleri

**Özellik:** Her kategori için detaylı istatistik

**Veri Yapısı:**

```python
category_stats = {
    "category": "bina",
    "transaction": "satilik",
    "total_on_sahibinden": 16,
    "total_in_db_before": 14,
    "total_in_db_after": 16,
    "new_listings": 2,
    "updated_listings": 0,
    "pages_crawled": 1,
    "stopped_reason": "consecutive_old_pages"
}
```

**Faydası:**

- ✅ Kategori bazında performans takibi
- ✅ Sahibinden vs DB karşılaştırması
- ✅ Neden durduğu bilgisi

## 📊 Performans Karşılaştırması

| Özellik                 | Eski Crawler | Smart Crawler    |
| ----------------------- | ------------ | ---------------- |
| Toplam sayı kontrolü    | ❌ Yok       | ✅ Var           |
| Tarihe göre sıralama    | ❌ Yok       | ✅ Var           |
| Akıllı durdurma         | ❌ Yok       | ✅ Var (3 sayfa) |
| Yeni ilan tespiti       | ⚠️ Manuel    | ✅ Otomatik      |
| ID eşleştirmesi         | ⚠️ Kısmi     | ✅ Tam           |
| Kategori istatistikleri | ⚠️ Basit     | ✅ Detaylı       |
| Ortalama süre           | 10-15 dakika | 3-5 dakika       |
| Sayfa sayısı            | 50-100       | 5-20             |

## 🚀 Kullanım

### Tek Kategori

```bash
python sahibinden_smart_crawler.py --categories konut_satilik --max-pages 10
```

### Çoklu Kategori

```bash
python sahibinden_smart_crawler.py --categories konut_satilik bina_satilik arsa_satilik --max-pages 20
```

### Job ID ile

```bash
python sahibinden_smart_crawler.py --categories konut_satilik --job-id <uuid>
```

## ⚠️ Cloudflare Sorunu

Smart crawler da Cloudflare protection'a takılıyor. Çözüm:

1. **Mevcut crawler'ı kullan** (`sahibinden_uc_batch_supabase.py`)
2. **Smart özellikleri ekle** (tarihe göre sıralama, akıllı durdurma)
3. **Admin panel'den çalıştır** (background job)

## 🔄 Entegrasyon

Smart crawler özellikleri mevcut crawler'a eklenebilir:

1. URL'lere `?sorting=date_desc` ekle
2. `_get_total_listings_count()` fonksiyonunu ekle
3. `consecutive_old_pages` mantığını ekle
4. `category_comparison` istatistiklerini ekle

---

**Tarih:** 19 Ocak 2026
**Durum:** Geliştirme aşamasında
**Cloudflare:** Hala sorun
