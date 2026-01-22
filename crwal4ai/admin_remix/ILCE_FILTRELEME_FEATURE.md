# İlçe Filtreleme Sistemi - Admin Remix

## 📋 Genel Bakış

Admin Remix uygulamasına ilçe bazlı filtreleme sistemi eklendi. Kullanıcılar artık dashboard ve crawler sayfalarında ilçe seçerek verileri filtreleyebilir.

## ✅ Yapılan Değişiklikler

### 1. Backend (Python)

#### `db_manager.py` - Yeni Fonksiyonlar

```python
def get_district_list(self):
    """
    Veritabanındaki tüm ilçeleri listele

    Returns:
        List of dicts: [{'value': 'hendek', 'label': 'Hendek', 'count': 123}, ...]
    """
```

- Konum alanından ilçe bilgisini parse eder
- İlçe başına ilan sayısını hesaplar
- Alfabetik sıralama ile döndürür

```python
def get_category_stats(self, district=None):
    """
    Kategori istatistikleri - ilçe bazlı filtreleme ile

    Args:
        district: İlçe adı (opsiyonel). None veya 'all' ise tüm ilçeler

    Returns:
        Dict: {'konut': {'satilik': 10, 'kiralik': 5, ...}, ...}
    """
```

- İlçe parametresi ile kategori istatistiklerini filtreler
- Yeni ilanları da dahil eder (son 7 gün)
- Geriye uyumlu (district=None ise tüm veriler)

#### `app.py` - Route Güncellemeleri

**Dashboard Route:**

```python
@app.route("/")
def index():
    """Ana dashboard - ilçe parametresi ile"""
    district = request.args.get('district', 'all')
    districts = db.get_district_list()
    return render_template('index.html',
                         districts=districts,
                         selected_district=district)
```

**Dashboard API:**

```python
@app.route("/api/dashboard")
def api_dashboard():
    """Dashboard özet verileri - İlçe Filtreleme Destekli"""
    district = request.args.get("district", "all")
    # İlçe bazlı SQL filtreleme
    # ...
```

**Crawler API (Zaten Vardı):**

```python
@app.route("/api/crawler/start", methods=["POST"])
def api_crawler_start():
    district = data.get("district", "hendek")
    # Crawler'a ilçe parametresi gönderilir
```

### 2. Frontend (HTML/JavaScript)

#### `templates/index.html` - Dashboard

**İlçe Dropdown Eklendi:**

```html
<div
  class="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-slate-200/60 dark:border-slate-700/60 shadow-sm transition-premium hover:border-violet-400"
>
  <svg
    class="w-4 h-4 text-violet-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    ></path>
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    ></path>
  </svg>
  <select
    x-model="districtFilter"
    @change="loadData()"
    class="bg-transparent text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
  >
    <option value="all">Tüm İlçeler</option>
    {% for district in districts %}
    <option
      value="{{ district.value }}"
      {%
      if
      selected_district=""
      ="district.value"
      %}selected{%
      endif
      %}
    >
      {{ district.label }} ({{ district.count }})
    </option>
    {% endfor %}
  </select>
</div>
```

**JavaScript Güncellemesi:**

```javascript
function dashboard() {
  return {
    districtFilter: "{{ selected_district }}" || "all", // YENİ

    async loadData() {
      const response = await fetch(
        `/api/dashboard?days=${this.timeFilter}&district=${this.districtFilter}`, // YENİ
      );
      // ...
    },
  };
}
```

#### `templates/crawler.html` - Crawler

**İlçe Seçimi (Zaten Vardı):**

```html
<select
  x-model="form.district"
  class="w-full bg-white dark:bg-slate-800 px-6 py-3 rounded-2xl text-sm font-bold text-slate-900 dark:text-white border-2 border-primary-200 dark:border-primary-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-premium cursor-pointer shadow-sm"
>
  <option value="hendek">Hendek</option>
  <option value="adapazari">Adapazarı</option>
  <option value="akyazi">Akyazı</option>
  <!-- ... diğer ilçeler -->
</select>
```

**JavaScript (Zaten Vardı):**

```javascript
async startCrawler() {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      categories: this.form.categories,
      district: this.form.district,  // İlçe parametresi
      // ...
    }),
  });
}
```

## 🎯 Özellikler

### Dashboard Sayfası

- ✅ İlçe dropdown'ı (zaman filtresinin yanında)
- ✅ İlçe bazlı toplam ilan sayısı
- ✅ İlçe bazlı yeni ilanlar
- ✅ İlçe bazlı kaldırılan ilanlar
- ✅ İlçe bazlı kategori dağılımı
- ✅ "Tüm İlçeler" seçeneği
- ✅ İlçe başına ilan sayısı gösterimi

### Crawler Sayfası

- ✅ İlçe seçimi (zaten vardı)
- ✅ Seçilen ilçe crawler'a gönderiliyor
- ✅ Job config'de ilçe bilgisi saklanıyor

## 📊 Veritabanı Sorguları

### İlçe Listesi

```sql
SELECT
    LOWER(TRIM(SPLIT_PART(konum, ',', 2))) as district,
    COUNT(*) as count
FROM sahibinden_liste
WHERE konum IS NOT NULL AND konum != ''
GROUP BY LOWER(TRIM(SPLIT_PART(konum, ',', 2)))
HAVING LOWER(TRIM(SPLIT_PART(konum, ',', 2))) != ''
ORDER BY count DESC
```

