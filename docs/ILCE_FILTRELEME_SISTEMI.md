# İlçe Bazlı Filtreleme Sistemi

## Genel Bakış

Sahibinden.com ilanlarının ilçe bazlı filtrelenmesi ve istatistiklerinin görüntülenmesi için geliştirilen sistem.

## Özellikler

### 1. Backend API'ler

#### `/api/sahibinden/districts` (YENİ)

- **Amaç:** Veritabanındaki tüm ilçeleri listeler
- **Method:** GET
- **Response:**

```json
{
  "success": true,
  "data": [
    {
      "value": "hendek",
      "label": "Hendek",
      "count": 150
    },
    {
      "value": "adapazari",
      "label": "Adapazarı",
      "count": 320
    }
  ],
  "total": 2
}
```

#### `/api/sahibinden/category-stats` (GÜNCELLENDİ)

- **Amaç:** Kategori bazlı istatistikler
- **Method:** GET
- **Query Params:**
  - `district` (optional): İlçe adı (örn: "Hendek", "Adapazarı")
- **Örnek:** `/api/sahibinden/category-stats?district=Hendek`
- **Response:**

```json
{
  "success": true,
  "data": {
    "categories": [...],
    "total": 150,
    "district": "Hendek",
    "lastUpdate": "2024-01-15T10:30:00Z"
  }
}
```

#### `/api/sahibinden/listings` (GÜNCELLENDİ)

- **Amaç:** İlan listesi
- **Method:** GET
- **Query Params:**
  - `page` (optional): Sayfa numarası
  - `limit` (optional): Sayfa başına ilan sayısı
  - `district` (optional): İlçe adı
- **Örnek:** `/api/sahibinden/listings?district=Hendek&page=1&limit=20`

### 2. Frontend Component'ler

#### `SahibindenStatsClient` (YENİ)

- **Konum:** `src/components/admin/sahibinden-stats-client.tsx`
- **Özellikler:**
  - İlçe seçim dropdown'ı
  - Seçilen ilçeye göre dinamik istatistikler
  - Real-time güncelleme
  - Admin dashboard'da kullanılır

#### `SahibindenIlanlarPage` (GÜNCELLENDİ)

- **Konum:** `src/app/admin/sahibinden-ilanlar/page.tsx`
- **Yeni Özellikler:**
  - İlçe filtresi eklendi
  - URL query parametresi ile ilçe seçimi
  - Filtreleme sonuçlarında ilçe bilgisi gösterimi
  - "Tüm İlçeler" seçeneği

#### `SahibindenIncelemePage` (GÜNCELLENDİ)

- **Konum:** `src/app/admin/sahibinden-inceleme/page.tsx`
- **Yeni Özellikler:**
  - İlçe bazlı kategori istatistikleri
  - İlçe seçim dropdown'ı
  - Dinamik başlık (seçilen ilçeyi gösterir)

### 3. Veritabanı Yapısı

#### `sahibinden_liste` Tablosu

- **konum** field'ı: `text` formatında
- **Format:** "Sakarya, Hendek, Merkez Mah."
- **Parse Mantığı:** İkinci virgülden sonraki kısım ilçe adıdır

#### İlçe Parse Örneği

```typescript
// "Sakarya, Hendek, Merkez Mah." -> "Hendek"
// "Sakarya, Adapazarı, Yeni Mah." -> "Adapazarı"

const parts = konum.split(",").map((p) => p.trim());
const district = parts[1]; // İkinci kısım ilçe
```

## Kullanım Senaryoları

### 1. Admin Dashboard

1. Dashboard'da `SahibindenStatsClient` widget'ı görüntülenir
2. İlçe dropdown'ından ilçe seçilir
3. İstatistikler otomatik güncellenir
4. "Detaylı listele" linki seçilen ilçe ile açılır

### 2. İlan Listesi Sayfası

1. Sayfaya URL parametresi ile girilebilir: `/admin/sahibinden-ilanlar?district=Hendek`
2. Filtreler bölümünden ilçe seçilebilir
3. Seçilen ilçeye göre ilanlar filtrelenir
4. URL otomatik güncellenir

