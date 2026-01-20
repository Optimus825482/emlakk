# 🚀 Sunucu Deployment Rehberi

## Sistem Gereksinimleri

- Ubuntu 22.04 LTS (veya üzeri)
- Node.js 22.x
- PostgreSQL 15+
- Nginx (reverse proxy için)
- 2GB+ RAM
- 20GB+ Disk

---

## 1️⃣ PostgreSQL Kurulumu ve Yapılandırma

### PostgreSQL Kurulumu

```bash
# PostgreSQL repository ekle
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Kurulum
sudo apt update
sudo apt install -y postgresql-15 postgresql-contrib-15

# PostgreSQL başlat
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Database Oluşturma

```bash
# PostgreSQL kullanıcısına geç
sudo -u postgres psql

# Database ve kullanıcı oluştur
CREATE DATABASE demir_db;
CREATE USER postgres WITH PASSWORD '518518Erkan';
GRANT ALL PRIVILEGES ON DATABASE demir_db TO postgres;

# Çıkış
\q
```

### PostgreSQL Dış Erişim Ayarları

```bash
# postgresql.conf düzenle
sudo nano /etc/postgresql/15/main/postgresql.conf

# Bu satırı bul ve değiştir:
listen_addresses = '*'

# pg_hba.conf düzenle
sudo nano /etc/postgresql/15/main/pg_hba.conf

# En alta ekle (tüm IP'lerden erişim için):
host    all             all             0.0.0.0/0               md5

# PostgreSQL'i yeniden başlat
sudo systemctl restart postgresql
```

---

## 2️⃣ Node.js Kurulumu

```bash
# Node.js 22.x kurulumu
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Yarn kurulumu
sudo corepack enable
corepack prepare yarn@stable --activate

# Versiyonları kontrol et
node --version  # v22.x.x
yarn --version  # 4.x.x
```

---

## 3️⃣ Proje Dosyalarını Sunucuya Yükleme

### Git ile (Önerilen)

```bash
# Proje dizini oluştur
mkdir -p /var/www
cd /var/www

# Git clone (eğer repo varsa)
git clone https://github.com/YOUR_USERNAME/demir-gayrimenkul.git
cd demir-gayrimenkul
```

### Manuel Yükleme (FTP/SCP)

```bash
# Yerel bilgisayardan sunucuya yükle
scp -r yy/demir-gayrimenkul root@YOUR_SERVER_IP:/var/www/
```

---

## 4️⃣ Environment Variables Ayarlama

```bash
cd /var/www/demir-gayrimenkul

# .env.production dosyasını düzenle
nano .env.production
```

**Değiştirilmesi Gerekenler:**

```bash
# Sunucu IP'nizi yazın (örn: 192.168.1.100)
DATABASE_URL="postgres://postgres:518518Erkan@localhost:5432/demir_db"
DIRECT_URL="postgres://postgres:518518Erkan@localhost:5432/demir_db"

# Sunucu domain/IP'nizi yazın
NEXT_PUBLIC_APP_URL="http://YOUR_SERVER_IP:3000"
```

---

## 5️⃣ Database Migration

```bash
cd /var/www/demir-gayrimenkul

# Dependencies yükle
yarn install

# Drizzle migration çalıştır
yarn drizzle-kit push
```

---

## 6️⃣ Next.js Build ve Çalıştırma

### Production Build

```bash
cd /var/www/demir-gayrimenkul

# Build
yarn build

# Test (manuel)
yarn start
```

### PM2 ile Otomatik Başlatma (Önerilen)

```bash
# PM2 kurulumu
sudo npm install -g pm2

# Next.js'i PM2 ile başlat
pm2 start yarn --name "demir-next" -- start

# Otomatik başlatma ayarla
pm2 startup
pm2 save

# Durumu kontrol et
pm2 status
pm2 logs demir-next
```

---

## 7️⃣ Nginx Reverse Proxy Kurulumu

### Nginx Kurulumu

```bash
sudo apt install -y nginx
```

### Nginx Yapılandırması

```bash
sudo nano /etc/nginx/sites-available/demir-gayrimenkul
```

**Yapılandırma:**

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    # Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Admin Remix (Flask)
    location /admin {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Nginx Aktifleştirme

```bash
# Symlink oluştur
sudo ln -s /etc/nginx/sites-available/demir-gayrimenkul /etc/nginx/sites-enabled/

# Default site'ı kaldır
sudo rm /etc/nginx/sites-enabled/default

