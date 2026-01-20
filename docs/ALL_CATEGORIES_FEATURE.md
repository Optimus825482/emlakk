# "Tümü" Kategorisi - Toplu Tarama Özelliği

## 🎯 Özellik

Admin panelinde **"Tümü"** seçeneği eklendi. Tüm kategorileri **sırayla** tarar.

## 📋 Kategori Sırası

```
1. Konut - Satılık
2. Konut - Kiralık
3. İşyeri - Satılık
4. İşyeri - Kiralık
5. Arsa - Satılık
6. Bina (Tümü)
```

## 🔧 Teknik Detaylar

### Frontend (Admin Panel)

**Dosya:** `src/app/admin/veri-toplama/page.tsx`

```tsx
<select value={selectedCategory}>
  <option value="all">🔥 Tümü (Tüm Kategoriler Sırayla)</option>
  <option value="konut_satilik">Konut - Satılık</option>
  <option value="konut_kiralik">Konut - Kiralık</option>
  <option value="isyeri_satilik">İş Yeri - Satılık</option>
  <option value="isyeri_kiralik">İş Yeri - Kiralık</option>
  <option value="arsa_satilik">Arsa - Satılık</option>
  <option value="bina">Bina (Tümü)</option>
</select>;

{
  selectedCategory === "all" && (
    <div className="info-box">
      Tüm kategoriler sırayla taranacak: Konut Satılık → Konut Kiralık → İşyeri
      Satılık → İşyeri Kiralık → Arsa Satılık → Bina
    </div>
  );
}
```

### Backend API

**Dosya:** `src/app/api/crawler/crawl/route.ts`

```typescript
// "all" seçeneği - tüm kategorileri gönder
let categoryList: string[];
if (categories === "all") {
  categoryList = [
    "konut_satilik",
    "konut_kiralik",
    "isyeri_satilik",
    "isyeri_kiralik",
    "arsa_satilik",
    "bina",
  ];
} else {
  categoryList = [categories];
}

// Mining API'ye gönder
const response = await fetch(`${MINING_API_URL}/jobs/list-crawl`, {
  method: "POST",
  body: JSON.stringify({
    categories: categoryList,
    max_pages,
    max_listings: null,
  }),
});
```

### Crawler (Python)

**Dosya:** `crwal4ai/sahibinden_uc_batch_supabase.py`

Zaten multiple kategori desteği var:

```python
def run(self, categories: Optional[List[str]] = None, max_pages: int = 100):
    """
    categories: ["konut_satilik", "arsa_satilik", ...]
    Her kategori sırayla taranır
    """
    for key in categories:
        self.crawl_category(key, config, max_pages)
        # Kategoriler arası bekleme
        time.sleep(CATEGORY_DELAY)
```

## 📊 UI Özellikleri

### 1. Bilgilendirme Kutusu

"Tümü" seçildiğinde:

```
ℹ️ Tüm kategoriler sırayla taranacak:
   Konut Satılık → Konut Kiralık → İşyeri Satılık →
   İşyeri Kiralık → Arsa Satılık → Bina
```

### 2. Başlatma Mesajı

```javascript
alert("Tüm kategoriler (6) sırayla taranacak!");
```

### 3. Tamamlanan Kategoriler Göstergesi

Aktif job kartında:

```
Tamamlanan Kategoriler (3)
✓ konut_satilik  ✓ konut_kiralik  ✓ isyeri_satilik
```

## 🎯 Kullanım Senaryoları

### Senaryo 1: Günlük Tam Tarama

```
1. Admin paneli aç
2. "Tümü" seç
3. "Taramayı Başlat" tıkla
4. Bekle (tüm kategoriler taranacak)
5. Sonuç: Tüm Hendek ilanları güncel
```

### Senaryo 2: Tek Kategori Tarama

```
1. Admin paneli aç
2. "Arsa - Satılık" seç
3. "Taramayı Başlat" tıkla
4. Bekle (sadece arsa taranacak)
5. Sonuç: Arsa ilanları güncel
```

## ⏱️ Tahmini Süreler

| Seçenek      | Kategori Sayısı | Tahmini Süre |
| ------------ | --------------- | ------------ |
| Tek Kategori | 1               | 2-5 dakika   |
| Tümü         | 6               | 15-30 dakika |

