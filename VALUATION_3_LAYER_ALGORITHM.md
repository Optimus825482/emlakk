# 🎯 3 Katmanlı Değerleme Algoritması

## Tarih: 22 Ocak 2026

## 🚀 Yeni Özellik: Mahalle Mikro-Piyasa Analizi

### Motivasyon

**Sorun**: Sadece benzer ilanlar ve il geneli yeterli değil. Mahalle bazlı fiyat dinamikleri eksik.

**Çözüm**: Aynı ilçe + mahallede satılık TÜM konutların ortalama m² fiyatını hesapla ve %35 ağırlıkla ekle.

## 📊 3 Katmanlı Algoritma

```
┌─────────────────────────────────────────────────────────┐
│                  DEĞERLEME SİSTEMİ                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1️⃣ YEREL (İlçe + Benzerlik)          → %50 Ağırlık    │
│     ├─ Konum odaklı                                     │
│     ├─ Mesafe bazlı filtreleme                          │
│     ├─ Alan ±20-50%                                     │
│     └─ Benzerlik skoru >30                              │
│                                                          │
│  2️⃣ MAHALLE MİKRO-PİYASA (YENİ!)      → %35 Ağırlık    │
│     ├─ Aynı ilçe + mahalle                              │
│     ├─ TÜM satılık konutlar                             │
│     ├─ Alan filtresi YOK                                │
│     └─ Outlier filtreleme (IQR)                         │
│                                                          │
│  3️⃣ İL GENELİ BENCHMARK                → %15 Ağırlık    │
│     ├─ Tüm ilçeler                                      │
│     ├─ Bina yaşı ±2 yıl                                 │
│     ├─ Alan ±10%                                        │
│     └─ Outlier filtreleme (IQR)                         │
│                                                          │
│  FINAL = (Yerel × 0.50) + (Mahalle × 0.35) +           │
│          (İl Geneli × 0.15)                             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 🔧 Implementasyon

### Yeni Fonksiyon: `findNeighborhoodAverage()`

**Dosya**: `src/lib/valuation/comparable-finder.ts`

```typescript
export async function findNeighborhoodAverage(
  location: LocationPoint,
  propertyType: PropertyFeatures["propertyType"],
): Promise<{
  avgPricePerM2: number;
  count: number;
  priceRange: { min: number; max: number };
}> {
  // 1. Mahalle filtresi
  const ilce = location.ilce || "";
  const mahalle = location.mahalle || "";

  // 2. TÜM satılık konutları getir (alan filtresi YOK)
  const results = await db.execute(sql`
    SELECT fiyat, m2, konum, ilce
    FROM sahibinden_liste
    WHERE 
      category = 'konut'
      AND transaction = 'satilik'
      AND ilce ILIKE '%${ilce}%'
      ${mahalle ? sql`AND konum ILIKE '%${mahalle}%'` : sql``}
    LIMIT 100
  `);

  // 3. m² fiyatlarını hesapla
  const pricesPerM2 = rows.map((row) => Math.round(fiyat / m2Value));

  // 4. Outlier filtreleme (IQR)
  const filtered = removeOutliers(pricesPerM2);

  // 5. Ortalama hesapla
  const avgPricePerM2 = Math.round(
    filtered.reduce((sum, p) => sum + p, 0) / filtered.length,
  );

  return { avgPricePerM2, count: filtered.length, priceRange };
}
```

### Güncellenen: `performValuation()`

**Dosya**: `src/lib/valuation/valuation-engine.ts`

```typescript
// 1. Yerel değerleme
const marketStats = calculateMarketStatistics(comparableProperties);

// 2. İl geneli benchmark
const provinceBenchmark = await findProvinceBenchmark(features);

// 3. Mahalle mikro-piyasa (YENİ!)
const neighborhoodAvg = await findNeighborhoodAverage(
  location,
  features.propertyType,
);

