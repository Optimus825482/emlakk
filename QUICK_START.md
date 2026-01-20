# 🚀 Hızlı Başlangıç - Docker ile Deployment

## Ön Gereksinimler

✅ PostgreSQL sunucun hazır (Internal hostname: `wgkosgwkg8o4wg4k8cgcw4og`)
✅ Docker ve Docker Compose kurulu
✅ Database: `demir_db` oluşturulmuş
✅ Kullanıcı: `postgres` / Şifre: `518518Erkan`

---

## 1️⃣ Tek Komutla Başlat

```bash
# Deployment script'i çalıştırılabilir yap
chmod +x deploy.sh

# Tüm servisleri başlat
./deploy.sh start
```

**Bu komut:**

- Next.js uygulamasını build eder ve başlatır
- Flask admin panelini başlatır
- Nginx reverse proxy'yi yapılandırır

---

## 2️⃣ Erişim URL'leri

```
🌐 Ana Site (Next.js):     http://YOUR_SERVER_IP
📊 Admin Panel (Flask):    http://YOUR_SERVER_IP/admin
🗺️ Harita:                 http://YOUR_SERVER_IP/admin/map
```

---

## 3️⃣ Database Migration

İlk kurulumda migration çalıştır:

```bash
./deploy.sh migrate
```

---

## 4️⃣ Logları İzle

```bash
# Tüm servislerin logları
./deploy.sh logs

# Sadece Next.js logları
./deploy.sh logs nextjs

# Sadece Flask logları
./deploy.sh logs flask-admin
```

---

## 5️⃣ Servis Yönetimi

```bash
# Durumu kontrol et
./deploy.sh status

# Yeniden başlat
./deploy.sh restart

# Durdur
./deploy.sh stop

# Temizle (dikkatli!)
./deploy.sh clean
```

---

## 📋 Environment Variables

Tüm environment variable'lar zaten ayarlandı:

**Database:**

```
DATABASE_URL=postgres://postgres:518518Erkan@wgkosgwkg8o4wg4k8cgcw4og:5432/demir_db
```

**Auth:**

```
AUTH_SECRET=k8J2mN9pQ4rS7tV0wX3yZ6aB1cD5eF8gH2iJ4kL7mN0pQ3rS6tU9vW2xY5zA8bC1d
```

**AI:**

```
DEEPSEEK_API_KEY=sk-2750fa1691164dd2940c2ec3cb37d2e6
```

---

## 🔧 Sorun Giderme

### Container başlamıyor

```bash
# Logları kontrol et
./deploy.sh logs

# Yeniden build et
./deploy.sh build
./deploy.sh start
```

### Database bağlantı hatası

```bash
# PostgreSQL çalışıyor mu kontrol et
psql "postgres://postgres:518518Erkan@wgkosgwkg8o4wg4k8cgcw4og:5432/demir_db"
```

### Port zaten kullanımda

```bash
# Portları kontrol et
sudo netstat -tulpn | grep -E ':(3000|5001|80)'

# Çakışan servisi durdur veya port değiştir
```

---

## 📦 Manuel Deployment (Docker olmadan)

Eğer Docker kullanmak istemiyorsan:

### Next.js

```bash
cd /var/www/demir-gayrimenkul
yarn install
yarn build
yarn start
```

### Flask Admin

```bash
cd /var/www/demir-gayrimenkul/crwal4ai/admin_remix
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

---

## ✅ Deployment Checklist

- [ ] PostgreSQL çalışıyor (`wgkosgwkg8o4wg4k8cgcw4og:5432`)
- [ ] Database `demir_db` oluşturuldu
- [ ] Docker ve Docker Compose kurulu
- [ ] `./deploy.sh start` çalıştırıldı
- [ ] `./deploy.sh migrate` çalıştırıldı
- [ ] `http://YOUR_SERVER_IP` erişilebilir
- [ ] `http://YOUR_SERVER_IP/admin` erişilebilir

---

**Başarılar Erkan! 🎉**

Herhangi bir sorun olursa `./deploy.sh logs` ile logları kontrol et.
