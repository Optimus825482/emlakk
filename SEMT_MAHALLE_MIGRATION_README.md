# Semt & Mahalle Migration - Kullanım Kılavuzu

## 📋 Genel Bakış

Konum verisini daha detaylı hale getirmek için yeni bir veri yapısı:

### Eski Yapı

```
ilce: "Hendek"
konum: "MerkezYeni Mah."
```

### Yeni Yapı

```
ilce: "Hendek"
semt: "Merkez"
mahalle: "Yeni Mah."
konum: "MerkezYeni Mah." (backward compatibility için kalıyor)
```

## 🎯 Avantajlar

1. **Daha İyi Filtreleme:** Semt bazında filtreleme yapabilirsiniz
2. **Detaylı Analiz:** Merkez vs Köyler karşılaştırması
3. **Temiz Veri:** Mahalle adları artık temiz (ilçe/semt ön eki yok)
4. **API Esnekliği:** `?ilce=Hendek&semt=Merkez&mahalle=Yeni`

## 🚀 Kullanım

### 1. Test Modu (Dry-Run)

Önce test edin:

```bash
cd yy/demir-gayrimenkul
python migrate_to_semt_mahalle.py
```

Çıktı:

```
[DRY-RUN] ID 122614215: 'MerkezYeni Mah.' -> semt='Merkez', mahalle='Yeni Mah.'
[DRY-RUN] ID 846720563: 'KöylerBeylice Mh.' -> semt='Köyler', mahalle='Beylice Mh.'
```

### 2. Gerçek Migration

Test sonuçları uygunsa:

1. Script'i düzenle:

```python
DRY_RUN = False  # Bu satırı değiştir
```

2. Çalıştır:

```bash
python migrate_to_semt_mahalle.py
```

3. Onay ver:

```
⚠️  UYARI: Bu işlem database şemasını değiştirecek!
Devam etmek istiyor musunuz? (evet/hayir): evet
```

## 📊 Migration Adımları

Script otomatik olarak:

1. ✅ Yeni sütunları ekler (`semt`, `mahalle`)
2. ✅ Index'leri oluşturur (performans için)
3. ✅ Mevcut `konum` verisini parse eder
4. ✅ Yeni sütunları doldurur
5. ✅ Eski `konum` sütununu korur (backward compatibility)

## 🔍 Parse Mantığı

### Yaygın Semtler

Script şu semt isimlerini tanır:

- **Merkez** - Şehir merkezi
- **Köyler** - Köy bölgeleri
- **İstiklal, Tepekum, Semerciler** - Adapazarı semtleri
- **İlçe adları** - Akyazı, Hendek, vb. (semt olarak kullanıldığında)

### Parse Örnekleri

```python
# Örnek 1: Merkez + Mahalle
"MerkezYeni Mah." → semt="Merkez", mahalle="Yeni Mah."

# Örnek 2: Köyler + Mahalle
"KöylerDağdibi Mh." → semt="Köyler", mahalle="Dağdibi Mh."

# Örnek 3: İlçe adı semt olarak
"AkyazıÖmercikler Mh." → semt="Akyazı", mahalle="Ömercikler Mh."

# Örnek 4: Sadece semt
"Semerciler" → semt="Semerciler", mahalle=NULL

# Örnek 5: Sadece mahalle (semt tanınmıyor)
"Yeni Mah." → semt=NULL, mahalle="Yeni Mah."
```

## 📁 Dosyalar

- `add_semt_mahalle_columns.sql` - SQL migration
- `migrate_to_semt_mahalle.py` - Migration script
- `semt_mahalle_migration_checkpoint.json` - Checkpoint (otomatik oluşur)

## 🔄 Crawler Güncellemesi

Migration sonrası crawler'ı da güncellemelisiniz:

### Güncellenmesi Gereken Dosya

`yy/demir-gayrimenkul/crwal4ai/admin_remix/sahibinden_crawler.py`

### Değişiklik

```python
# Eski
INSERT INTO sahibinden_liste (listing_id, baslik, link, fiyat, konum, ilce, ...)

# Yeni
INSERT INTO sahibinden_liste (listing_id, baslik, link, fiyat, konum, ilce, semt, mahalle, ...)
```

Parse fonksiyonu:

```python
def parse_location(location_text, ilce):
    """Konum metnini semt ve mahalle olarak ayır"""
    semts = ["Merkez", "Köyler", "İstiklal", "Tepekum", ...]

    for semt in semts:
        if location_text.startswith(semt):
            mahalle = location_text[len(semt):].strip()
            return semt, mahalle

    return None, location_text
```

## 🎯 API Güncellemeleri

### Yeni Filtreleme Seçenekleri

```typescript
// Eski
GET /api/sahibinden/listings?ilce=Hendek

// Yeni
GET /api/sahibinden/listings?ilce=Hendek&semt=Merkez
GET /api/sahibinden/listings?ilce=Hendek&semt=Köyler
GET /api/sahibinden/listings?mahalle=Yeni Mah.
```

### Frontend Dropdown'lar

```tsx
// İlçe seçimi
<Select value={ilce} onChange={setIlce}>
  <option value="Hendek">Hendek</option>
  <option value="Akyazı">Akyazı</option>
</Select>

// Semt seçimi (ilçeye göre filtrelenir)
<Select value={semt} onChange={setSemt}>
  <option value="Merkez">Merkez</option>
  <option value="Köyler">Köyler</option>
</Select>

// Mahalle seçimi (semt'e göre filtrelenir)
<Select value={mahalle} onChange={setMahalle}>
  <option value="Yeni Mah.">Yeni Mah.</option>
  <option value="Kemaliye Mah.">Kemaliye Mah.</option>
</Select>
```

## ⚠️ Önemli Notlar

1. **Backward Compatibility:** `konum` sütunu kalıyor, eski API'lar çalışmaya devam eder
2. **Checkpoint System:** İşlem kesilirse kaldığı yerden devam eder
3. **Batch Processing:** 100'er kayıt işlenir (database'i yormaz)
4. **Index'ler:** Performans için otomatik index oluşturulur

## 🐛 Sorun Giderme

### "column semt does not exist" hatası

Migration henüz çalışmamış. `DRY_RUN = False` yapın ve tekrar çalıştırın.

### Bazı kayıtlarda semt=NULL

Normal! Tüm semt isimleri tanınmıyor. `COMMON_SEMTS` listesine ekleyebilirsiniz.

### Checkpoint'ten devam etmek istemiyorsanız

```bash
rm semt_mahalle_migration_checkpoint.json
```

## 📊 Beklenen Sonuç

```
======================================================================
✅ İşlem Tamamlandı!
======================================================================
📊 Toplam işlenen kayıt: 6637
✏️  Güncellenen kayıt: 6637
⏱️  Toplam süre: 28.45 saniye
⚡ Ortalama hız: 233.2 kayıt/saniye

🎉 Migration tamamlandı!
📋 Yeni sütunlar: semt, mahalle
💡 Crawler'ı da güncellemeyi unutmayın!
======================================================================
```

## 🎉 Sonraki Adımlar

1. ✅ Migration'ı çalıştır
2. ⏳ Crawler'ı güncelle (yeni kayıtlar için)
3. ⏳ API endpoint'leri güncelle (semt filtresi ekle)
4. ⏳ Frontend'i güncelle (semt dropdown ekle)
5. ⏳ Analytics'i güncelle (semt bazlı raporlar)

---

**Son Güncelleme:** 2026-01-22
**Versiyon:** 1.0.0