// 4. 3 Katmanlı Ağırlıklı Ortalama
if (neighborhoodAvg.count > 0 && provinceBenchmark.count > 0) {
  // 3 katman: %50 + %35 + %15
  finalAvgPricePerM2 = Math.round(
    marketStats.avgPricePerM2 * 0.5 +
      neighborhoodAvg.avgPricePerM2 * 0.35 +
      provinceBenchmark.avgPricePerM2 * 0.15,
  );
} else if (provinceBenchmark.count > 0) {
  // 2 katman: %85 + %15
  finalAvgPricePerM2 = Math.round(
    marketStats.avgPricePerM2 * 0.85 + provinceBenchmark.avgPricePerM2 * 0.15,
  );
} else if (neighborhoodAvg.count > 0) {
  // 2 katman: %65 + %35
  finalAvgPricePerM2 = Math.round(
    marketStats.avgPricePerM2 * 0.65 + neighborhoodAvg.avgPricePerM2 * 0.35,
  );
} else {
  // 1 katman: %100 yerel
  finalAvgPricePerM2 = marketStats.avgPricePerM2;
}
```

## 📈 Güven Skoru Güncellemesi

### Yeni Puanlama Sistemi (100 puan)

| Faktör                   | Önceki | Yeni   | Değişiklik |
| ------------------------ | ------ | ------ | ---------- |
| Karşılaştırma sayısı     | 35     | 30     | -5         |
| Veri tutarlılığı         | 25     | 20     | -5         |
| Konum skoru              | 20     | 15     | -5         |
| **Mahalle mikro-piyasa** | 0      | **20** | **+20** ✨ |
| İl geneli benchmark      | 20     | 15     | -5         |
| **TOPLAM**               | 100    | 100    | -          |

```typescript
// Mahalle mikro-piyasa bonus (0-20 puan)
if (neighborhoodCount >= 20) score += 20;
else if (neighborhoodCount >= 10) score += 15;
else if (neighborhoodCount >= 5) score += 10;
else if (neighborhoodCount >= 3) score += 5;
```

## 🧪 Test Senaryoları

### Senaryo 1: Tam Veri (3 Katman)

**Input**:

- Konum: Hendek, Merkez Mahallesi
- Alan: 130 m²
- Bina Yaşı: 5 yıl

**Beklenen**:

- Yerel: 6 ilan → 20,000 TL/m²
- Mahalle: 15 ilan → 18,500 TL/m²
- İl Geneli: 50 ilan → 17,000 TL/m²

**Hesaplama**:

```
Final = (20,000 × 0.50) + (18,500 × 0.35) + (17,000 × 0.15)
      = 10,000 + 6,475 + 2,550
      = 19,025 TL/m²

Değer = 19,025 × 130 = 2,473,250 TL
Güven Skoru = 30 + 20 + 15 + 20 + 15 = 100% (maksimum!)
```

### Senaryo 2: Mahalle Verisi Yok (2 Katman)

**Input**:

- Konum: Hendek, Yeni Mahalle (veri az)
- Alan: 130 m²

**Beklenen**:

- Yerel: 6 ilan → 20,000 TL/m²
- Mahalle: 0 ilan → N/A
- İl Geneli: 50 ilan → 17,000 TL/m²

**Hesaplama**:

```
Final = (20,000 × 0.85) + (17,000 × 0.15)
      = 17,000 + 2,550
      = 19,550 TL/m²

Güven Skoru = 30 + 20 + 15 + 0 + 15 = 80%
```

### Senaryo 3: Sadece Yerel (1 Katman)

**Input**:

- Konum: Küçük köy
- Alan: 130 m²

**Beklenen**:

- Yerel: 6 ilan → 20,000 TL/m²
- Mahalle: 0 ilan → N/A
- İl Geneli: 0 ilan → N/A

**Hesaplama**:

```
Final = 20,000 × 1.00 = 20,000 TL/m²

