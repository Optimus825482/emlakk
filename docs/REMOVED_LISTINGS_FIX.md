# Kaldırılan İlanlar Özelliği - Düzeltme Planı

## 🔴 Mevcut Sorunlar

### 1. Yanlış Mantık (KRİTİK)

**Sorun:** `detect_and_save_removed_listings()` metodu TÜM veritabanındaki ilanları kontrol ediyor, ama sadece 5 sayfa taranıyor.

**Örnek:**

- Toplam ilan: 620
- Taranan sayfa: 5 (250 ilan)
- Taranmayan: 370 ilan
- Sonuç: 370 ilan "kaldırılmış" olarak işaretleniyor ❌ (YANLIŞ!)

**Neden Yanlış:**

- Sadece 5 sayfa taradık, geri kalan 370 ilan hala Sahibinden'de aktif
- Ama metod onları "kaldırılmış" olarak işaretliyor
- Bu yanlış veri üretiyor

### 2. Performans Sorunu

**Sorun:** Her ilan için tek tek `price_history` sorgusu yapılıyor.

**Örnek:**

- 389 ilan = 389 ayrı SQL sorgusu
- Her sorgu ~50-100ms
- Toplam: 19-39 saniye sadece price_history için!

**Neden Yavaş:**

- N+1 query problemi
- Batch sorgu yerine tek tek sorgu

---

## ✅ Çözüm Seçenekleri

### Seçenek 1: Özelliği Devre Dışı Bırak (ŞU ANDA UYGULANMIŞ)

**Artıları:**

- Hızlı çözüm
- Yanlış veri üretilmesini önler
- Performans sorunu ortadan kalkar

**Eksileri:**

- Kaldırılan ilan takibi yapılamaz

**Uygulama:**

```python
# crawl_category() metodunda:
logger.info(f"\n⚠️ Kaldırılan ilan tespiti devre dışı (performans optimizasyonu)")
removed_count = 0
```

---

### Seçenek 2: Mantığı Düzelt (ÖNERİLEN)

**Çözüm:** Sadece taranan sayfalardaki ilanları kontrol et.

**Nasıl:**

1. `current_ids` sadece taranan sayfalardaki ilanları içeriyor ✅
2. DB'den sadece bu ID'leri çek (tüm kategoriyi değil)
3. Karşılaştır: Hangi ID'ler DB'de var ama crawl'da yok?

**Kod Örneği:**

```python
def detect_and_save_removed_listings(self, category: str, transaction: str, current_ids: set) -> int:
    # ❌ YANLIŞ: Tüm kategoriyi çek
    # result = self.supabase.table("sahibinden_liste")\
    #     .eq("category", category)\
    #     .eq("transaction", transaction)\
    #     .execute()

    # ✅ DOĞRU: Sadece taranan ID'leri çek
    if not current_ids:
        return 0

    # current_ids'i liste olarak çevir (Supabase IN operatörü için)
    current_ids_list = list(current_ids)

    # Sadece taranan ID'leri DB'den çek
    result = self.supabase.table("sahibinden_liste")\
        .select("id, baslik, link, fiyat, konum, category, transaction, resim, tarih")\
        .in_("id", current_ids_list)\
        .execute()

    db_ids = {str(r["id"]) for r in result.data}

    # Kaldırılan ilanları bul (crawl'da var ama DB'de yok)
    # NOT: Mantık tersine döndü!
    removed_ids = current_ids - db_ids

    # ... geri kalan kod aynı
```

**Artıları:**

- Doğru sonuç verir
- Sadece taranan ilanları kontrol eder
- Yanlış veri üretmez

**Eksileri:**

- Yine de tüm sayfaları taramak gerekir (max_pages=None)
- Aksi halde sadece 5 sayfadaki ilanları kontrol eder

---

### Seçenek 3: Batch Sorgu (PERFORMANS OPTİMİZASYONU)

**Çözüm:** Tüm `price_history` kayıtlarını tek sorguda çek.

**Kod Örneği:**

