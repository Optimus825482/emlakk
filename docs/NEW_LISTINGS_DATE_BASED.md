# Yeni İlan Tespiti - Tarih Bazlı Sistem

## 📅 Özellik Özeti

Yeni ilanlar artık **ilan tarihine göre** tespit ediliyor. Sadece **son 2 gün içinde** yayınlanan ilanlar `new_listings` tablosuna kaydediliyor.

## 🎯 Nasıl Çalışıyor?

### 1. Tarih Parse Etme

Sahibinden'den gelen tarih formatları:

- `"Bugün 14:30"` → Bugün saat 14:30
- `"Dün 09:15"` → Dün saat 09:15
- `"15 Ocak"` → Bu yıl 15 Ocak
- `"20 Aralık 2024"` → 20 Aralık 2024

**Fonksiyon:** `parse_listing_date(date_str: str) -> Optional[datetime]`

```python
# Örnek kullanım
date_str = "Bugün 14:30"
listing_date = parse_listing_date(date_str)
# → datetime(2026, 1, 19, 14, 30, 0)
```

### 2. Yeni İlan Kontrolü

**Fonksiyon:** `is_new_listing(listing_date: Optional[datetime], days_threshold: int = 2) -> bool`

```python
# Örnek kullanım
listing_date = datetime(2026, 1, 18, 10, 0, 0)  # Dün
is_new = is_new_listing(listing_date, days_threshold=2)
# → True (son 2 gün içinde)

listing_date = datetime(2026, 1, 10, 10, 0, 0)  # 9 gün önce
is_new = is_new_listing(listing_date, days_threshold=2)
# → False (2 günden eski)
```

### 3. Kaydetme Mantığı

```python
# _save_listings_batch() metodunda:
for listing in listings:
    # 1. Tarih parse et
    listing_date_str = listing.get("tarih", "")
    listing_date = parse_listing_date(listing_date_str)

    # 2. Yeni ilan kontrolü (son 2 gün)
    is_new = is_new_listing(listing_date, days_threshold=2)

    # 3. Sadece yeni ilanları new_listings'e kaydet
    if is_new:
        new_listings_data.append({
            "listing_id": int(listing_id),
            "first_seen_at": listing_date.isoformat(),
            # ... diğer alanlar
        })
```

## 📊 Örnek Senaryo

**Taranan İlanlar:**

- İlan A: "Bugün 14:30" → ✅ Yeni (new_listings'e kaydedilir)
- İlan B: "Dün 09:15" → ✅ Yeni (new_listings'e kaydedilir)
- İlan C: "15 Ocak" → ❌ Eski (4 gün önce, kaydedilmez)
- İlan D: "10 Ocak" → ❌ Eski (9 gün önce, kaydedilmez)

**Sonuç:**

- 4 ilan tarandı
- 2 tanesi `new_listings` tablosuna kaydedildi
- 2 tanesi kaydedilmedi (2 günden eski)

## 🔧 Konfigürasyon

### Threshold Değiştirme

`days_threshold` parametresi ile kaç gün içindeki ilanların "yeni" sayılacağını ayarlayabilirsin:

```python
# 2 gün (default)
is_new = is_new_listing(listing_date, days_threshold=2)

# 7 gün
is_new = is_new_listing(listing_date, days_threshold=7)

# 1 gün (sadece bugün)
is_new = is_new_listing(listing_date, days_threshold=1)
```

**Not:** Şu anda kod içinde `days_threshold=2` olarak sabit. Değiştirmek için `sahibinden_uc_batch_supabase.py` dosyasında arama yap.

## 📁 İlgili Dosyalar

- `crwal4ai/sahibinden_uc_batch_supabase.py` (lines 51-145: parse fonksiyonları, lines 270-310: kaydetme mantığı)
- `crwal4ai/create_new_listings_table.sql` (new_listings tablosu)

## 🎯 Avantajlar

### Önceki Sistem (DB Kontrolü)

- ❌ Sadece DB'de olup olmadığına bakıyordu
- ❌ Eski ilanlar da "yeni" olarak işaretleniyordu
- ❌ Gerçek yeni ilanları ayırt edemiyordu

### Yeni Sistem (Tarih Bazlı)

- ✅ İlan tarihine göre karar veriyor
- ✅ Sadece son 2 gün içindeki ilanlar "yeni"
- ✅ Gerçek yeni ilanları doğru tespit ediyor
- ✅ Kullanıcıya daha anlamlı bilgi sunuyor

## 📝 Örnek Log Çıktısı

```
📄 Sayfa 1 taranıyor...
   🆕 Yeni ilan tespit edildi: 1234567 - Bugün 14:30
   🆕 Yeni ilan tespit edildi: 1234568 - Dün 09:15
   ✅ 45 yeni ilan (son 2 gün) new_listings tablosuna kaydedildi
✅ 51 ilan işlendi, 35 yeni, 16 güncellendi (Toplam: 51)
```

## 🔄 Otomatik Temizleme

`new_listings` tablosunda 2 günden eski kayıtlar otomatik olarak temizleniyor:

```sql
-- Function: cleanup_old_new_listings()
-- Çalışma: Her gün otomatik (cron job)
-- Sonuç: 2 günden eski kayıtlar siliniyor
```

## 🚀 Gelecek İyileştirmeler

1. **Threshold Parametresi:** API'den ayarlanabilir hale getir
2. **Tarih Formatları:** Daha fazla format desteği ekle
3. **Timezone:** Saat dilimi desteği ekle
4. **Hata Yönetimi:** Parse edilemeyen tarihler için fallback

---

**Son Güncelleme:** 2026-01-19
**Durum:** Aktif ve Çalışıyor ✅