Güven Skoru = 30 + 20 + 15 + 0 + 0 = 65%
```

## 📊 Console Log'ları

### Beklenen Çıktı (3 Katman)

```
🚀 Değerleme başlatılıyor...
🔍 POI tespiti yapılıyor...
📊 Konum skoru hesaplanıyor...
🏘️ Benzer ilanlar aranıyor...
✅ Found 6 results with strategy: Orta Filtre
📈 Piyasa analizi yapılıyor...
📊 Market Statistics: {
  avgPricePerM2: 20000,
  comparables: 6
}
🌍 İl geneli benchmark hesaplanıyor...
📊 Province Benchmark: {
  avgPricePerM2: 17000,
  count: 50
}
🏘️ Mahalle mikro-piyasa analizi yapılıyor...
📊 Mahalle Mikro-Piyasa Results: {
  rowCount: 15,
  ilce: 'Hendek',
  mahalle: 'Merkez'
}
📊 Mahalle Outlier Analysis: {
  total: 15,
  filtered: 14,
  outliers: 1
}
📊 Neighborhood Average: {
  avgPricePerM2: 18500,
  count: 14
}
⚖️ 3 Katmanlı Ağırlıklı Ortalama: {
  local: 20000,
  neighborhood: 18500,
  province: 17000,
  weighted: 19025,
  formula: '50% yerel + 35% mahalle + 15% il geneli'
}
✅ Değerleme tamamlandı: {
  estimatedValue: 2473250,
  confidenceScore: 85,
  comparables: 6,
  neighborhood: 14,
  province: 50
}
```

## 🎯 Avantajlar

### 1. Mahalle Dinamiklerini Yakalar

**Örnek**: Hendek Merkez vs Hendek Kemaliye

- Merkez: 20,000 TL/m² (gelişmiş)
- Kemaliye: 15,000 TL/m² (kırsal)

Mahalle mikro-piyasa bu farkı yakalayıp değerlemeye yansıtır.

### 2. Daha Fazla Veri = Daha Yüksek Güven

**Önceki**:

- 6 yerel + 50 il geneli = %62 güven

**Yeni**:

- 6 yerel + 14 mahalle + 50 il geneli = %85 güven

### 3. Outlier Etkisini Minimize Eder

3 farklı veri kaynağı outlier'ların etkisini azaltır:

- Yerel'de 12.5M TL'lik müstakil ev
- Mahalle ortalaması 18.5K TL/m²
- İl geneli 17K TL/m²
- Final: 19K TL/m² (dengeli!)

### 4. Bölgesel Farkları Korur

%50 yerel ağırlık sayesinde bölgesel fiyat farkları korunur.

## 📝 AI Insights Güncellemesi

### Yeni Insight Mesajları

**Örnek 1**: 3 Katman

```
"6 yerel ilan, 14 mahalle ilanı, 50 il geneli ilan analiz edilerek 2.47M TL değerleme yapıldı.
Seçilen konum mahalle ortalamasının %8.1 üzerinde değerleniyor.
Bu mahalle il geneli ortalamasının %8.8 üzerinde fiyatlanıyor."
```

**Örnek 2**: Mahalle Ortalamasına Yakın

```
"8 yerel ilan, 20 mahalle ilanı analiz edilerek 3.2M TL değerleme yapıldı.
Seçilen konum mahalle ortalamasına çok yakın.
Konum avantajlı - temel ihtiyaçlara erişim iyi."
```

**Örnek 3**: Mahalle Ortalamasının Altında

```
"5 yerel ilan, 12 mahalle ilanı analiz edilerek 2.8M TL değerleme yapıldı.
Bu konum mahalle ortalamasının %12.5 altında değerleniyor.
Konum gelişmeye açık - altyapı yatırımları değer artışı sağlayabilir."
```

## 🚀 Deployment

### Test Etme

```bash
npm run dev
# http://localhost:3000/degerleme
```

**Test Parametreleri**:

- Konum: Hendek, Merkez Mahallesi
- Mülk Tipi: Konut
- Alan: 130 m²
- Bina Yaşı: 5 yıl

**Beklenen**:

- Mahalle mikro-piyasa: 10-20 ilan
- İl geneli benchmark: 40-60 ilan
- Güven skoru: %75-90
- Console'da "⚖️ 3 Katmanlı Ağırlıklı Ortalama" mesajı

### Production Deploy

```bash
git add .
git commit -m "feat: 3 katmanlı değerleme algoritması - Mahalle mikro-piyasa analizi eklendi (%50 yerel + %35 mahalle + %15 il geneli)"
git push origin main
```

## 📚 Karşılaştırma Tablosu

| Özellik               | Önceki (2 Katman) | Yeni (3 Katman) | İyileşme |
| --------------------- | ----------------- | --------------- | -------- |
| Veri Kaynağı          | 2 (Yerel + İl)    | 3 (+ Mahalle)   | +50%     |
| Mahalle Analizi       | ❌                | ✅              | YENİ!    |
| Güven Skoru (örnek)   | %62               | %85             | +37%     |
| Outlier Dayanıklılığı | Orta              | Yüksek          | ⬆️       |
| Bölgesel Hassasiyet   | Orta              | Çok Yüksek      | ⬆️⬆️     |

## 🎓 Algoritma Mantığı

### Neden %50 + %35 + %15?

1. **%50 Yerel**: En benzer ilanlar, en yüksek ağırlık
2. **%35 Mahalle**: Mikro-piyasa dinamikleri, orta ağırlık
3. **%15 İl Geneli**: Genel piyasa trendi, düşük ağırlık

### Neden Alan Filtresi Yok (Mahalle)?

Mahalle mikro-piyasası **genel fiyat seviyesini** ölçer:

- 80 m² daire: 18,000 TL/m²
- 130 m² daire: 19,000 TL/m²
- 200 m² villa: 22,000 TL/m²

Ortalama: ~19,500 TL/m² → Mahallenin genel fiyat seviyesi

### Fallback Stratejisi

```
3 Katman Mevcut? → %50 + %35 + %15
Sadece İl Geneli? → %85 + %15
Sadece Mahalle?   → %65 + %35
Hiçbiri Yok?      → %100 Yerel
```

---

**Geliştirici**: Erkan + Kiro AI
**Tarih**: 22 Ocak 2026
**Status**: ✅ Implemented & Ready for Testing
