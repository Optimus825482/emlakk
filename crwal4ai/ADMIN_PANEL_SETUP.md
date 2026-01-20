# 🎨 Crawler Admin Panel Kurulum Rehberi

## 📁 Proje Yapısı

```
crwal4ai/
├── admin_remix/              # ✨ YENİ: Ayrı Admin Panel
│   ├── templates/            # HTML şablonları
│   │   ├── base.html        # Ana layout
│   │   ├── index.html       # Dashboard
│   │   ├── listings.html    # İlan listesi
│   │   ├── new_listings.html    # Yeni ilanlar
│   │   ├── removed_listings.html # Kaldırılan ilanlar
│   │   ├── jobs.html        # Job geçmişi
│   │   └── stats.html       # İstatistikler
│   ├── app.py               # Flask uygulaması
│   ├── requirements.txt     # Python dependencies
│   ├── start.bat            # Windows başlatma scripti
│   └── README.md            # Detaylı dokümantasyon
├── sahibinden_uc_batch_supabase.py  # Ana crawler
├── crawler_api.py           # FastAPI servisi
└── .env                     # Environment değişkenleri
```

## 🚀 Hızlı Başlangıç

### 1. Admin Panel Klasörüne Git

```bash
cd admin_remix
```

### 2. Virtual Environment Oluştur

```bash
python -m venv venv
```

### 3. Aktif Et

**Windows:**

```bash
venv\Scripts\activate
```

**Linux/Mac:**

```bash
source venv/bin/activate
```

### 4. Dependencies Yükle

```bash
pip install -r requirements.txt
```

### 5. Başlat

**Manuel:**

```bash
python app.py
```

**Windows (Otomatik):**

```bash
start.bat
```

### 6. Tarayıcıda Aç

```
http://localhost:5001
```

## 📊 Özellikler

### 1. Dashboard (/)

- Toplam ilan sayısı
- Yeni ilanlar (son 7 gün)
- Kaldırılan ilanlar (son 7 gün)
- Son crawler job durumu
- Kategori dağılımı
- Hızlı linkler

### 2. İlanlar (/listings)

- Tüm ilanları listele
- Filtreleme: Kategori, İşlem tipi
- Arama: Başlıkta ara
- Pagination: 12 ilan/sayfa
- Detay: Sahibinden'de gör

### 3. Yeni İlanlar (/new-listings)

- Son eklenen ilanlar
- Zaman filtresi: 1-30 gün
- Yeni ilan badge'i
- İlk görülme tarihi

### 4. Kaldırılan İlanlar (/removed-listings)

- Artık aktif olmayan ilanlar
- Zaman filtresi: 7-90 gün
- Aktif kalma süresi
- Fiyat değişim sayısı

### 5. İstatistikler (/stats)

- Kategori karşılaştırma tablosu
- Sahibinden vs Veritabanı
- Fark analizi
- Durum göstergesi (Yeni/Kaldırıldı/Senkron)

### 6. Jobs (/jobs)

- Crawler çalışma geçmişi
- Job durumu (completed/running/failed)
- İstatistikler (toplam/yeni/güncellenen/kaldırılan)
- Taranan kategoriler

## 🔧 Teknik Detaylar

### Backend (Flask)

- **Framework**: Flask 3.0+
- **Database**: Supabase (PostgreSQL)
- **Port**: 5001
- **Debug Mode**: Aktif (development)

### Frontend

- **CSS**: Tailwind CSS (CDN)
- **JS Framework**: Alpine.js (CDN)
- **Charts**: Chart.js (gelecekte)
- **Icons**: Emoji

### API Endpoints

| Endpoint                | Method | Açıklama                              |
| ----------------------- | ------ | ------------------------------------- |
| `/api/dashboard`        | GET    | Dashboard özet verileri               |
| `/api/listings`         | GET    | İlan listesi (pagination, filtreleme) |
| `/api/new-listings`     | GET    | Yeni ilanlar                          |
| `/api/removed-listings` | GET    | Kaldırılan ilanlar                    |
| `/api/category-stats`   | GET    | Kategori istatistikleri               |
| `/api/jobs`             | GET    | Crawler job geçmişi                   |

### Supabase Tabloları

