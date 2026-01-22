# Emlak Haritası Özelliği

## Genel Bakış

Kullanıcıların ilçe ve kategori bazlı emlak ilanlarını harita üzerinde görselleştirmesini sağlayan interaktif harita sistemi.

## Özellikler

### 1. Filtreleme Sistemi

- **İlçe Seçimi**: Tüm Sakarya ilçeleri (Adapazarı, Akyazı, Hendek, vb.)
- **Kategori Seçimi**: Konut, Arsa, İşyeri, Bina
- **İlan Tipi**: Satılık / Kiralık
- **Çoklu Filtre**: Kombinasyon halinde kullanılabilir

### 2. Harita Görselleştirme

- **Leaflet.js** kullanılarak interaktif harita
- **OpenStreetMap** tile layer
- **Custom Marker Icons**:
  - 🔵 Mavi: Satılık ilanlar
  - 🔴 Kırmızı: Kiralık ilanlar
- **Popup Detayları**:
  - İlan görseli
  - Başlık
  - Fiyat
  - Konum
  - m² bilgisi
  - Kategori ve ilan tipi badge'leri
  - "İlanı Görüntüle" linki

### 3. İstatistikler

- Toplam ilan sayısı
- Satılık/Kiralık dağılımı
- Kategori bazlı sayılar (Konut, Arsa, İşyeri, Bina)

## Teknik Detaylar

### API Endpoint

**Endpoint**: `/api/sahibinden/map-data`

**Method**: GET

**Query Parameters**:

- `district` (optional): İlçe adı (örn: "Adapazarı")
- `category` (optional): Kategori (konut, arsa, isyeri, bina)
- `transaction` (optional): İlan tipi (satilik, kiralik)

**Response Format**:

```json
{
  "success": true,
  "data": {
    "markers": [
      {
        "id": 123,
        "position": { "lat": 40.7569, "lng": 30.4013 },
        "title": "İlan Başlığı",
        "price": "1.500.000 ₺",
        "location": "Adapazarı, Sakarya",
        "image": "https://...",
        "link": "https://...",
        "category": "konut",
        "transaction": "satilik",
        "m2": "120",
        "district": "Adapazarı",
        "markerColor": "blue"
      }
    ],
    "stats": {
      "total": 150,
      "satilik": 100,
      "kiralik": 50,
      "categories": {
        "konut": 80,
        "arsa": 30,
        "isyeri": 25,
        "bina": 15
      }
    },
    "filters": {
      "district": "Adapazarı",
      "category": "konut",
      "transaction": "satilik"
    }
  }
}
```

### Database Schema

**Tablo**: `sahibinden_liste`

**Kullanılan Kolonlar**:

- `id`: Benzersiz ilan ID
- `baslik`: İlan başlığı
- `link`: İlan URL'i
- `fiyat`: Fiyat (bigint)
- `konum`: Konum metni
- `resim`: Görsel URL'i
- `category`: Kategori (konut, arsa, isyeri, bina)
- `transaction`: İlan tipi (satilik, kiralik)
- `koordinatlar`: JSONB - `{ lat: string, lng: string }`
- `m2`: Metrekare bilgisi
- `ilce`: İlçe adı

### Frontend Component

**Dosya**: `src/components/admin/property-map.tsx`

**Teknolojiler**:

- React 19
- Next.js 14 (Dynamic Import for SSR)
- Leaflet 1.9.4
- React-Leaflet 5.0.0
- Shadcn UI components
- Tailwind CSS

**State Management**:

```typescript
const [districts, setDistricts] = useState<District[]>([]);
const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
const [selectedCategory, setSelectedCategory] = useState<string>("all");
const [selectedTransaction, setSelectedTransaction] = useState<string>("all");
const [mapData, setMapData] = useState<MapData | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [mapCenter, setMapCenter] = useState<[number, number]>([
  40.7569, 30.4013,
]);
```

### Admin Sayfası

**Route**: `/admin/emlak-haritasi`

**Dosya**: `src/app/admin/emlak-haritasi/page.tsx`

**Metadata**:

- Title: "Emlak Haritası | Demir Gayrimenkul"
- Description: "İlçe ve kategori bazlı emlak haritası görüntüleme"

## Kullanım

### 1. Filtre Seçimi

```
1. İlçe dropdown'ından ilçe seçin (örn: Adapazarı)
2. Kategori dropdown'ından kategori seçin (örn: Konut)
3. İlan tipi dropdown'ından tip seçin (örn: Satılık)
4. "Haritayı Göster" butonuna tıklayın
```

### 2. Harita Etkileşimi

- **Zoom**: Mouse scroll veya +/- butonları
- **Pan**: Haritayı sürükle
- **Marker Tıklama**: Popup açılır, ilan detayları görünür
- **İlanı Görüntüle**: Popup'taki buton ile sahibinden.com'a yönlendirilir

### 3. Performans

