# 🔧 Veritabanı Alan Adı Düzeltmesi

## Tarih: 22 Ocak 2026

## 🐛 Sorun

Benzerlik skoru hesaplamasında oda sayısı, bina yaşı ve kat bilgileri **hiç kullanılmıyordu**!

### Neden?

Veritabanında alan adları **Türkçe ve boşluklu**:

- `ozellikler->>'Oda Sayısı'` = "3+1"
- `ozellikler->>'Bina Yaşı'` = "11-15 arası"
- `ozellikler->>'Bulunduğu Kat'` = "2"

Ama kod **camelCase** arıyordu:

- `ozellikler.odaSayisi` = **null** ❌
- `ozellikler.binaYasi` = **null** ❌
- `ozellikler.bulunduguKat` = **null** ❌

## ✅ Çözüm

### 1. Oda Sayısı Düzeltmesi

**Önceki Kod**:

```typescript
if (targetFeatures.roomCount && ozellikler.odaSayisi) {
  const roomDiff = Math.abs(
    targetFeatures.roomCount - parseInt(ozellikler.odaSayisi),
  );
  // ...
}
```

**Yeni Kod**:

```typescript
// Oda sayısı (veritabanında "Oda Sayısı" olarak saklanıyor)
if (targetFeatures.roomCount && ozellikler["Oda Sayısı"]) {
  // "3+1" formatını parse et
  const roomStr = ozellikler["Oda Sayısı"].toString();
  const roomMatch = roomStr.match(/^(\d+)/); // İlk sayıyı al (3+1 → 3)
  if (roomMatch) {
    const comparableRooms = parseInt(roomMatch[1]);
    const roomDiff = Math.abs(targetFeatures.roomCount - comparableRooms);
    if (roomDiff === 0) score += 8;
    else if (roomDiff === 1) score += 5;
    else if (roomDiff === 2) score += 3;
  }
}
```

**Örnekler**:

- "3+1" → 3 oda
- "4+1" → 4 oda
- "2+1" → 2 oda
- "8+2" → 8 oda

### 2. Bina Yaşı Düzeltmesi

**Önceki Kod**:

```typescript
if (targetFeatures.buildingAge && ozellikler.binaYasi) {
  const ageDiff = Math.abs(
    targetFeatures.buildingAge - parseInt(ozellikler.binaYasi),
  );
  // ...
}
```

**Yeni Kod**:

```typescript
// Bina yaşı (veritabanında "Bina Yaşı" olarak saklanıyor)
if (targetFeatures.buildingAge && ozellikler["Bina Yaşı"]) {
  // "11-15 arası" formatını parse et
  const ageStr = ozellikler["Bina Yaşı"].toString();
  const ageMatch = ageStr.match(/^(\d+)/); // İlk sayıyı al
  if (ageMatch) {
    const comparableAge = parseInt(ageMatch[1]);
    const ageDiff = Math.abs(targetFeatures.buildingAge - comparableAge);
    if (ageDiff <= 2) score += 7;
    else if (ageDiff <= 5) score += 5;
    else if (ageDiff <= 10) score += 3;
  }
}
```

**Örnekler**:

- "11-15 arası" → 11 yıl
- "0-5 arası" → 0 yıl
- "16-20 arası" → 16 yıl

### 3. Kat Düzeltmesi

**Önceki Kod**:

```typescript
if (targetFeatures.floor && ozellikler.bulunduguKat) {
  const floorDiff = Math.abs(
    targetFeatures.floor - parseInt(ozellikler.bulunduguKat),
  );
  // ...
}
```

**Yeni Kod**:

```typescript
// Kat (veritabanında "Bulunduğu Kat" olarak saklanıyor)
if (targetFeatures.floor && ozellikler["Bulunduğu Kat"]) {
  const floorStr = ozellikler["Bulunduğu Kat"].toString();
  const floorMatch = floorStr.match(/^(\d+)/); // İlk sayıyı al
  if (floorMatch) {
    const comparableFloor = parseInt(floorMatch[1]);
    const floorDiff = Math.abs(targetFeatures.floor - comparableFloor);
    if (floorDiff === 0) score += 5;
    else if (floorDiff <= 2) score += 3;
  }
}
```

## 📊 Etki Analizi

### Benzerlik Skoru Değişimi

**Önceki** (Oda sayısı, bina yaşı, kat kullanılmıyordu):

- Alan: 30 puan
- Mesafe: 25 puan
- Konum: 20 puan
- Özellikler: **0 puan** ❌ (hiç çalışmıyordu)
- **Toplam**: 75 puan (maksimum)

**Yeni** (Tüm özellikler çalışıyor):

- Alan: 30 puan
- Mesafe: 25 puan
- Konum: 20 puan
- Özellikler: **25 puan** ✅
  - Oda sayısı: 8 puan
  - Bina yaşı: 7 puan
  - Kat: 5 puan
  - Asansör: 2 puan
  - Otopark: 2 puan
  - Balkon: 1 puan
