# Adres ve Harita Entegrasyonu Düzeltmesi

## Yapılan Değişiklikler

### 1. Admin Ayarlar Sayfası - Harita URL Alanı Eklendi

**Dosya:** `src/app/admin/ayarlar/page.tsx`

**Değişiklik:** İletişim sekmesine "Google Maps Embed URL" alanı eklendi.

**Özellikler:**

- Adres alanı placeholder güncellendi: "BAŞPINAR MAHALLESİ 1134 SOKAĞI No : 9/1 HENDEK/ SAKARYA"
- Yeni alan: `mapEmbedUrl` - Google Maps embed URL'si için
- Kullanım talimatı eklendi: Google Maps'ten embed URL'si nasıl alınır

**Kullanım:**

1. Admin Panel → Ayarlar → İletişim sekmesi
2. "Adres" alanına tam adresi girin
3. "Google Maps Embed URL" alanına harita embed URL'sini girin

### 2. İletişim Sayfası - Dinamik Adres Gösterimi

**Dosya:** `src/app/iletisim/page.tsx`

**Değişiklik:** Harita üzerindeki overlay'de dinamik adres gösterimi.

**Özellikler:**

- Harita üzerindeki bilgi kartında artık veritabanından gelen adres gösteriliyor
- Fallback: Adres yoksa "Hendek, Sakarya" gösterilir
- Responsive tasarım: Uzun adresler için max-width eklendi

### 3. Mevcut Dinamik Alanlar (Değişiklik Yok)

**Zaten Çalışan Alanlar:**

- Footer'da adres gösterimi ✅
- İletişim sayfasında adres gösterimi ✅
- Telefon numarası (tüm sayfalarda) ✅
- E-posta adresi ✅
- WhatsApp numarası ✅

## Google Maps Embed URL Nasıl Alınır?

### Adım 1: Google Maps'i Açın

1. https://www.google.com/maps adresine gidin
2. Adresinizi arayın: "BAŞPINAR MAHALLESİ 1134 SOKAĞI No : 9/1 HENDEK/ SAKARYA"

### Adım 2: Embed Kodunu Alın

1. Konumu seçin
2. "Paylaş" butonuna tıklayın
3. "Haritayı yerleştir" sekmesine geçin
4. Harita boyutunu seçin (Orta veya Büyük önerilir)
5. HTML kodunu kopyalayın

### Adım 3: URL'yi Çıkarın

HTML kodu şu şekilde olacak:

```html
<iframe
  src="https://www.google.com/maps/embed?pb=..."
  width="600"
  height="450"
  ...
></iframe>
```

**Sadece `src="..."` içindeki URL'yi kopyalayın:**

```
https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d...
```

### Adım 4: Admin Panele Yapıştırın

1. Admin Panel → Ayarlar → İletişim
2. "Google Maps Embed URL" alanına yapıştırın
3. "Kaydet" butonuna tıklayın

## Örnek Embed URL

```
https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3021.123456789!2d30.7654321!3d40.8123456!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDQ4JzQ0LjQiTiAzMMKwNDUnNTUuNiJF!5e0!3m2!1str!2str!4v1234567890123!5m2!1str!2str
```

## Veritabanı Şeması

`site_settings` tablosunda mevcut alanlar:

- `address` (text) - Tam adres metni
- `mapEmbedUrl` (text) - Google Maps embed URL'si

## API Endpoint

**GET/PATCH:** `/api/settings`

**Response:**

```json
{
  "data": {
    "address": "BAŞPINAR MAHALLESİ 1134 SOKAĞI No : 9/1 HENDEK/ SAKARYA",
    "mapEmbedUrl": "https://www.google.com/maps/embed?pb=...",
    "phone": "+90 264 123 45 67",
    "email": "info@demirgayrimenkul.com",
    ...
  }
}
```

## Test Adımları

### 1. Adres Güncelleme Testi

- [ ] Admin panelde adresi güncelleyin
- [ ] Footer'da yeni adresin göründüğünü kontrol edin
- [ ] İletişim sayfasında yeni adresin göründüğünü kontrol edin
- [ ] Harita overlay'inde yeni adresin göründüğünü kontrol edin

### 2. Harita URL Testi

- [ ] Google Maps'ten embed URL'si alın
- [ ] Admin panelde "Google Maps Embed URL" alanına yapıştırın
- [ ] Kaydedin
- [ ] İletişim sayfasını yenileyin
- [ ] Haritanın doğru konumu gösterdiğini kontrol edin

### 3. Responsive Test

- [ ] Mobil cihazda harita overlay'inin düzgün göründüğünü kontrol edin
- [ ] Uzun adres metinlerinin taşmadığını kontrol edin

## Sorun Giderme

### Adres Güncellenmiyor

1. Browser cache'i temizleyin (Ctrl+Shift+R)
2. API response'u kontrol edin: `/api/settings`
3. Console'da hata var mı kontrol edin

### Harita Gösterilmiyor

1. `mapEmbedUrl` alanının dolu olduğunu kontrol edin
2. URL'nin `https://www.google.com/maps/embed?pb=` ile başladığını kontrol edin
3. Google Maps iframe'inin yüklendiğini Network sekmesinden kontrol edin

### Harita Yanlış Konumu Gösteriyor

1. Google Maps'te doğru konumu seçtiğinizden emin olun
2. Yeni embed URL'si alın
3. Admin panelde güncelleyin

## Notlar

- Adres metni ve harita URL'si birbirinden bağımsızdır
- Adres metni SEO ve kullanıcı bilgilendirmesi için kullanılır
- Harita URL'si görsel konum gösterimi için kullanılır
- Her ikisini de güncel tutmak önemlidir

## Gelecek İyileştirmeler

- [ ] Google Maps Geocoding API ile adresten otomatik embed URL oluşturma
- [ ] Harita üzerinde marker/pin ekleme
- [ ] Yol tarifi butonu ekleme
- [ ] Yakındaki önemli noktaları gösterme