### İlçe Bazlı İstatistikler

```sql
SELECT
    category,
    transaction,
    COUNT(*) as count
FROM sahibinden_liste
WHERE LOWER(konum) LIKE '%hendek%'
GROUP BY category, transaction
```

## 🔧 Teknik Detaylar

### Konum Parse Mantığı

```
Örnek Konum: "Sakarya, Hendek, Merkez Mah."
Parse Sonucu: "hendek"

SQL: SPLIT_PART(konum, ',', 2)
Sonuç: " Hendek"
TRIM + LOWER: "hendek"
```

### URL Parametreleri

```
Dashboard:
http://localhost:5001/?district=hendek
http://localhost:5001/?district=all

API:
/api/dashboard?days=7&district=hendek
/api/dashboard?days=1&district=adapazari
```

### Geriye Uyumluluk

- İlçe parametresi opsiyonel
- Parametre yoksa veya "all" ise tüm veriler gösterilir
- Mevcut crawler işlemleri etkilenmez

## 🧪 Test Senaryoları

### Dashboard Testleri

1. ✅ Sayfa açılışında "Tüm İlçeler" seçili olmalı
2. ✅ İlçe seçildiğinde istatistikler güncellenmeli
3. ✅ Zaman filtresi ile birlikte çalışmalı
4. ✅ URL parametresi ile sayfa açılabilmeli
5. ✅ İlçe değiştiğinde chart güncellenmeli

### Crawler Testleri

1. ✅ İlçe seçimi crawler'a gönderilmeli
2. ✅ Job config'de ilçe bilgisi saklanmalı
3. ✅ Paralel crawler'da da çalışmalı

### API Testleri

```bash
# Tüm ilçeler
curl "http://localhost:5001/api/dashboard?days=7&district=all"

# Hendek
curl "http://localhost:5001/api/dashboard?days=7&district=hendek"

# Adapazarı
curl "http://localhost:5001/api/dashboard?days=1&district=adapazari"
```

## 📝 Kullanım Örnekleri

### Dashboard'da İlçe Seçimi

1. Dashboard sayfasını aç: `http://localhost:5001/`
2. Sağ üstteki ilçe dropdown'ından ilçe seç
3. İstatistikler otomatik güncellenir
4. Kategori kartları ilçe bazlı gösterilir

### Crawler'da İlçe Seçimi

1. Crawler sayfasını aç: `http://localhost:5001/crawler`
2. "Hedef İlçe Seçin" dropdown'ından ilçe seç
3. Kategorileri seç
4. "Sistemi Ateşle" butonuna tıkla
5. Seçilen ilçe için crawler başlar

## 🎨 UI/UX İyileştirmeleri

### Dashboard

- Violet renkli ilçe ikonu (konum pin)
- İlçe başına ilan sayısı gösterimi
- Hover efekti ile vurgu
- Responsive tasarım

### Crawler

- Gradient arka plan (primary-violet)
- Konum ikonu
- Açıklayıcı metin
- Tüm Sakarya ilçeleri listesi

## 🚀 Gelecek İyileştirmeler

1. **Mahalle Filtreleme**: İlçe seçildikten sonra mahalle bazlı filtreleme
2. **Harita Entegrasyonu**: İlçe bazlı harita görünümü
3. **Karşılaştırma**: İki ilçeyi karşılaştırma özelliği
4. **Trend Analizi**: İlçe bazlı trend grafikleri
5. **Export**: İlçe bazlı Excel/PDF export

## 📚 İlgili Dosyalar

```
yy/demir-gayrimenkul/crwal4ai/admin_remix/
├── db_manager.py              # İlçe fonksiyonları
├── app.py                     # Route güncellemeleri
├── templates/
│   ├── index.html            # Dashboard ilçe dropdown
│   └── crawler.html          # Crawler ilçe seçimi (zaten vardı)
└── ILCE_FILTRELEME_FEATURE.md  # Bu dosya
```

## 🔍 Debugging

### İlçe Listesi Boş Geliyorsa

```python
# db_manager.py'de debug
districts = db.get_district_list()
print(f"Districts: {districts}")
```

### İstatistikler Yanlışsa

```python
# app.py'de debug
stats = db.get_category_stats(district='hendek')
print(f"Stats for Hendek: {stats}")
```

### Frontend'de İlçe Seçilmiyorsa

```javascript
// Browser console'da
console.log("District Filter:", this.districtFilter);
console.log(
  "API URL:",
  `/api/dashboard?days=${this.timeFilter}&district=${this.districtFilter}`,
);
```

## ✅ Tamamlandı

- [x] `db_manager.py` - İlçe fonksiyonları eklendi
- [x] `app.py` - Dashboard route güncellendi
- [x] `app.py` - Dashboard API güncellendi
- [x] `templates/index.html` - İlçe dropdown eklendi
- [x] `templates/index.html` - JavaScript güncellendi
- [x] `templates/crawler.html` - İlçe seçimi zaten vardı
- [x] Dokümantasyon oluşturuldu

## 🎉 Sonuç

İlçe filtreleme sistemi başarıyla entegre edildi. Kullanıcılar artık hem dashboard hem de crawler sayfalarında ilçe bazlı veri görüntüleyebilir ve tarama yapabilir.

**Test için:**

```bash
cd yy/demir-gayrimenkul/crwal4ai/admin_remix
python app.py
# http://localhost:5001 adresini aç
```