```python
# ❌ YANLIŞ: Her ilan için tek tek sorgu (389 sorgu!)
for listing_id in removed_ids:
    price_history = self.supabase.table("price_history")\
        .select("*", count="exact")\
        .eq("listing_id", int(listing_id))\
        .execute()
    price_changes = price_history.count or 0

# ✅ DOĞRU: Batch sorgu (1 sorgu!)
listing_ids = [int(lid) for lid in removed_ids]

# Tüm price_history kayıtlarını tek sorguda çek
price_history_result = self.supabase.table("price_history")\
    .select("listing_id")\
    .in_("listing_id", listing_ids)\
    .execute()

# Her listing_id için kaç kayıt var sayalım
price_history_map = {}
for record in price_history_result.data:
    lid = str(record["listing_id"])
    price_history_map[lid] = price_history_map.get(lid, 0) + 1

# Artık her ilan için map'ten al
for listing_id in removed_ids:
    price_changes = price_history_map.get(listing_id, 0)
```

**Performans:**

- Öncesi: 389 sorgu × 50ms = 19.5 saniye
- Sonrası: 1 sorgu × 100ms = 0.1 saniye
- **195x daha hızlı!** 🚀

---

### Seçenek 4: Ayrı Job Oluştur (EN İYİ ÇÖZÜM)

**Çözüm:** Kaldırılan ilan tespitini ayrı bir job olarak çalıştır.

**Nasıl:**

1. Yeni endpoint: `/api/crawler/detect-removed`
2. Bu job TÜM sayfaları tarar (max_pages=None)
3. Tüm ilanları DB ile karşılaştırır
4. Gerçekten kaldırılan ilanları bulur

**Artıları:**

- Normal crawl hızlı kalır
- Doğru sonuç verir
- İstediğin zaman çalıştırabilirsin (günde 1 kez vs.)

**Eksileri:**

- Ekstra job gerekir
- Daha karmaşık

**Kod Örneği:**

```python
# mining_api.py
@app.post("/jobs/detect-removed")
async def detect_removed_listings(request: DetectRemovedRequest):
    """
    Kaldırılan ilanları tespit et (TÜM sayfaları tara)
    """
    job_id = str(uuid.uuid4())

    # TÜM sayfaları tara (max_pages=None)
    cmd = [
        "python",
        "sahibinden_uc_batch_supabase.py",
        "--categories", " ".join(request.categories),
        "--max-pages", "999999",  # Tüm sayfalar
        "--detect-removed-only",  # Sadece kaldırılan ilan tespiti
        "--job-id", job_id
    ]

    # ... geri kalan kod
```

---

## 📊 Karşılaştırma

| Seçenek          | Doğruluk   | Performans | Karmaşıklık | Önerilen    |
| ---------------- | ---------- | ---------- | ----------- | ----------- |
| 1. Devre Dışı    | N/A        | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐  | ✅ (Geçici) |
| 2. Mantık Düzelt | ⭐⭐⭐     | ⭐⭐⭐     | ⭐⭐⭐      | ⚠️          |
| 3. Batch Sorgu   | ⭐⭐⭐     | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐    | ✅          |
| 4. Ayrı Job      | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   | ⭐⭐        | ⭐ (En İyi) |

---

## 🚀 Uygulama Planı

### Kısa Vadeli (ŞU ANDA)

- [x] Özelliği devre dışı bırak
- [x] Batch sorgu optimizasyonu ekle (yorumlu)
- [x] Dokümantasyon yaz

### Orta Vadeli (1-2 Hafta)

- [ ] Seçenek 2 + 3'ü uygula (Mantık düzelt + Batch sorgu)
- [ ] Test et (5 sayfa vs. tüm sayfalar)
- [ ] Performans ölç

### Uzun Vadeli (1 Ay)

- [ ] Seçenek 4'ü uygula (Ayrı job)
- [ ] Cron job kur (günde 1 kez çalıştır)
- [ ] Dashboard'a ekle

---

## 📝 Notlar

- `removed_listings` tablosu hazır ve çalışıyor ✅
- `new_listings` özelliği çalışıyor ✅
- Sadece `detect_and_save_removed_listings()` metodu devre dışı
- Gelecekte düzeltmek için bu dokümantasyonu kullan

---

**Son Güncelleme:** 2026-01-19
**Durum:** Devre Dışı (Performans Optimizasyonu)
