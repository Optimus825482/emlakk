# 🏠 Sahibinden Crawler Admin Panel

Python Flask ile geliştirilmiş, crawler verilerini görüntülemek için ayrı admin arayüzü.

## 🎯 Özellikler

- ✅ **Dashboard**: Genel özet ve istatistikler
- 🤖 **Crawler Yönetimi**: Veri çekme işlemlerini başlat ve yönet
- 📋 **İlan Listesi**: Filtreleme, arama, pagination
- 🆕 **Yeni İlanlar**: Son eklenen ilanlar
- 📤 **Kaldırılan İlanlar**: Artık aktif olmayan ilanlar
- 🔧 **Job Geçmişi**: Crawler çalışma logları
- 📈 **İstatistikler**: Kategori karşılaştırma ve analiz

## 🚀 Kurulum

### 1. Virtual Environment Oluştur

```bash
cd admin_remix
python -m venv venv
```

### 2. Virtual Environment Aktif Et

**Windows:**

```bash
venv\Scripts\activate
```

**Linux/Mac:**

```bash
source venv/bin/activate
```

### 3. Dependencies Yükle

```bash
pip install -r requirements.txt
```

### 4. Environment Ayarları

`.env` dosyası otomatik olarak üst klasörden (`../env`) okunur.

Eğer farklı bir yerde ise `app.py` içinde `load_dotenv()` satırını düzenleyin:

```python
load_dotenv("path/to/.env")
```

## 🎮 Kullanım

### Admin Panel Başlat

```bash
python app.py
```

Panel şu adreste açılır: **http://localhost:5001**

### Sayfalar

- **Dashboard**: http://localhost:5001/
- **Crawler**: http://localhost:5001/crawler 🆕
- **İlanlar**: http://localhost:5001/listings
- **Yeni İlanlar**: http://localhost:5001/new-listings
- **Kaldırılan**: http://localhost:5001/removed-listings
- **İstatistikler**: http://localhost:5001/stats
- **Jobs**: http://localhost:5001/jobs

## 📊 API Endpoints

Admin panel aşağıdaki API endpoint'lerini kullanır:

- `GET /api/dashboard` - Dashboard özet verileri
- `GET /api/listings` - İlan listesi (pagination, filtreleme)
- `GET /api/new-listings` - Yeni ilanlar
- `GET /api/removed-listings` - Kaldırılan ilanlar
- `GET /api/category-stats` - Kategori istatistikleri
- `GET /api/jobs` - Crawler job geçmişi

## 🗄️ Veritabanı Tabloları

Admin panel şu Supabase tablolarını kullanır:

1. **sahibinden_liste**: Ana ilan tablosu
2. **new_listings**: Yeni ilanlar
3. **removed_listings**: Kaldırılan ilanlar
4. **category_stats**: Kategori istatistikleri
5. **mining_jobs**: Crawler job kayıtları
6. **mining_logs**: Crawler logları

## 🎨 Teknolojiler

- **Backend**: Python Flask
- **Frontend**: Tailwind CSS + Alpine.js
- **Database**: Supabase (PostgreSQL)
- **Charts**: Chart.js (gelecekte eklenecek)

## 🔧 Geliştirme

### Debug Mode

`app.py` içinde debug mode zaten aktif:

```python
app.run(host='0.0.0.0', port=5001, debug=True)
```

### Port Değiştirme

Farklı bir port kullanmak için:

```python
app.run(host='0.0.0.0', port=5002, debug=True)
```

## 📝 Notlar

- ⚠️ Bu panel **sadece görüntüleme** içindir. Crawler'ı çalıştırmaz.
- ⚠️ Ana admin panelinden **bağımsız** çalışır.
- ✅ Aynı Supabase veritabanını kullanır.
- ✅ Real-time güncelleme için sayfayı yenileyin.

## 🔗 İlgili Dosyalar

- **Crawler**: `../sahibinden_uc_batch_supabase.py`
- **API**: `../crawler_api.py`
- **Environment**: `../.env`

## 📞 Destek

Sorun yaşarsanız:

1. Virtual environment aktif mi kontrol edin
2. Dependencies yüklü mü kontrol edin
3. `.env` dosyası doğru mu kontrol edin
4. Supabase bağlantısı çalışıyor mu test edin

---

**© 2025 Demir Gayrimenkul - Crawler Admin Panel**