1. **sahibinden_liste**: Ana ilan tablosu
   - Tüm crawler ilanları
   - Kategori, işlem tipi, fiyat, konum

2. **new_listings**: Yeni ilanlar
   - Son 2 gün içinde eklenen
   - İlk görülme tarihi

3. **removed_listings**: Kaldırılan ilanlar
   - Artık aktif olmayan
   - Kaldırılma tarihi, aktif süre

4. **category_stats**: Kategori istatistikleri
   - Sahibinden vs DB karşılaştırma
   - Fark analizi

5. **mining_jobs**: Crawler job kayıtları
   - Job durumu, istatistikler
   - Taranan kategoriler

6. **mining_logs**: Crawler logları
   - Detaylı log kayıtları

## 🎯 Kullanım Senaryoları

### Senaryo 1: Yeni İlanları Kontrol Et

1. `/new-listings` sayfasına git
2. Zaman aralığını seç (örn: Son 24 saat)
3. Yeni ilanları incele
4. "Sahibinden'de Gör" ile detaya git

### Senaryo 2: Kategori Analizi Yap

1. `/stats` sayfasına git
2. Kategori karşılaştırma tablosunu incele
3. Fark sütununu kontrol et
4. Yeni/Kaldırılan ilanları tespit et

### Senaryo 3: Crawler Geçmişini İncele

1. `/jobs` sayfasına git
2. Son job'ları listele
3. İstatistikleri kontrol et
4. Hata varsa tespit et

### Senaryo 4: İlan Ara ve Filtrele

1. `/listings` sayfasına git
2. Kategori ve işlem tipi seç
3. Başlıkta arama yap
4. Sonuçları incele

## ⚠️ Önemli Notlar

### Bağımsız Çalışma

- ✅ Ana admin panelinden **tamamen bağımsız**
- ✅ Aynı Supabase veritabanını kullanır
- ✅ **Sadece görüntüleme** (read-only)
- ❌ Crawler'ı çalıştırmaz

### Port Çakışması

- Admin panel: **Port 5001**
- Crawler API: **Port 8000**
- Ana Next.js: **Port 3000**

### Environment

- `.env` dosyası otomatik okunur (`../.env`)
- Supabase URL ve Key gerekli
- Değişiklik için `app.py` düzenle

### Performance

- Pagination: 12-20 ilan/sayfa
- API response: JSON format
- Real-time: Manuel refresh gerekli

## 🔄 Ana Admin Panel ile Fark

| Özellik         | Admin Remix        | Ana Admin Panel       |
| --------------- | ------------------ | --------------------- |
| **Framework**   | Python Flask       | Next.js               |
| **Port**        | 5001               | 3000                  |
| **Amaç**        | Sadece görüntüleme | Tam yönetim           |
| **Crawler**     | Çalıştırmaz        | Çalıştırır            |
| **Veritabanı**  | Supabase (read)    | Supabase (read/write) |
| **Bağımsızlık** | Tamamen ayrı       | Ana uygulama          |

## 🐛 Sorun Giderme

### 1. "Module not found" Hatası

```bash
# Virtual environment aktif mi?
venv\Scripts\activate

# Dependencies yükle
pip install -r requirements.txt
```

### 2. "Supabase connection failed"

```bash
# .env dosyasını kontrol et
cat ../.env

# SUPABASE_URL ve SUPABASE_ANON_KEY var mı?
```

### 3. "Port already in use"

```python
# app.py içinde portu değiştir
app.run(host='0.0.0.0', port=5002, debug=True)
```

### 4. "Template not found"

```bash
# templates/ klasörü var mı?
ls templates/

# Dosya isimleri doğru mu?
```

## 📈 Gelecek Geliştirmeler

- [ ] Real-time updates (WebSocket)
- [ ] Chart.js grafikleri
- [ ] Export to Excel/CSV
- [ ] Advanced filtering
- [ ] User authentication
- [ ] Dark mode
- [ ] Mobile responsive improvements

## 📞 Destek

Sorun yaşarsanız:

1. README.md dosyasını okuyun
2. Virtual environment ve dependencies kontrol edin
3. .env dosyasını kontrol edin
4. Supabase bağlantısını test edin
5. Console loglarını inceleyin

---

**© 2025 Demir Gayrimenkul - Crawler Admin Panel**