### 3. İnceleme Sayfası

1. Header'da ilçe dropdown'ı bulunur
2. İlçe seçildiğinde kategori istatistikleri güncellenir
3. Başlıkta seçilen ilçe gösterilir

## Teknik Detaylar

### API Filtreleme

```typescript
// Backend - Drizzle ORM
const whereConditions = [];
if (district && district !== "all") {
  whereConditions.push(like(sahibindenListe.konum, `%${district}%`));
}

const listings = await db
  .select({...})
  .from(sahibindenListe)
  .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);
```

### Frontend State Management

```typescript
const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
const [districts, setDistricts] = useState<District[]>([]);

// İlçe değiştiğinde API'yi çağır
const handleDistrictChange = (value: string) => {
  setSelectedDistrict(value);
  fetchStats(value);
};
```

### URL Parametresi Yönetimi

```typescript
// URL'den district parametresini al
const params = new URLSearchParams(window.location.search);
const districtParam = params.get("district");

// URL'i güncelle
const url = new URL(window.location.href);
if (value === "all") {
  url.searchParams.delete("district");
} else {
  url.searchParams.set("district", value);
}
window.history.pushState({}, "", url);
```

## Performance Optimizasyonu

### 1. Index Önerileri (Gelecek)

```sql
-- Konum field'ı için index (gerekirse)
CREATE INDEX idx_sahibinden_liste_konum ON sahibinden_liste(konum);

-- Composite index (category + transaction + konum)
CREATE INDEX idx_sahibinden_category_location
ON sahibinden_liste(category, transaction, konum);
```

### 2. Caching Stratejisi (Gelecek)

- İlçe listesi 1 saat cache'lenebilir
- Kategori istatistikleri 15 dakika cache'lenebilir

## Test Senaryoları

### ✅ Tamamlanması Gerekenler

- [ ] Hendek seç → İstatistikler güncellenmeli
- [ ] Adapazarı seç → Farklı sayılar göstermeli
- [ ] "Tüm İlçeler" seç → Toplam sayılar göstermeli
- [ ] İlan listesinde ilçe filtresi çalışmalı
- [ ] URL parametresi ile sayfa açılmalı
- [ ] Dashboard widget'ı doğru çalışmalı
- [ ] İnceleme sayfası ilçe bazlı istatistik göstermeli

## Dosya Değişiklikleri

### Yeni Dosyalar

1. `src/app/api/sahibinden/districts/route.ts` - İlçe listesi API
2. `src/components/admin/sahibinden-stats-client.tsx` - Client-side stats widget
3. `docs/ILCE_FILTRELEME_SISTEMI.md` - Bu dokümantasyon

### Güncellenen Dosyalar

1. `src/app/api/sahibinden/category-stats/route.ts` - İlçe parametresi eklendi
2. `src/app/api/sahibinden/listings/route.ts` - İlçe filtresi eklendi
3. `src/app/admin/sahibinden-ilanlar/page.tsx` - İlçe dropdown ve filtreleme
4. `src/app/admin/sahibinden-inceleme/page.tsx` - İlçe bazlı istatistikler
5. `src/app/admin/page.tsx` - Stats widget değiştirildi

## Geriye Uyumluluk

- Tüm API'ler `district` parametresi olmadan da çalışır
- `district` parametresi verilmezse veya "all" ise tüm ilanlar gösterilir
- Mevcut URL'ler ve linkler çalışmaya devam eder

## Gelecek İyileştirmeler

1. **Mahalle Bazlı Filtreleme:** İlçe seçildikten sonra mahalle seçimi
2. **Coğrafi Harita Görünümü:** İlçeleri harita üzerinde gösterme
3. **Karşılaştırma Modu:** İki ilçeyi yan yana karşılaştırma
4. **Trend Analizi:** İlçe bazlı ilan sayısı trendleri
5. **Export Özelliği:** İlçe bazlı raporları Excel'e aktarma

## Notlar

- İlçe isimleri case-insensitive olarak aranır (LIKE kullanılır)
- Türkçe karakter desteği vardır
- İlçe sayıları real-time olarak hesaplanır
- Performance için gerekirse caching eklenebilir