# Nginx test
sudo nginx -t

# Nginx başlat
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 8️⃣ Crawler Admin Panel (Flask) Kurulumu

```bash
cd /var/www/demir-gayrimenkul/crwal4ai/admin_remix

# Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Dependencies
pip install -r requirements.txt

# .env dosyasını düzenle
nano .env
```

**DATABASE_URL'i güncelle:**

```bash
DATABASE_URL=postgres://postgres:518518Erkan@localhost:5432/demir_db
```

### Flask'ı PM2 ile Çalıştırma

```bash
# PM2 ecosystem dosyası oluştur
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'demir-flask',
      script: 'venv/bin/python',
      args: 'app.py',
      cwd: '/var/www/demir-gayrimenkul/crwal4ai/admin_remix',
      interpreter: 'none',
      env: {
        FLASK_ENV: 'production'
      }
    }
  ]
};
EOF

# PM2 ile başlat
pm2 start ecosystem.config.js
pm2 save
```

---

## 9️⃣ Firewall Ayarları

```bash
# UFW kurulumu
sudo apt install -y ufw

# Port açma
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 5432/tcp  # PostgreSQL

# Firewall aktifleştir
sudo ufw enable
sudo ufw status
```

---

## 🔟 SSL Sertifikası (Let's Encrypt)

```bash
# Certbot kurulumu
sudo apt install -y certbot python3-certbot-nginx

# SSL sertifikası al
sudo certbot --nginx -d YOUR_DOMAIN

# Otomatik yenileme testi
sudo certbot renew --dry-run
```

---

## ✅ Deployment Kontrol Listesi

- [ ] PostgreSQL kuruldu ve çalışıyor
- [ ] Database oluşturuldu (`demir_db`)
- [ ] Node.js 22.x kuruldu
- [ ] Proje dosyaları sunucuya yüklendi
- [ ] `.env.production` düzenlendi (DATABASE_URL, APP_URL)
- [ ] `yarn install` çalıştırıldı
- [ ] `yarn drizzle-kit push` ile migration yapıldı
- [ ] `yarn build` başarılı
- [ ] PM2 ile Next.js başlatıldı
- [ ] PM2 ile Flask başlatıldı
- [ ] Nginx kuruldu ve yapılandırıldı
- [ ] Firewall ayarlandı
- [ ] SSL sertifikası alındı (opsiyonel)

---

## 🔧 Yararlı Komutlar

### PM2 Yönetimi

```bash
pm2 list                    # Tüm process'leri listele
pm2 logs demir-next         # Next.js logları
pm2 logs demir-flask        # Flask logları
pm2 restart demir-next      # Next.js'i yeniden başlat
pm2 stop demir-next         # Next.js'i durdur
pm2 delete demir-next       # Process'i sil
```

### PostgreSQL Yönetimi

```bash
sudo systemctl status postgresql   # Durum kontrolü
sudo systemctl restart postgresql  # Yeniden başlat
sudo -u postgres psql -d demir_db  # Database'e bağlan
```

### Nginx Yönetimi

```bash
sudo systemctl status nginx   # Durum kontrolü
sudo systemctl restart nginx  # Yeniden başlat
sudo nginx -t                 # Yapılandırma testi
```

### Log Kontrolleri

```bash
# Next.js logs
pm2 logs demir-next --lines 100

# Flask logs
pm2 logs demir-flask --lines 100

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

---

## 🐛 Sorun Giderme

### Next.js Başlamıyor

```bash
# Port kullanımda mı kontrol et
sudo lsof -i :3000

# Build hatası varsa
cd /var/www/demir-gayrimenkul
rm -rf .next
yarn build
```

### Database Bağlantı Hatası

```bash
# PostgreSQL çalışıyor mu?
sudo systemctl status postgresql

# Connection string doğru mu?
psql "postgres://postgres:518518Erkan@localhost:5432/demir_db"
```

### Nginx 502 Bad Gateway

```bash
# Next.js çalışıyor mu?
pm2 status

# Port dinliyor mu?
sudo netstat -tulpn | grep :3000
```

---

## 📞 Destek

Sorun yaşarsan:

1. PM2 loglarını kontrol et: `pm2 logs`
2. Nginx loglarını kontrol et: `sudo tail -f /var/log/nginx/error.log`
3. PostgreSQL loglarını kontrol et: `sudo tail -f /var/log/postgresql/postgresql-15-main.log`

---

**Başarılar Erkan! 🚀**