- **Limit**: Maksimum 1000 ilan gösterilir
- **Koordinat Validasyonu**: Geçersiz koordinatlar filtrelenir
- **Lazy Loading**: Harita component'i dinamik yüklenir (SSR sorunu önlenir)

## Güvenlik

### API Güvenliği

- ✅ SQL Injection koruması (Drizzle ORM parametreli sorgular)
- ✅ Input validasyonu (query parameters)
- ✅ Error handling (try-catch blokları)
- ✅ Rate limiting (Next.js API routes)

### Frontend Güvenliği

- ✅ XSS koruması (React otomatik escape)
- ✅ External link güvenliği (`rel="noopener noreferrer"`)
- ✅ Type safety (TypeScript)

## Hata Yönetimi

### API Hataları

```typescript
try {
  // API logic
} catch (error: any) {
  console.error("Map data error:", error);
  return NextResponse.json(
    {
      success: false,
      error: error.message || "Harita verileri alınamadı",
    },
    { status: 500 },
  );
}
```

### Frontend Hataları

- Loading state gösterimi
- Error alert gösterimi
- Boş sonuç durumu için friendly message

## Geliştirme Notları

### Leaflet SSR Sorunu

Leaflet browser-only kütüphane olduğu için Next.js'te SSR sorunu yaratır.

**Çözüm**: Dynamic import kullanımı

```typescript
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false },
);
```

### Marker Icon Sorunu

Leaflet default icon'ları webpack ile çalışmaz.

**Çözüm**: CDN kullanımı

```typescript
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});
```

### Custom Marker Icons

```typescript
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: ${color}; ..."></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

const blueIcon = createCustomIcon("#3b82f6"); // Satılık
const redIcon = createCustomIcon("#ef4444"); // Kiralık
```

## Gelecek İyileştirmeler

### Önerilen Özellikler

1. **Marker Clustering**: Çok sayıda marker için performans optimizasyonu
2. **Heatmap**: Yoğunluk haritası görünümü
3. **Çizim Araçları**: Kullanıcı bölge çizebilsin
4. **Kayıt Özelliği**: Favori bölgeleri kaydetme
5. **Fiyat Filtreleme**: Min-max fiyat aralığı
6. **m² Filtreleme**: Min-max metrekare aralığı
7. **Tarih Filtreleme**: İlan tarihi bazlı filtreleme
8. **Export**: Harita görünümünü PDF/PNG olarak kaydetme

### Performans İyileştirmeleri

1. **Pagination**: 1000+ ilan için sayfalama
2. **Viewport Filtering**: Sadece görünen alandaki ilanları yükle
3. **Caching**: Redis ile API response cache
4. **Lazy Marker Loading**: Zoom seviyesine göre marker yükleme

## Dosya Yapısı

```
src/
├── app/
│   ├── admin/
│   │   └── emlak-haritasi/
│   │       └── page.tsx              # Admin harita sayfası
│   └── api/
│       └── sahibinden/
│           └── map-data/
│               └── route.ts          # Harita data API
├── components/
│   └── admin/
│       └── property-map.tsx          # Harita component
└── db/
    └── schema/
        └── crawler.ts                # Database schema

docs/
└── EMLAK_HARITASI_FEATURE.md        # Bu dosya
```

## Test Senaryoları

### 1. Temel Filtreleme

- [ ] İlçe seçimi çalışıyor
- [ ] Kategori seçimi çalışıyor
- [ ] İlan tipi seçimi çalışıyor
- [ ] "Haritayı Göster" butonu çalışıyor

### 2. Harita Görselleştirme

- [ ] Harita yükleniyor
- [ ] Marker'lar doğru konumda
- [ ] Satılık ilanlar mavi
- [ ] Kiralık ilanlar kırmızı
- [ ] Popup açılıyor
- [ ] Popup içeriği doğru

### 3. İstatistikler

- [ ] Toplam sayı doğru
- [ ] Satılık/Kiralık sayıları doğru
- [ ] Kategori sayıları doğru

### 4. Hata Durumları

- [ ] Filtre seçilmeden uyarı gösteriliyor
- [ ] API hatası durumunda error mesajı
- [ ] Boş sonuç durumunda friendly message
- [ ] Loading state gösteriliyor

### 5. Performans

- [ ] 1000 marker hızlı yükleniyor
- [ ] Zoom/Pan smooth çalışıyor
- [ ] Popup açılma hızlı

## Bağımlılıklar

```json
{
  "leaflet": "^1.9.4",
  "react-leaflet": "^5.0.0",
  "@types/leaflet": "^1.9.21"
}
```

## Lisans ve Atıflar

- **Leaflet**: BSD 2-Clause License
- **OpenStreetMap**: ODbL License
- **React-Leaflet**: MIT License

---

**Oluşturulma Tarihi**: 2024
**Son Güncelleme**: 2024
**Geliştirici**: Demir Gayrimenkul Dev Team
