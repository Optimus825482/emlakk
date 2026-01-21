# 🚀 Sahibinden Crawler Admin Panel

Modern, production-ready Flask admin paneli. Sahibinden.com crawler'ını yönetmek, ilanları görüntülemek ve istatistikleri takip etmek için geliştirilmiştir.

## ✨ Özellikler

### 🎯 Dashboard

- **Real-time İstatistikler**: Toplam, yeni ve kaldırılan ilan sayıları
- **Kategori Dağılımı**: Konut, arsa, işyeri, bina bazında detaylı analiz
- **Zaman Filtreleme**: Son 24 saat, 2 gün, 3 gün, 1 hafta
- **Görsel Grafikler**: Chart.js ile interaktif kategori grafikleri
- **Son İşlem Durumu**: Mining job'ların anlık takibi

### 🤖 Crawler Kontrol Merkezi

- **Manuel Başlatma**: Kategori seçimi ve parametre ayarları
- **Gelişmiş Modlar**:
  - ⚡ **Force Mode**: Zorla tarama
  - 🔄 **Reverse Sort**: Ters sıralama
  - 🗑️ **Sync Mode**: Eşitle ve sil
  - 🚀 **Parallel Mode**: 2 Chrome worker ile paralel tarama
  - ⚡ **Turbo Mode**: Hızlandırılmış tarama
- **Real-time Progress**: Canlı ilerleme takibi
- **Live Logs**: Debug ve error loglarını anlık görüntüleme
- **Job History**: Son 5 crawler işleminin özeti

### 📋 İlan Yönetimi

- **Gelişmiş Filtreleme**: Kategori, işlem tipi, arama
- **Pagination**: Sayfa başına 20 ilan
- **Detaylı Görünüm**: Başlık, fiyat, konum, tarih, resim
- **Yeni İlanlar**: Son 7 gün içinde eklenen ilanlar
- **Kaldırılan İlanlar**: Son 30 gün içinde kaldırılan ilanlar

### 📊 İstatistikler

- **Kategori Bazlı Analiz**: Her kategori için detaylı sayımlar
- **Sahibinden vs Veritabanı**: Tutarlılık kontrolü
- **Status Badges**: Synced, New, Removed durumları
- **Auto Refresh**: 30 saniyede bir otomatik güncelleme

### 🗺️ Harita (Yeni!)

- **Mahalle Bazlı Görünüm**: Hendek'teki tüm mahalleler
- **İlan Yoğunluğu**: Her mahallede kaç ilan var
- **Fiyat Analizi**: Min, max, ortalama fiyatlar
- **Filtreleme**: Kategori ve işlem tipine göre

### 🛠️ Bakım Araçları

- **Veritabanı Temizliği**: Mükerrer kayıt silme
- **Geçersiz Veri Temizleme**: Fiyatı 0 olan ilanları silme
- **Tek Tıkla Bakım**: Otomatik temizlik işlemi

## 🎨 Tasarım Özellikleri

### Modern UI/UX

- **Glassmorphism**: Cam efektli kartlar
- **Dark Mode**: Otomatik tema değiştirme
- **Responsive**: Mobil, tablet, desktop uyumlu
- **Premium Animations**: Smooth geçişler ve hover efektleri
- **Tailwind CSS**: Utility-first CSS framework
- **Alpine.js**: Minimal JavaScript framework

### Renk Paleti

