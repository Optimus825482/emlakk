# İlçe Seçimi Özelliği - Sahibinden Crawler

## 📋 Özet

Sahibinden crawler'a **ilçe seçimi** özelliği eklendi. Artık sadece Hendek değil, Sakarya'nın tüm ilçelerinde ilan taraması yapılabilir.

## ✅ Yapılan Değişiklikler

### 1. Backend (Python)

#### `sahibinden_crawler.py`

- **Satır 140-220**: Sakarya ilçe listesi eklendi (`SAKARYA_DISTRICTS`)
- **Satır 140-220**: Kategori şablonları dinamik hale getirildi (`CATEGORY_TEMPLATES`)
- **Satır 140-220**: `get_category_url()` fonksiyonu eklendi (ilçe + kategori kombinasyonu)
- **Satır 1760-1770**: `--district` argparse parametresi eklendi
- **Satır 1800-1810**: Kategori config oluşturma güncellendi (ilçe bazlı)

#### `app.py`

- **Satır 170-280**: `/api/crawler/start` endpoint'ine `district` parametresi eklendi
- **Satır 360-450**: `/api/crawler/start-parallel` endpoint'ine `district` parametresi eklendi
- Her iki endpoint'te de crawler komutuna `--district` flag'i eklendi

### 2. Frontend (HTML/JavaScript)

#### `templates/crawler.html`

- **Satır 345-410**: İlçe seçim dropdown UI eklendi (16 ilçe)
- **Satır 760-770**: JavaScript form objesine `district: "hendek"` eklendi
- **Satır 906-950**: `startCrawler()` fonksiyonuna ilçe parametresi eklendi
- **Satır 960-970**: `resetForm()` fonksiyonuna ilçe default değeri eklendi
- Onay mesajına ilçe bilgisi eklendi

## 🎯 Özellikler

### Desteklenen İlçeler (16 Adet)

1. Hendek (default)
2. Adapazarı
3. Akyazı
4. Arifiye
5. Erenler
6. Ferizli
7. Geyve
8. Karapürçek
9. Karasu
10. Kaynarca
11. Kocaali
12. Pamukova
13. Sapanca
14. Serdivan
15. Söğütlü
16. Taraklı

### Kategori Desteği

- Tüm kategoriler (Konut, Arsa, İşyeri, Bina)
- Satılık ve Kiralık seçenekleri
- İlçe değişikliği kategori seçimini etkilemez

## 🚀 Kullanım

### Web Arayüzü

1. `http://localhost:5001/crawler` adresine git
2. **"📍 Hedef İlçe Seçin"** dropdown'ından ilçe seç
3. Kategorileri seç
4. **"Sistemi Ateşle"** butonuna tıkla
5. Onay mesajında ilçe bilgisini kontrol et

### Komut Satırı

```bash
# Hendek'te konut satılık tara
python sahibinden_crawler.py --categories konut_satilik --district hendek

# Adapazarı'nda tüm kategorileri tara
python sahibinden_crawler.py --categories konut_satilik konut_kiralik arsa_satilik --district adapazari

# Sapanca'da turbo modda tara
python sahibinden_crawler.py --categories konut_satilik --district sapanca --turbo
```

## 🔧 Teknik Detaylar

### URL Yapısı

```python
# Eski (sabit Hendek)
"https://www.sahibinden.com/satilik/sakarya-hendek?pagingSize=50&sorting=date_desc"

# Yeni (dinamik ilçe)
"https://www.sahibinden.com/satilik/sakarya-{district}?pagingSize=50&sorting=date_desc"
```

### Veri Akışı

```
Frontend (dropdown)
  → form.district
  → API Request (district: "adapazari")
  → Backend (app.py)
  → Crawler Command (--district adapazari)
  → sahibinden_crawler.py
  → get_category_url(category, district)
  → Sahibinden.com URL
```

### Geriye Uyumluluk

- `HENDEK_CATEGORIES` hala mevcut (deprecated)
- Default değer: `hendek`
- Eski komutlar çalışmaya devam eder

## 📊 Veritabanı

İlanlar veritabanına kaydedilirken:

- `category`: Kategori (konut, arsa, isyeri, bina)
- `transaction`: İşlem tipi (satilik, kiralik)
- `konum`: İlan konumu (ilçe bilgisi içerir)

## ⚠️ Önemli Notlar

1. **Kategori Sayıları**: Her ilçe için kategori sayıları farklı olabilir
2. **Performans**: Büyük ilçeler (Adapazarı, Serdivan) daha uzun sürebilir
3. **Rate Limiting**: Adaptive rate limiter tüm ilçeler için çalışır
4. **Cloudflare**: Manuel doğrulama gerekebilir (ilk çalıştırmada)

## 🧪 Test

### Manuel Test

1. Hendek seç → Crawler başlat → İlanları kontrol et
2. Adapazarı seç → Crawler başlat → İlanları kontrol et
3. İlçe değiştir → Kategori seçimi korunmalı

### Beklenen Davranış

- ✅ İlçe dropdown görünür olmalı
- ✅ Default değer "Hendek" olmalı
- ✅ Onay mesajında ilçe adı görünmeli
- ✅ Crawler loglarında ilçe bilgisi olmalı
- ✅ İlanlar doğru ilçeden gelmeli

## 📝 Changelog

### v1.1.0 (2025-01-20)

- ✨ İlçe seçimi özelliği eklendi
- ✨ 16 Sakarya ilçesi desteği
- ✨ Dinamik URL oluşturma
- ✨ Frontend dropdown UI
- 🔧 Backend API güncellendi
- 🔧 Crawler argparse güncellendi
- 📚 Dokümantasyon eklendi

## 🔮 Gelecek Geliştirmeler

- [ ] İlçe bazlı istatistikler
- [ ] Çoklu ilçe seçimi (batch crawling)
- [ ] İlçe bazlı filtreleme (listings sayfası)
- [ ] İlçe bazlı dashboard widget'ları
- [ ] Otomatik ilçe tespiti (konum bazlı)

## 👨‍💻 Geliştirici

**Erkan** - Sahibinden Crawler Admin Panel
**Tarih**: 20 Ocak 2025
**Versiyon**: 1.1.0
