# 🗺️ Google Maps API Kurulum Rehberi

## ⚠️ Hata: "REQUEST_DENIED: The webpage is not allowed to use the geocoder"

Bu hata, **Geocoding API**'nin aktif olmadığını gösterir.

## ✅ Çözüm: 3 API'yi Aktif Et

Google Maps değerleme sistemi için **3 farklı API** gereklidir:

### 1. Geocoding API ⭐ (EN ÖNEMLİ!)

**Ne İşe Yarar**: Koordinattan adres çözümleme (reverse geocoding)
**Nerede Kullanılıyor**: Haritada tıkladığında adres bilgisi almak için

**Aktif Et**: [Geocoding API](https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com)

### 2. Maps JavaScript API

**Ne İşe Yarar**: Harita gösterimi
**Nerede Kullanılıyor**: Harita component'i

**Aktif Et**: [Maps JavaScript API](https://console.cloud.google.com/apis/library/maps-backend.googleapis.com)

### 3. Places API

**Ne İşe Yarar**: Yakındaki önemli noktalar (okul, hastane, AVM)
**Nerede Kullanılıyor**: POI analizi ve konum skoru hesaplama

**Aktif Et**: [Places API](https://console.cloud.google.com/apis/library/places-backend.googleapis.com)

## 🚀 Adım Adım Kurulum

### 1. Google Cloud Console'a Git

[Google Cloud Console](https://console.cloud.google.com/)

### 2. Proje Seç veya Oluştur

- Mevcut proje varsa seç
- Yoksa "New Project" → Proje adı gir → Create

### 3. API'leri Aktif Et

#### Option 1: Hızlı Linkler (Önerilen)

Her birini aç ve **"ENABLE"** butonuna tıkla:

1. [Geocoding API - ENABLE](https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com)
2. [Maps JavaScript API - ENABLE](https://console.cloud.google.com/apis/library/maps-backend.googleapis.com)
3. [Places API - ENABLE](https://console.cloud.google.com/apis/library/places-backend.googleapis.com)

#### Option 2: Manuel Arama

1. APIs & Services → Library
2. Arama kutusuna yaz:
   - "Geocoding API" → Enable
   - "Maps JavaScript API" → Enable
   - "Places API" → Enable

### 4. API Key Oluştur

1. APIs & Services → Credentials
2. "Create Credentials" → "API Key"
3. API Key kopyala (örn: `AIzaSyC...`)
4. **Önemli**: Key'i güvenli bir yere kaydet

### 5. API Key'i Projeye Ekle

`.env.local` dosyasına ekle:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSyC..."
```

### 6. (Opsiyonel ama Önerilen) API Key Restrictions

Güvenlik için restrictions ekle:

1. Credentials → API Key'ine tıkla
2. "Application restrictions":
   - **HTTP referrers** seç
   - Add an item:
     - `localhost:3000/*`
     - `yourdomain.com/*`
3. "API restrictions":
   - **Restrict key** seç
   - Şunları seç:
     - ✅ Geocoding API
     - ✅ Maps JavaScript API
     - ✅ Places API
4. Save

### 7. Test Et

```bash
npm run dev
```

`http://localhost:3000/degerleme` sayfasını aç.

Harita yüklenmeli ve tıkladığında adres bilgisi görmelisin.

## 🐛 Sorun Giderme

### "REQUEST_DENIED: The webpage is not allowed to use the geocoder"

**Sebep**: Geocoding API aktif değil

**Çözüm**:

1. [Geocoding API](https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com) → Enable
2. 5 dakika bekle (API aktivasyonu zaman alabilir)
3. Browser cache temizle (Ctrl+Shift+R)
4. Sayfayı yenile

### "This API project is not authorized to use this API"

**Sebep**: API Key restrictions yanlış yapılandırılmış

**Çözüm**:

1. Credentials → API Key → Edit
2. "API restrictions" → "Don't restrict key" (geçici olarak)
3. Test et
4. Çalışıyorsa, restrictions'ı doğru şekilde yapılandır

### "RefererNotAllowedMapError"

**Sebep**: HTTP referrer restriction yanlış

**Çözüm**:

1. Credentials → API Key → Edit
2. "Application restrictions" → HTTP referrers
3. Ekle: `localhost:3000/*` (wildcard önemli!)
4. Save

### Harita yüklenmiyor

**Sebep**: Maps JavaScript API aktif değil

**Çözüm**:

1. [Maps JavaScript API](https://console.cloud.google.com/apis/library/maps-backend.googleapis.com) → Enable
2. Sayfayı yenile

### POI (yakındaki yerler) çalışmıyor

**Sebep**: Places API aktif değil

**Çözüm**:

1. [Places API](https://console.cloud.google.com/apis/library/places-backend.googleapis.com) → Enable
2. Sayfayı yenile

## 💰 Fiyatlandırma

Google Maps API'leri **ücretli** ama **$200/ay ücretsiz kredi** var.

### Aylık Ücretsiz Kullanım

- **Geocoding API**: 40,000 istek/ay ücretsiz
- **Maps JavaScript API**: Sınırsız harita yükleme
- **Places API**:
  - Nearby Search: $32/1000 istek
  - Ücretsiz kredi ile ~6,250 istek/ay

### Maliyet Optimizasyonu

1. **Caching**: POI sonuçlarını Redis'te cache'le
2. **Rate Limiting**: Kullanıcı başına istek limiti koy
3. **Lazy Loading**: Haritayı sadece gerektiğinde yükle
4. **Billing Alerts**: $50, $100, $150 limitlerinde uyarı kur

### Billing Alert Kurulumu

1. [Billing](https://console.cloud.google.com/billing)
2. Budgets & alerts → Create Budget
3. Amount: $50, $100, $150
4. Email alerts ekle

## 📊 API Kullanım İzleme

1. [APIs & Services → Dashboard](https://console.cloud.google.com/apis/dashboard)
2. Her API'nin kullanım grafiklerini gör
3. Quota limitlerini kontrol et

## 🔒 Güvenlik Best Practices

1. ✅ API Key'i **asla** git'e commit etme
2. ✅ `.env.local` dosyası `.gitignore`'da olmalı
3. ✅ Production'da environment variables kullan
4. ✅ HTTP referrer restrictions ekle
5. ✅ API restrictions ekle (sadece gerekli API'ler)
6. ✅ Billing alerts kur
7. ✅ Düzenli olarak kullanım raporlarını kontrol et

## 📝 Checklist

Kurulum tamamlandı mı?

- [ ] Google Cloud projesi oluşturuldu
- [ ] Geocoding API aktif edildi
- [ ] Maps JavaScript API aktif edildi
- [ ] Places API aktif edildi
- [ ] API Key oluşturuldu
- [ ] API Key `.env.local` dosyasına eklendi
- [ ] HTTP referrer restrictions eklendi (opsiyonel)
- [ ] API restrictions eklendi (opsiyonel)
- [ ] Billing alerts kuruldu (opsiyonel)
- [ ] Test edildi - harita çalışıyor
- [ ] Test edildi - adres çözümleme çalışıyor
- [ ] Test edildi - yakındaki yerler çalışıyor

## 🎯 Özet

**Gerekli 3 API**:

1. ✅ Geocoding API (adres çözümleme)
2. ✅ Maps JavaScript API (harita)
3. ✅ Places API (yakındaki yerler)

**Kurulum Süresi**: ~10 dakika

**Maliyet**: $200/ay ücretsiz kredi (çoğu proje için yeterli)

**Sonuç**: Mülk değerleme sistemi tam çalışır halde! 🚀

---

**Destek**: [Google Maps Platform Support](https://developers.google.com/maps/support)
**Dokümantasyon**: [Google Maps Platform Docs](https://developers.google.com/maps/documentation)