- **Primary**: Blue (#0E78F1)
- **Accent**: Violet
- **Success**: Emerald
- **Warning**: Amber
- **Error**: Rose
- **Dark**: Slate 900

### Tipografi

- **Headings**: Outfit (Bold, Black)
- **Body**: Inter (Regular, Medium, Semibold)
- **Monospace**: System mono (Loglar için)

## 🚀 Kurulum

### Gereksinimler

```bash
Python 3.9+
PostgreSQL 13+
Node.js 16+ (Tailwind CSS için)
```

### 1. Python Bağımlılıkları

```bash
cd yy/demir-gayrimenkul/crwal4ai/admin_remix
pip install -r requirements.txt
```

### 2. Environment Ayarları

`.env` dosyasını düzenleyin:

```env
DATABASE_URL=postgres://user:password@host:port/database
```

### 3. Tailwind CSS Build

```bash
npm install
npm run build:css
```

### 4. Flask Uygulamasını Başlat

```bash
python app.py
```

Uygulama `http://localhost:5001` adresinde çalışacaktır.

## 📁 Dosya Yapısı

```
admin_remix/
├── app.py                      # Flask uygulaması
├── db_manager.py               # PostgreSQL bağlantı yöneticisi
├── sahibinden_crawler.py       # Crawler script
├── requirements.txt            # Python bağımlılıkları
├── package.json                # Node.js bağımlılıkları
├── tailwind.config.js          # Tailwind CSS config
├── templates/                  # HTML templates
│   ├── base.html              # Ana layout
│   ├── index.html             # Dashboard
│   ├── crawler.html           # Crawler kontrol
│   ├── listings.html          # İlan listesi
│   ├── new_listings.html      # Yeni ilanlar
│   ├── removed_listings.html  # Kaldırılan ilanlar
│   ├── stats.html             # İstatistikler
│   ├── jobs.html              # Job geçmişi
│   └── map.html               # Harita
└── static/
    └── css/
        └── output.css         # Compiled Tailwind CSS
```

## 🔌 API Endpoints

### Dashboard

- `GET /api/dashboard?days=7` - Dashboard verileri

### Crawler

- `GET /api/crawler/status` - Crawler durumu
- `POST /api/crawler/start` - Crawler başlat
- `POST /api/crawler/start-parallel` - Paralel crawler başlat
- `GET /api/crawler/logs?type=debug&lines=100` - Logları getir

### İlanlar

- `GET /api/listings?page=1&per_page=20` - İlan listesi
- `GET /api/new-listings?page=1&days=7` - Yeni ilanlar
- `GET /api/removed-listings?page=1&days=30` - Kaldırılan ilanlar

### İstatistikler

- `GET /api/category-counts` - Kategori sayıları
- `GET /api/category-stats` - Detaylı kategori istatistikleri

### Jobs

- `GET /api/jobs?page=1&per_page=10` - Job geçmişi

### Harita

- `GET /api/map/neighborhoods` - Mahalle istatistikleri
- `GET /api/map/listings?neighborhood=Yeni` - Mahalle ilanları

### Bakım

- `POST /api/maintenance/run` - Veritabanı bakımı

## 🎯 Kullanım Senaryoları

### 1. Yeni Crawler İşlemi Başlatma

1. `/crawler` sayfasına git
2. Hedef kategorileri seç (Konut Satılık, Arsa Satılık, vb.)
3. Derinlik ayarla (5-999 sayfa)
4. İsteğe bağlı modları aktifleştir (Force, Turbo, vb.)
5. "Sistemi Ateşle" butonuna tıkla
6. Real-time progress'i takip et

### 2. Yeni İlanları Kontrol Etme

1. `/new-listings` sayfasına git
2. Zaman filtresini ayarla (Son 7 gün)
3. Yeni ilanları incele
4. İlan detaylarına tıklayarak Sahibinden'e git

### 3. Pazar Analizi Yapma

1. `/` (Dashboard) sayfasına git
2. Zaman filtresini seç (Son 1 hafta)
3. Kategori dağılımını incele
4. Grafikleri analiz et
5. Trend değişimlerini gözlemle

### 4. Veritabanı Bakımı

1. `/crawler` sayfasına git
2. "🛡️ Veri Bakımı" butonuna tıkla
3. Onay ver
4. Mükerrer ve geçersiz kayıtlar silinir

## 🔧 Geliştirme

### Tailwind CSS Watch Mode

```bash
npm run watch:css
```

### Debug Mode

```python
# app.py son satırı
app.run(host="0.0.0.0", port=5001, debug=True)
```

### Log Dosyaları

- `crawler_debug.log` - Genel loglar
- `crawler_error.log` - Hata logları

## 🐛 Sorun Giderme

### Port Zaten Kullanımda

```bash
# Windows
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5001 | xargs kill -9
```

### Database Connection Error

- `.env` dosyasındaki `DATABASE_URL`'i kontrol et
- PostgreSQL servisinin çalıştığından emin ol
- Firewall ayarlarını kontrol et

### Tailwind CSS Değişiklikleri Görünmüyor

```bash
npm run build:css
# Tarayıcı cache'ini temizle (Ctrl+Shift+R)
```

### Crawler Başlamıyor

- `sahibinden_crawler.py` dosyasının varlığını kontrol et
- Python path'ini kontrol et
- Log dosyalarını incele

## 📊 Performans

- **Dashboard Load**: ~200ms
- **Listings Page**: ~300ms (20 ilan)
- **API Response**: ~50-100ms
- **Real-time Updates**: 5 saniye interval
- **Database Queries**: Optimized with indexes

## 🔒 Güvenlik

- ✅ SQL Injection koruması (Parameterized queries)
- ✅ XSS koruması (Template escaping)
- ✅ CSRF koruması (Flask-WTF)
- ✅ Environment variables (.env)
- ⚠️ Production'da `SECRET_KEY` değiştir
- ⚠️ Production'da `debug=False` yap

## 🚀 Production Deployment

### 1. Gunicorn ile Çalıştırma

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5001 app:app
```

### 2. Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name admin.example.com;

    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. Systemd Service

```ini
[Unit]
Description=Crawler Admin Panel
After=network.target

[Service]
User=www-data
WorkingDirectory=/path/to/admin_remix
ExecStart=/usr/bin/gunicorn -w 4 -b 127.0.0.1:5001 app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

## 📝 Changelog

### v2.0.0 (2025-01-19)

- ✨ Modern UI/UX redesign
- ✨ Real-time log viewer
- ✨ Stats sayfası eklendi
- ✨ Maintenance tools
- ✨ Parallel crawler support
- ✨ Turbo mode
- 🐛 Bug fixes ve optimizasyonlar

### v1.0.0 (2024-12-01)

- 🎉 İlk sürüm
- ✨ Dashboard
- ✨ Crawler control
- ✨ Listings management

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje özel kullanım içindir. Ticari kullanım için izin gereklidir.

## 👨‍💻 Geliştirici

**Erkan** - Full-Stack Developer

- 🏢 Demir Gayrimenkul
- 📧 [İletişim Bilgisi]

## 🙏 Teşekkürler

- Flask Framework
- Tailwind CSS
- Alpine.js
- Chart.js
- PostgreSQL

---

**Not**: Bu panel production-ready durumda olup, güvenlik ve performans optimizasyonları yapılmıştır. Herhangi bir sorun için issue açabilirsiniz.
