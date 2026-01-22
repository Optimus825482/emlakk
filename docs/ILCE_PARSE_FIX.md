# İlçe Parse Düzeltmesi

## Sorun

Veritabanındaki `konum` field'ı iki farklı formatta:

1. **Virgüllü format**: `"Sakarya, Hendek, Merkez Mah."`
2. **Virgülsüz format**: `"AkyazıHastahane Mah."` (bitişik yazılmış)

Önceki implementasyon sadece virgüllü formatı destekliyordu, bu yüzden ilçeler parse edilemiyordu.

## Çözüm

### 1. Districts API (`/api/sahibinden/districts/route.ts`)

İki formatı da destekleyen parse mantığı:

```typescript
// Sakarya ilçeleri listesi
const SAKARYA_DISTRICTS = [
  "Adapazarı",
  "Akyazı",
  "Arifiye",
  "Erenler",
  "Ferizli",
  "Geyve",
  "Hendek",
  "Karapürçek",
  "Karasu",
  "Kaynarca",
  "Kocaali",
  "Köyler",
  "Kuzuluk",
  "Merkez",
  "Pamukova",
  "Sapanca",
  "Serdivan",
  "Söğütlü",
  "Taraklı",
];

// Parse mantığı
locations.forEach((item) => {
  if (item.konum) {
    let foundDistrict: string | null = null;

    // Önce virgüllü format dene
    if (item.konum.includes(",")) {
      const parts = item.konum.split(",").map((p) => p.trim());
      if (parts.length >= 2) {
        foundDistrict = parts[1];
      }
    } else {
      // Virgülsüz format: İlçe adını string başında ara
      for (const district of SAKARYA_DISTRICTS) {
        if (item.konum.startsWith(district)) {
          foundDistrict = district;
          break;
        }
      }
    }

    if (foundDistrict) {
      districtCounts[foundDistrict] = (districtCounts[foundDistrict] || 0) + 1;
    }
  }
});
```

### 2. Listings API (`/api/sahibinden/listings/route.ts`)

SQL LIKE ile iki formatı da destekleyen filtre:

```typescript
if (district && district !== "all") {
  whereConditions.push(
    sql`(${sahibindenListe.konum} LIKE ${district + "%"} OR ${sahibindenListe.konum} LIKE ${"%, " + district + ",%"})`,
  );
}
```

**Açıklama:**

- `LIKE 'Akyazı%'` → Virgülsüz format: "AkyazıHastahane Mah."
- `LIKE '%, Akyazı,%'` → Virgüllü format: "Sakarya, Akyazı, Merkez Mah."

### 3. Category Stats API (`/api/sahibinden/category-stats/route.ts`)

Aynı SQL LIKE mantığı uygulandı.

## Test Sonuçları

```bash
python check_districts.py
```

**Çıktı:**

```
📊 Toplam kayıt: 4,521
📍 Konum field'ı dolu: 4,521 (100.0%)

📊 İlçe Dağılımı (Toplam 4 ilçe):
  Akyazı: 1,347 ilan
  Köyler: 1,308 ilan
  Merkez: 1,222 ilan
  Kuzuluk: 263 ilan
```

## API Test

```bash
curl http://localhost:3000/api/sahibinden/districts
```

**Response:**

```json
{
  "success": true,
  "data": [
    { "value": "akyazi", "label": "Akyazı", "count": 1347 },
    { "value": "kuzuluk", "label": "Kuzuluk", "count": 263 },
    { "value": "koyler", "label": "Köyler", "count": 1308 },
    { "value": "merkez", "label": "Merkez", "count": 1222 }
  ],
  "total": 4
}
```

## Frontend Değişiklikleri

### İlanlar Sayfası (`src/app/admin/sahibinden-ilanlar/page.tsx`)

1. **fetchDistricts()** - API response kontrolü eklendi
2. **İlçe Dropdown** - Custom SelectValue render eklendi
3. **useEffect** - District değiştiğinde otomatik listings yenileme
4. **Başlık** - Dynamic ilçe adı gösterimi

## Notlar

- Veritabanında şu an sadece 4 ilçe var: Akyazı, Köyler, Merkez, Kuzuluk
- Diğer ilçeler (Hendek, Adapazarı, vb.) henüz crawl edilmemiş
- Parse mantığı tüm 19 Sakarya ilçesini destekliyor
- Yeni ilçeler crawl edildiğinde otomatik olarak dropdown'da görünecek

## Dosyalar

- `src/app/api/sahibinden/districts/route.ts` - İlçe listesi API
- `src/app/api/sahibinden/listings/route.ts` - İlan listesi API (ilçe filtresi)
- `src/app/api/sahibinden/category-stats/route.ts` - Kategori istatistikleri API (ilçe filtresi)
- `src/app/admin/sahibinden-ilanlar/page.tsx` - İlanlar sayfası frontend
- `check_districts.py` - Veritabanı test script'i