- **Toplam**: 100 puan (maksimum)

### Örnek Senaryo

**Input**:

- Konum: Hendek Terminal
- Alan: 130 m²
- **Oda Sayısı: 3+1** (3 oda)
- Bina Yaşı: 10 yıl
- Kat: 2

**Karşılaştırılan İlan**:

- Alan: 120 m² (±8%)
- Mesafe: 1 km
- Konum: Hendek Merkez
- **Oda Sayısı: 3+1** (3 oda) ✅
- Bina Yaşı: 11 yıl (±1 yıl) ✅
- Kat: 2 ✅

**Önceki Benzerlik Skoru**:

- Alan: 30 puan
- Mesafe: 20 puan
- Konum: 20 puan
- Özellikler: 0 puan ❌
- **Toplam**: 70 puan

**Yeni Benzerlik Skoru**:

- Alan: 30 puan
- Mesafe: 20 puan
- Konum: 20 puan
- Özellikler: 20 puan ✅
  - Oda sayısı eşleşti: +8 puan
  - Bina yaşı ±1 yıl: +7 puan
  - Kat eşleşti: +5 puan
- **Toplam**: 90 puan (+20 puan artış!)

## 🎯 Beklenen İyileşmeler

### 1. Daha Doğru Benzerlik Skorları

Artık oda sayısı, bina yaşı ve kat bilgileri **gerçekten kullanılıyor**!

### 2. Daha İyi Filtreleme

Minimum benzerlik skoru %30 olduğu için:

- Önceki: 70 puan → Kabul edilir
- Yeni: 90 puan → Çok iyi eşleşme!

### 3. Daha Güvenilir Değerleme

Benzer özelliklere sahip ilanlar daha yüksek skor alacak → Daha doğru fiyat tahmini

## 🧪 Test Senaryoları

### Test 1: Oda Sayısı Eşleşmesi

**Input**: 3+1 (3 oda)
**İlan 1**: "3+1" → +8 puan ✅
**İlan 2**: "4+1" → +5 puan (±1 oda)
**İlan 3**: "2+1" → +3 puan (±2 oda)
**İlan 4**: "8+2" → 0 puan (çok farklı)

### Test 2: Bina Yaşı Eşleşmesi

**Input**: 10 yıl
**İlan 1**: "11-15 arası" (11 yıl) → +7 puan ✅ (±1 yıl)
**İlan 2**: "6-10 arası" (6 yıl) → +5 puan (±4 yıl)
**İlan 3**: "0-5 arası" (0 yıl) → 0 puan (çok farklı)

### Test 3: Kat Eşleşmesi

**Input**: 2. kat
**İlan 1**: "2" → +5 puan ✅ (tam eşleşme)
**İlan 2**: "3" → +3 puan (±1 kat)
**İlan 3**: "5" → 0 puan (çok farklı)

## 🚀 Deployment

### Test Etme

```bash
npm run dev
# http://localhost:3000/degerleme
```

**Test Parametreleri**:

- Konum: Hendek Terminal
- Alan: 130 m²
- **Oda Sayısı: 3** (3+1 için)
- Bina Yaşı: 10 yıl
- Kat: 2

**Beklenen Console Log**:

```javascript
📊 Comparable search started: {
  location: {...},
  propertyType: 'konut',
  area: 130,
  roomCount: 3  // ✅ Artık kullanılıyor!
}

✅ Found X results with strategy: ...
// Benzerlik skorları artık daha yüksek olmalı (70+ → 85+)
```

## 📚 Veritabanı Alan Adları Referansı

| Özellik    | Veritabanı Alan Adı    | Format Örneği | Parse Yöntemi |
| ---------- | ---------------------- | ------------- | ------------- |
| Oda Sayısı | `"Oda Sayısı"`         | "3+1", "4+1"  | İlk sayıyı al |
| Bina Yaşı  | `"Bina Yaşı"`          | "11-15 arası" | İlk sayıyı al |
| Kat        | `"Bulunduğu Kat"`      | "2", "3"      | İlk sayıyı al |
| Asansör    | `ekOzellikler.asansor` | boolean       | Direkt kullan |
| Otopark    | `ekOzellikler.otopark` | boolean       | Direkt kullan |
| Balkon     | `ekOzellikler.balkon`  | boolean       | Direkt kullan |

## 🔍 Regex Pattern Açıklaması

```typescript
const roomMatch = roomStr.match(/^(\d+)/);
```

- `^` - String başlangıcı
- `(\d+)` - Bir veya daha fazla rakam (capture group)
- İlk sayıyı yakalar, geri kalanını görmezden gelir

**Örnekler**:

- "3+1" → ["3", "3"] → 3
- "4+1" → ["4", "4"] → 4
- "11-15 arası" → ["11", "11"] → 11

---

**Geliştirici**: Erkan + Kiro AI
**Tarih**: 22 Ocak 2026
**Status**: ✅ Fixed & Ready for Testing