**Not:** Smart Pagination sayesinde gereksiz sayfa taraması yapılmıyor!

## 📈 İstatistikler

"Tümü" seçildiğinde toplam:

```
Kategori: 6
Toplam İlan: ~2.500-3.000
Toplam Sayfa: ~60-80 (smart pagination ile)
Süre: ~20 dakika
```

## 🔄 Kategori Sırası Mantığı

Neden bu sıra?

1. **Konut Satılık** → En çok ilan (öncelikli)
2. **Konut Kiralık** → İkinci en çok
3. **İşyeri Satılık** → Orta seviye
4. **İşyeri Kiralık** → Orta seviye
5. **Arsa Satılık** → Çok ilan
6. **Bina** → En az ilan (son)

## 🚀 Avantajlar

### 1. Tek Tıkla Tam Tarama

- ✅ Manuel kategori seçimi yok
- ✅ Tüm ilanlar güncel
- ✅ Zaman tasarrufu

### 2. Otomatik Sıralama

- ✅ Optimal sıra
- ✅ Kategoriler arası bekleme
- ✅ Rate limiting koruması

### 3. İlerleme Takibi

- ✅ Hangi kategori taranıyor?
- ✅ Kaç kategori tamamlandı?
- ✅ Real-time istatistikler

## 🧪 Test

```bash
# Test 1: Frontend'den "Tümü" seç
1. http://localhost:3000/admin/veri-toplama
2. Kategori: "Tümü" seç
3. "Taramayı Başlat" tıkla
4. Gözlemle:
   - ✅ "Tüm kategoriler (6) sırayla taranacak!" mesajı
   - ✅ Job başladı
   - ✅ İlk kategori: konut_satilik
   - ✅ Tamamlanan kategoriler listesi güncelleniyor

# Test 2: API'den direkt
curl -X POST http://localhost:3000/api/crawler/crawl \
  -H "Content-Type: application/json" \
  -d '{"categories": "all", "max_pages": 100}'

# Response:
{
  "success": true,
  "job_id": "...",
  "message": "Crawler başlatıldı (6 kategori)",
  "categories": [
    "konut_satilik",
    "konut_kiralik",
    "isyeri_satilik",
    "isyeri_kiralik",
    "arsa_satilik",
    "bina"
  ]
}
```

## 📝 Log Örneği

```
2026-01-19 12:00:00 - INFO - 🚀 Crawler başlatıldı (6 kategori)
2026-01-19 12:00:01 - INFO - 📂 Kategori: konut_satilik
2026-01-19 12:00:05 - INFO - 📊 Toplam ilan: 606
2026-01-19 12:00:05 - INFO - 🎯 Taranacak sayfa: 13
2026-01-19 12:05:00 - INFO - ✅ Kategori tamamlandı: konut_satilik
2026-01-19 12:05:10 - INFO - 📂 Kategori: konut_kiralik
...
2026-01-19 12:25:00 - INFO - ✅ Tüm kategoriler tamamlandı!
```

## 🎨 UI Görünümü

```
┌─────────────────────────────────────────┐
│ Crawler Ayarları                        │
├─────────────────────────────────────────┤
│ Kategori:                               │
│ [🔥 Tümü (Tüm Kategoriler Sırayla) ▼]  │
│                                         │
│ ℹ️ Tüm kategoriler sırayla taranacak:  │
│    Konut Satılık → Konut Kiralık →     │
│    İşyeri Satılık → İşyeri Kiralık →   │
│    Arsa Satılık → Bina                  │
│                                         │
│ [▶ Taramayı Başlat]                     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Aktif İş: abc123...                     │
├─────────────────────────────────────────┤
│ Durum: Çalışıyor                        │
│ Kategori: konut_satilik                 │
│ Sayfa: 5 / 13                           │
│ İlerleme: 38%                           │
│                                         │
│ Tamamlanan Kategoriler (2)              │
│ ✓ konut_satilik  ✓ konut_kiralik       │
└─────────────────────────────────────────┘
```

---

**Tarih:** 2026-01-19
**Durum:** ✅ Implement Edildi
**Test:** ⏳ Bekliyor
