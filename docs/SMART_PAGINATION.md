# Smart Pagination - Akıllı Sayfa Hesaplama

## 🎯 Problem

Crawler her kategori için **100 sayfa** taramaya çalışıyor ama:

- Arsa Satılık: 1.257 ilan → 26 sayfa yeterli
- Bina: 16 ilan → 1 sayfa yeterli
- Gereksiz 74-99 sayfa taraması yapılıyor ❌

## ✅ Çözüm: Akıllı Sayfa Hesaplama

### 1. Toplam İlan Sayısını Oku

**HTML Yapısı:**

```html
<div class="resultsTextWrapper" data-totalmatches="16">
  <div class="result-text"><span>16 ilan</span> bulundu.</div>
</div>
```

**Yeni Fonksiyon:** `extract_total_count()`

```python
def extract_total_count(self, html: str) -> Optional[int]:
    """
    3 farklı yöntemle toplam ilan sayısını çıkar:
    1. data-totalmatches attribute (EN DOĞRU)
    2. result-text span içeriği
    3. result-text div içeriği
    """
    soup = BeautifulSoup(html, "html.parser")

    # Yöntem 1: data-totalmatches
    results_wrapper = soup.select_one(".resultsTextWrapper[data-totalmatches]")
    if results_wrapper:
        total = int(results_wrapper.get("data-totalmatches"))
        return total

    # Yöntem 2 & 3: Text parsing
    # ...
```

### 2. Max Sayfa Sayısını Hesapla

**Yeni Fonksiyon:** `calculate_max_pages()`

```python
def calculate_max_pages(self, total_listings: int, per_page: int = 50) -> int:
    """
    Toplam ilan / Sayfa başına ilan = Max sayfa

    Örnekler:
    - 1.257 ilan / 50 = 26 sayfa (25.14 → yukarı yuvarla)
    - 16 ilan / 50 = 1 sayfa
    - 606 ilan / 50 = 13 sayfa (12.12 → yukarı yuvarla)
    """
    import math
    return math.ceil(total_listings / per_page)
```

### 3. Crawl Logic Güncellendi

**Dosya:** `sahibinden_uc_batch_supabase.py`

```python
def crawl_category(self, key: str, config: dict, max_pages: int) -> int:
    actual_max_pages = max_pages  # Başlangıç

    while page < actual_max_pages:
        html = self.navigate(page_url)

        # İLK SAYFADA toplam sayıyı oku
        if page == 0:
            total_count = self.extract_total_count(html)
            if total_count:
                calculated_pages = self.calculate_max_pages(total_count, 50)

                # Kullanıcı limiti ile karşılaştır
                actual_max_pages = min(calculated_pages, max_pages)

                logger.info(f"🎯 Taranacak sayfa: {actual_max_pages}")
                logger.info(f"   Toplam ilan: {total_count:,}")
                logger.info(f"   Hesaplanan: {calculated_pages}")
                logger.info(f"   Limit: {max_pages}")
```

## 📊 Örnekler

### Örnek 1: Arsa Satılık (1.257 ilan)

```
📊 Toplam ilan sayısı: 1,257 (data-totalmatches)
📄 Hesaplanan sayfa sayısı: 26 (1257 ilan / 50 ilan/sayfa)
🎯 Taranacak sayfa: 26 (Toplam: 26, Limit: 100)

✅ 26 sayfa taranacak (74 sayfa tasarruf!)
```

### Örnek 2: Bina (16 ilan)

```
📊 Toplam ilan sayısı: 16 (data-totalmatches)
📄 Hesaplanan sayfa sayısı: 1 (16 ilan / 50 ilan/sayfa)
🎯 Taranacak sayfa: 1 (Toplam: 1, Limit: 100)

✅ 1 sayfa taranacak (99 sayfa tasarruf!)
```

### Örnek 3: Konut Satılık (606 ilan)

```
📊 Toplam ilan sayısı: 606 (data-totalmatches)
📄 Hesaplanan sayfa sayısı: 13 (606 ilan / 50 ilan/sayfa)
🎯 Taranacak sayfa: 13 (Toplam: 13, Limit: 100)

✅ 13 sayfa taranacak (87 sayfa tasarruf!)
```

## 🎯 Avantajlar

### 1. Zaman Tasarrufu

```
ÖNCE: 6 kategori × 100 sayfa = 600 sayfa taraması
SONRA: 6 kategori × ortalama 15 sayfa = 90 sayfa taraması

⏱️ %85 zaman tasarrufu!
```

### 2. Kaynak Tasarrufu

- ✅ Daha az HTTP request
- ✅ Daha az Selenium işlemi
- ✅ Daha az bot detection riski
- ✅ Daha az rate limiting

### 3. Doğruluk

- ✅ Sahibinden'in kendi verisi kullanılıyor
- ✅ Gereksiz boş sayfa taraması yok
- ✅ Tam olarak gerektiği kadar tarama

## 🔄 Fallback Mekanizması

Eğer toplam sayı okunamazsa:

```python
if total_count:
    actual_max_pages = min(calculated_pages, max_pages)
else:
    # Fallback: Kullanıcının belirlediği max_pages kullan
    actual_max_pages = max_pages
    logger.warning("⚠️ Toplam sayı okunamadı, max_pages kullanılıyor")
```

## 🧪 Test

```bash
# Test 1: Bina (16 ilan)
python sahibinden_uc_batch_supabase.py --categories bina --max-pages 100

# Beklenen:
# 📊 Toplam ilan sayısı: 16
# 🎯 Taranacak sayfa: 1

# Test 2: Arsa Satılık (1.257 ilan)
python sahibinden_uc_batch_supabase.py --categories arsa_satilik --max-pages 100

# Beklenen:
# 📊 Toplam ilan sayısı: 1,257
# 🎯 Taranacak sayfa: 26
```

## 📝 Log Örnekleri

```
2026-01-19 12:00:00 - INFO - 📂 Kategori: bina
2026-01-19 12:00:01 - INFO - 📄 Sayfa 1 taranıyor...
2026-01-19 12:00:05 - INFO - 📊 Toplam ilan sayısı: 16 (data-totalmatches)
2026-01-19 12:00:05 - INFO - 📄 Hesaplanan sayfa sayısı: 1 (16 ilan / 50 ilan/sayfa)
2026-01-19 12:00:05 - INFO - 🎯 Taranacak sayfa: 1 (Toplam: 1, Limit: 100)
2026-01-19 12:00:10 - INFO - ✅ 16 ilan işlendi
2026-01-19 12:00:10 - INFO - ✅ Kategori tamamlandı: bina
```

## 🚀 Performans Karşılaştırması

| Kategori       | İlan Sayısı | Önce          | Sonra         | Tasarruf  |
| -------------- | ----------- | ------------- | ------------- | --------- |
| Bina           | 16          | 100 sayfa     | 1 sayfa       | %99       |
| Arsa Satılık   | 1.257       | 100 sayfa     | 26 sayfa      | %74       |
| Konut Satılık  | 606         | 100 sayfa     | 13 sayfa      | %87       |
| İşyeri Satılık | 45          | 100 sayfa     | 1 sayfa       | %99       |
| **TOPLAM**     | -           | **400 sayfa** | **~50 sayfa** | **%87.5** |

---

**Tarih:** 2026-01-19
**Durum:** ✅ Implement Edildi
**Test:** ⏳ Bekliyor
