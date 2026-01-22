# 🏡 Mülk Değerleme Sistemi - Teknik Dokümantasyon

## 📋 Genel Bakış

Bu sistem, **gerçek piyasa verileri** ve **yapay zeka** kullanarak mülk değerlemesi yapar. Sahibinden.com'dan toplanan binlerce ilan verisi, Google Maps POI (Points of Interest) analizi ve gelişmiş puanlama algoritmaları ile çalışır.

## 🎯 Özellikler

### 1. **Google Maps Entegrasyonu**

- Kullanıcı harita üzerinde mülk konumunu seçer
- Otomatik adres çözümleme (Reverse Geocoding)
- İlçe ve mahalle bilgisi otomatik tespit
- Yakındaki önemli noktalar (POI) tespiti

### 2. **Yakındaki Önemli Noktalar (POI) Analizi**

- **Eğitim**: Okul, üniversite (max 2km)
- **Sağlık**: Hastane, doktor (max 5km)
- **Ulaşım**: Otobüs/tren durağı (max 1.5km)
- **Alışveriş**: AVM, market (max 3km)
- **Yeşil Alan**: Park (max 1km)
- **Dini Tesis**: Cami (max 1km)

### 3. **Konum Skoru Hesaplama (0-100)**

```
- Merkeze Yakınlık: 0-25 puan
- Ulaşım: 0-20 puan
- Sosyal Tesisler: 0-20 puan
- Eğitim: 0-15 puan
- Sağlık: 0-10 puan
- Çevre: 0-10 puan
```

### 4. **Benzer İlan Eşleştirme**

PostgreSQL `sahibinden_liste` tablosundan:

- Aynı kategori (konut, arsa, işyeri, sanayi, tarım)
- Satılık ilanlar
- Alan benzerliği (±30%)
- Konum yakınlığı (max 5km)
- Koordinat bazlı Haversine mesafe hesaplama

### 5. **Benzerlik Skoru Algoritması (0-100)**

#### Alan Benzerliği (0-30 puan)

- %10 fark: 30 puan
- %20 fark: 25 puan
- %30 fark: 20 puan

#### Mesafe Benzerliği (0-25 puan)

- 500m içinde: 25 puan
- 1km içinde: 20 puan
- 2km içinde: 15 puan
- 3km içinde: 10 puan
- 5km içinde: 5 puan

#### Konum Eşleşmesi (0-20 puan)

- İlçe eşleşmesi: 10 puan
- Mahalle eşleşmesi: 10 puan

#### Özellik Benzerliği (0-25 puan) - Konut için

- Oda sayısı eşleşmesi: 0-8 puan
- Bina yaşı benzerliği: 0-7 puan
- Kat benzerliği: 0-5 puan
- Ekstra özellikler (asansör, otopark, balkon): 0-5 puan

### 6. **İstatistiksel Analiz**

- **Ortalama m² fiyatı**: Tüm benzer ilanların ortalaması
- **Medyan m² fiyatı**: Aykırı değerlerden etkilenmeyen orta değer
- **Standart Sapma**: Fiyat dağılımının tutarlılığı
- **Fiyat Aralığı**: Min-Max değerler

### 7. **Değerleme Formülü**

```typescript
// 1. Temel değer
baseValue = avgPricePerM2 * area;

// 2. Konum skoru etkisi (%0 ile %20 arası)
locationMultiplier = 1 + ((locationScore - 50) / 100) * 0.2;

// 3. Düzeltilmiş değer
adjustedValue = baseValue * locationMultiplier;

// 4. Fiyat aralığı (standart sapma ile)
priceRange = {
  min: adjustedValue - stdDeviation * area,
  max: adjustedValue + stdDeviation * area,
};
```

### 8. **Güven Skoru (0-100)**

#### Karşılaştırma Sayısı (0-40 puan)

- 15+ ilan: 40 puan
- 10-14 ilan: 35 puan
- 5-9 ilan: 25 puan
- <5 ilan: 15 puan

#### Veri Tutarlılığı (0-30 puan)

Varyasyon Katsayısı = stdDeviation / avgPrice

- ≤%15: 30 puan
- ≤%25: 25 puan
- ≤%35: 20 puan
- > %35: 10 puan

#### Konum Skoru (0-30 puan)

- (locationScore / 100) \* 30

## 🏗️ Mimari

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  /degerleme Page                                      │   │
│  │  - MapLocationPicker (Google Maps)                    │   │
│  │  - Property Form                                      │   │
│  │  - Results Display                                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓ POST /api/valuation/estimate
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Next.js)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Valuation Engine                                     │   │
│  │  1. POI Detection (Google Places API)                │   │
│  │  2. Location Score Calculation                       │   │
│  │  3. Comparable Finder (PostgreSQL)                   │   │
│  │  4. Statistical Analysis                             │   │
│  │  5. Price Estimation                                 │   │
│  │  6. Confidence Score                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  sahibinden_liste                                     │   │
│  │  - 10,000+ satılık ilan                              │   │
│  │  - Koordinat bilgisi (lat, lng)                      │   │
│  │  - Detaylı özellikler (JSONB)                        │   │
│  │  - İlçe, mahalle bilgisi                             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Dosya Yapısı

```
src/
├── lib/valuation/
│   ├── types.ts                    # Type definitions
│   ├── poi-detector.ts             # Google Places API integration
│   ├── comparable-finder.ts        # PostgreSQL query & similarity scoring
│   ├── valuation-engine.ts         # Main valuation logic
│   └── index.ts                    # Public exports
├── components/valuation/
│   └── MapLocationPicker.tsx       # Google Maps component
├── app/
│   ├── degerleme/
│   │   └── page.tsx                # Valuation page (4 steps)
│   └── api/valuation/
│       └── estimate/
│           └── route.ts            # API endpoint
└── db/schema/
    └── crawler.ts                  # sahibinden_liste table schema
```

