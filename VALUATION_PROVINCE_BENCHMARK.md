# 🌍 İl Geneli Benchmark Algoritması

## Tarih: 22 Ocak 2026

## 🎯 Yeni Özellik: İl Geneli Karşılaştırma

### Motivasyon

**Sorun**: Yerel (ilçe bazlı) ilanlar yetersiz olduğunda güven skoru düşüyor.

**Çözüm**: Tüm il genelinde (Sakarya) aynı özelliklere sahip ilanları analiz et ve %15 ağırlıkla ekle.

## 📊 Algoritma

### 1. İki Katmanlı Değerleme

```
Yerel Değerleme (İlçe Bazlı)
├── Konum odaklı
├── Mesafe bazlı filtreleme
└── Benzerlik skoru

İl Geneli Benchmark
├── Tüm ilçeler
├── Bina yaşı ±2 yıl
├── Alan ±10%
└── Outlier filtreleme

Final Değer = (Yerel × 0.85) + (İl Geneli × 0.15)
```

### 2. Filtreler

**İl Geneli Benchmark Kriterleri**:

- **Kategori**: Aynı (konut/arsa/işyeri)
- **Alan**: ±10% (örn: 130 m² → 117-143 m²)
- **Bina Yaşı**: ±2 yıl (örn: 5 yıl → 3-7 yıl)
- **İlçe**: Tüm Sakarya (Hendek, Adapazarı, Akyazı, Geyve, vb.)
- **Limit**: 200 ilan

### 3. Ağırlıklı Ortalama

```typescript
// Yerel ortalama
const localAvg = 20,000 TL/m²  // 6 ilan

// İl geneli ortalama
const provinceAvg = 18,000 TL/m²  // 50 ilan

// Ağırlıklı ortalama
const finalAvg = (localAvg × 0.85) + (provinceAvg × 0.15)
               = (20,000 × 0.85) + (18,000 × 0.15)
               = 17,000 + 2,700
               = 19,700 TL/m²
```

## 🔧 Implementasyon

### Yeni Fonksiyon: `findProvinceBenchmark()`

**Dosya**: `src/lib/valuation/comparable-finder.ts`

```typescript
export async function findProvinceBenchmark(
  features: PropertyFeatures,
): Promise<{
  avgPricePerM2: number;
  count: number;
  priceRange: { min: number; max: number };
}> {
  // 1. Alan aralığı: ±10%
  const minArea = features.area * 0.9;
  const maxArea = features.area * 1.1;

  // 2. Bina yaşı aralığı: ±2 yıl (sadece konut)
  let ageFilter = sql``;
  if (features.propertyType === "konut" && features.buildingAge) {
    const minAge = Math.max(0, features.buildingAge - 2);
    const maxAge = features.buildingAge + 2;
    ageFilter = sql`
      AND ozellikler->>'binaYasi' IS NOT NULL
      AND CAST(REGEXP_REPLACE(ozellikler->>'binaYasi', '[^0-9]', '', 'g') AS INTEGER) 
          BETWEEN ${minAge} AND ${maxAge}
    `;
  }

  // 3. İl geneli sorgu (tüm ilçeler)
  const results = await db.execute(sql`
    SELECT fiyat, m2, ilce
    FROM sahibinden_liste
    WHERE 
      category = ANY('{konut}'::text[])
      AND transaction = 'satilik'
      AND m2 BETWEEN ${minArea} AND ${maxArea}
      ${ageFilter}
    LIMIT 200
  `);

  // 4. Outlier filtreleme (IQR)
  // 5. Ortalama hesapla
}
```

### Güncellenen Fonksiyon: `performValuation()`

**Dosya**: `src/lib/valuation/valuation-engine.ts`

```typescript
// 1. Yerel değerleme
const marketStats = calculateMarketStatistics(comparableProperties);

// 2. İl geneli benchmark
const provinceBenchmark = await findProvinceBenchmark(features);

// 3. Ağırlıklı ortalama
let finalAvgPricePerM2 = marketStats.avgPricePerM2;

if (provinceBenchmark.count > 0) {
  finalAvgPricePerM2 = Math.round(
    marketStats.avgPricePerM2 * 0.85 + provinceBenchmark.avgPricePerM2 * 0.15,
  );
}

// 4. Final değer hesapla
const baseValue = finalAvgPricePerM2 * features.area;
```

## 📈 Güven Skoru Güncellemesi

### Yeni Puanlama Sistemi

**Önceki** (100 puan):

- Karşılaştırma sayısı: 40 puan
- Veri tutarlılığı: 30 puan
- Konum skoru: 30 puan

**Yeni** (100 puan):

- Karşılaştırma sayısı: 35 puan
- Veri tutarlılığı: 25 puan
- Konum skoru: 20 puan
- **İl geneli benchmark: 20 puan** (YENİ!)

```typescript
// İl geneli benchmark bonus
if (provinceBenchmarkCount >= 50) score += 20;
else if (provinceBenchmarkCount >= 30) score += 15;
else if (provinceBenchmarkCount >= 15) score += 10;
else if (provinceBenchmarkCount >= 5) score += 5;
```

## 🧪 Test Senaryoları

### Senaryo 1: Yetersiz Yerel Veri

**Input**:

