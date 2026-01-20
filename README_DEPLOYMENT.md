# 🏠 Demir Gayrimenkul - Production Deployment

## 📦 Proje Yapısı

```
demir-gayrimenkul/
├── src/                          # Next.js kaynak kodları
├── crwal4ai/admin_remix/         # Flask admin paneli
├── Dockerfile                    # Next.js Docker image
├── docker-compose.yml            # Tüm servisler
├── nginx.conf                    # Reverse proxy config
├── deploy.sh                     # Deployment script
├── QUICK_START.md               # Hızlı başlangıç
└── DEPLOYMENT_GUIDE.md          # Detaylı rehber
```

---

## 🚀 Hızlı Deployment

### Tek Komut

```bash
./deploy.sh start
```

### İlk Kurulum

```bash
# 1. Migration çalıştır
./deploy.sh migrate

# 2. Servisleri başlat
./deploy.sh start

# 3. Logları kontrol et
./deploy.sh logs
```

---

## 🔗 Database Bağlantısı

**Internal Hostname:** `wgkosgwkg8o4wg4k8cgcw4og`

```
DATABASE_URL=postgres://postgres:518518Erkan@wgkosgwkg8o4wg4k8cgcw4og:5432/demir_db
```

Bu hostname Docker container'lar içinden erişilebilir.

---

## 📊 Servisler

| Servis      | Port | URL                   | Açıklama       |
| ----------- | ---- | --------------------- | -------------- |
| Next.js     | 3000 | http://localhost:3000 | Ana web sitesi |
| Flask Admin | 5001 | http://localhost:5001 | Admin paneli   |
| Nginx       | 80   | http://localhost      | Reverse proxy  |

---

## 🛠️ Komutlar

```bash
./deploy.sh start      # Başlat
./deploy.sh stop       # Durdur
./deploy.sh restart    # Yeniden başlat
./deploy.sh logs       # Logları göster
./deploy.sh status     # Durum kontrolü
./deploy.sh migrate    # Database migration
./deploy.sh build      # Yeniden build
./deploy.sh clean      # Temizle
```

---

## 📁 Önemli Dosyalar

### Environment Variables

- `.env` - Development ortamı
- `.env.production` - Production ortamı
- `crwal4ai/admin_remix/.env` - Flask admin

### Docker

- `Dockerfile` - Next.js image
- `docker-compose.yml` - Tüm servisler
- `crwal4ai/admin_remix/Dockerfile` - Flask image

### Nginx

- `nginx.conf` - Reverse proxy yapılandırması

---

## 🔐 Güvenlik

**Önemli:** Production'da şunları değiştir:

1. **AUTH_SECRET** - Yeni bir secret oluştur
2. **Database şifresi** - Güçlü bir şifre kullan
3. **DEEPSEEK_API_KEY** - API key'i güvenli tut

---

## 📖 Dokümantasyon

- **QUICK_START.md** - Hızlı başlangıç rehberi
- **DEPLOYMENT_GUIDE.md** - Detaylı deployment rehberi
- **MAP_FEATURE.md** - Harita özelliği dokümantasyonu

---

## 🐛 Sorun Giderme

### Container başlamıyor

```bash
./deploy.sh logs
docker ps -a
```

### Database bağlantı hatası

```bash
# PostgreSQL erişimini test et
psql "postgres://postgres:518518Erkan@wgkosgwkg8o4wg4k8cgcw4og:5432/demir_db"
```

### Port çakışması

```bash
# Kullanılan portları kontrol et
sudo netstat -tulpn | grep -E ':(3000|5001|80)'
```

---

## 📞 Destek

Sorun yaşarsan:

1. `./deploy.sh logs` ile logları kontrol et
2. `./deploy.sh status` ile servis durumlarını kontrol et
3. Database bağlantısını test et

---

**Hazırlayan:** Kiro AI Assistant
**Tarih:** 2026-01-21
**Versiyon:** 1.0.0