## 🚀 Kurulum

### 1. Environment Variables

`.env.local` dosyasına ekle:

```bash
# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# PostgreSQL Database
DATABASE_URL="postgresql://user:pass@host:5432/db"
```

### 2. Google Maps API Key Alma

1. [Google Cloud Console](https://console.cloud.google.com/) → API & Services
2. "Maps JavaScript API" ve "Places API" aktif et
3. API Key oluştur
4. Restrictions ekle (HTTP referrers: `localhost:3000`, `yourdomain.com`)

### 3. Dependencies

```bash
npm install @react-google-maps/api
```

## 📊 Kullanım

### Frontend

```tsx
import { MapLocationPicker } from "@/components/valuation/MapLocationPicker";

<MapLocationPicker
  onLocationSelect={(location) => {
    console.log(location);
    // { lat, lng, address, ilce, mahalle }
  }}
/>;
```

### Backend API

```typescript
// POST /api/valuation/estimate
{
  "location": {
    "lat": 40.8008,
    "lng": 30.7469,
    "address": "Hendek, Sakarya",
    "ilce": "Hendek",
    "mahalle": "Merkez"
  },
  "features": {
    "propertyType": "konut",
    "area": 120,
    "roomCount": 3,
    "buildingAge": 5,
    "floor": 3,
    "hasElevator": true,
    "hasParking": true,
    "hasBalcony": true
  },
  "userInfo": {
    "name": "Ahmet Yılmaz",
    "email": "ahmet@example.com",
    "phone": "05551234567"
  }
}
```

### Response

```typescript
{
  "success": true,
  "data": {
    "estimatedValue": 2500000,
    "priceRange": { "min": 2300000, "max": 2700000 },
    "confidenceScore": 87,
    "pricePerM2": 20833,
    "locationScore": {
      "total": 78,
      "breakdown": {
        "proximity": 20,
        "transportation": 18,
        "amenities": 16,
        "education": 12,
        "health": 8,
        "environment": 4
      },
      "advantages": [
        "Okula 300m mesafede",
        "Toplu taşımaya çok yakın",
        "Sosyal tesislere yakın"
      ],
      "disadvantages": []
    },
    "marketAnalysis": {
      "avgPricePerM2": 20500,
      "medianPricePerM2": 20000,
      "stdDeviation": 1500,
      "totalComparables": 18,
      "priceRange": { "min": 18000, "max": 23000 },
      "trend": "stable"
    },
    "comparableProperties": [
      {
        "id": 12345,
        "baslik": "Satılık 3+1 Daire",
        "fiyat": 2400000,
        "m2": 115,
        "konum": "Hendek, Merkez Mah.",
        "distance": 0.8,
        "pricePerM2": 20870,
        "similarity": 92
      }
    ],
    "nearbyPOIs": [
      {
        "type": "school",
        "name": "Hendek Anadolu Lisesi",
        "distance": 300,
        "rating": 4.5
      }
    ],
    "aiInsights": "18 benzer ilan analiz edilerek 2.50M TL değerleme yapıldı. Değerleme piyasa ortalamasına çok yakın. Konum çok avantajlı - sosyal tesislere ve ulaşıma yakın.",
    "methodology": "Bu değerleme 18 benzer satılık ilan üzerinden yapılmıştır..."
  }
}
```

## 🔧 Optimizasyon İpuçları

### 1. Database Index

```sql
-- Koordinat bazlı sorgular için
CREATE INDEX idx_sahibinden_koordinatlar
ON sahibinden_liste USING GIST (
  (koordinatlar->>'lat')::float,
  (koordinatlar->>'lng')::float
);

-- İlçe aramaları için
CREATE INDEX idx_sahibinden_ilce
ON sahibinden_liste (ilce);

-- Kategori + transaction için
CREATE INDEX idx_sahibinden_category_transaction
ON sahibinden_liste (category, transaction);
```

### 2. Caching

```typescript
// Redis ile POI sonuçlarını cache'le
const cacheKey = `poi:${lat}:${lng}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const pois = await detectNearbyPOIs(location);
await redis.setex(cacheKey, 3600, JSON.stringify(pois)); // 1 saat
```

### 3. Rate Limiting

```typescript
// Google Maps API için rate limit
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 dakika
  max: 10, // 10 istek
});
```

## 📈 Gelecek Geliştirmeler

- [ ] Zaman serisi analizi (fiyat trendi)
- [ ] Makine öğrenmesi modeli (XGBoost/Random Forest)
- [ ] Mahalle bazlı detaylı analiz
- [ ] Emlak ofisi karşılaştırması
- [ ] PDF rapor oluşturma
- [ ] E-posta ile detaylı rapor gönderimi
- [ ] Admin panelinde değerleme geçmişi
- [ ] A/B testing farklı algoritmalar

## 🐛 Troubleshooting

### Google Maps yüklenmiyor

- API key'in doğru olduğundan emin ol
- Maps JavaScript API ve Places API aktif mi kontrol et
- Browser console'da hata var mı bak

### Benzer ilan bulunamıyor

- `sahibinden_liste` tablosunda veri var mı?
- Koordinat bilgisi dolu mu?
- İlçe/mahalle bilgisi doğru mu?

### Değerleme çok yüksek/düşük

- Benzer ilanların kalitesini kontrol et
- Outlier (aykırı değer) filtreleme ekle
- Standart sapma çok yüksekse veri kalitesi düşük

## 📞 Destek

Sorularınız için: erkan@demirg ayrimenkul.com

---

**Geliştirici**: Erkan + Kiro AI
**Versiyon**: 1.0.0
**Tarih**: Ocak 2026