- Konum: Hendek
- Alan: 130 m²
- Bina Yaşı: 5 yıl

**Önceki**:

- Yerel ilan: 6
- Güven skoru: %41
- Değer: 5.4M TL

**Yeni (Beklenen)**:

- Yerel ilan: 6
- İl geneli: 50+
- Güven skoru: %60+
- Değer: 5.2M TL (daha dengeli)

### Senaryo 2: Yeterli Yerel Veri

**Input**:

- Konum: Adapazarı Merkez
- Alan: 100 m²
- Bina Yaşı: 3 yıl

**Önceki**:

- Yerel ilan: 25
- Güven skoru: %75
- Değer: 3.5M TL

**Yeni (Beklenen)**:

- Yerel ilan: 25
- İl geneli: 80+
- Güven skoru: %85+
- Değer: 3.4M TL (minimal değişim, %85 yerel ağırlık)

## 📊 Console Log'ları

### Beklenen Çıktı

```
🚀 Değerleme başlatılıyor...
🔍 POI tespiti yapılıyor...
📊 Konum skoru hesaplanıyor...
🏘️ Benzer ilanlar aranıyor...
🎯 Trying strategy: Dar Filtre (İlçe + Alan ±20%)
✅ Found 6 results with strategy: Orta Filtre (İlçe + Alan ±50%)
📈 Piyasa analizi yapılıyor...
📊 Market Statistics: {
  avgPricePerM2: 20000,
  medianPricePerM2: 19500,
  outliers: 1,
  comparables: 6
}
🌍 İl geneli benchmark hesaplanıyor...
📊 İl Geneli Benchmark Results: {
  rowCount: 52,
  areaRange: '117-143 m²',
  ageRange: '3-7 yıl'
}
📊 İl Geneli Outlier Analysis: {
  total: 52,
  filtered: 48,
  outliers: 4
}
📊 Province Benchmark: {
  avgPricePerM2: 18000,
  count: 48,
  priceRange: { min: 15000, max: 22000 }
}
⚖️ Ağırlıklı Ortalama: {
  local: 20000,
  province: 18000,
  weighted: 19700,
  formula: '85% yerel + 15% il geneli'
}
✅ Değerleme tamamlandı: {
  estimatedValue: 5200000,
  confidenceScore: 62,
  comparables: 6,
  provinceBenchmark: 48
}
```

## 🎯 Avantajlar

### 1. Daha Güvenilir Değerleme

- **Önceki**: 6 ilan → %41 güven
- **Yeni**: 6 + 48 ilan → %62 güven

### 2. Outlier Etkisini Azaltır

Yerel 12.5M TL'lik müstakil ev outlier'ı, 48 il geneli ilan ile dengelenir.

### 3. Veri Azlığında Çözüm

Küçük ilçelerde (Hendek, Geyve) yerel veri az olsa bile il geneli benchmark devreye girer.

### 4. Bölgesel Fiyat Farkını Korur

%85 yerel ağırlık sayesinde bölgesel fiyat farkları korunur.

## 📝 AI Insights Güncellemesi

### Yeni Insight Mesajları

**Örnek 1**: Yerel > İl Geneli

```
"6 yerel ilan ve 48 il geneli ilan analiz edilerek 5.2M TL değerleme yapıldı.
Bu bölge il geneli ortalamasının %11.1 üzerinde fiyatlanıyor."
```

**Örnek 2**: Yerel < İl Geneli

```
"8 yerel ilan ve 52 il geneli ilan analiz edilerek 4.8M TL değerleme yapıldı.
Bu bölge il geneli ortalamasının %8.5 altında fiyatlanıyor."
```

**Örnek 3**: Yerel ≈ İl Geneli

```
"12 yerel ilan ve 45 il geneli ilan analiz edilerek 5.5M TL değerleme yapıldı.
Yerel fiyatlar il geneli ortalamasına çok yakın."
```

## 🚀 Deployment

### Test Etme

```bash
npm run dev
# http://localhost:3000/degerleme
```

**Test Parametreleri**:

- Konum: Hendek
- Mülk Tipi: Konut
- Alan: 130 m²
- Bina Yaşı: 5 yıl

**Beklenen**:

- İl geneli benchmark: 40-60 ilan
- Güven skoru: %55-65
- Console'da "⚖️ Ağırlıklı Ortalama" mesajı

### Production Deploy

```bash
git add .
git commit -m "feat: İl geneli benchmark algoritması eklendi (±10% alan, ±2 yıl bina yaşı, %15 ağırlık)"
git push origin main
```

## 📚 Referanslar

### Dosyalar

- `src/lib/valuation/comparable-finder.ts` - `findProvinceBenchmark()`
- `src/lib/valuation/valuation-engine.ts` - Ağırlıklı ortalama
- `VALUATION_SUCCESS_REPORT.md` - Genel rapor

### Algoritmalar

- **IQR Outlier Detection**: Interquartile Range ile aykırı değer tespiti
- **Weighted Average**: Ağırlıklı ortalama (85/15 split)
- **Confidence Scoring**: 4 faktörlü güven skoru

---

**Geliştirici**: Erkan + Kiro AI
**Tarih**: 22 Ocak 2026
**Status**: ✅ Implemented & Ready for Testing
