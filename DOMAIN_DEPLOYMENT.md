# 🌐 Domain Deployment Rehberi - demirgayrimenkul.com.tr

## 📋 Ön Hazırlık

### ⚠️ Önemli: Mevcut Database Kullanılacak

**Yeni database oluşturulmayacak!** Mevcut database'e bağlanılacak:

```bash
Host: wgkosgwkg8o4wg4k8cgcw4og
Port: 5432
Database: demir_db
User: postgres
Password: 518518Erkan
```

**Bağlantı String:**

```bash
DATABASE_URL="postgres://postgres:518518Erkan@wgkosgwkg8o4wg4k8cgcw4og:5432/demir_db"
```

Deployment sırasında sadece bağlantı testi yapılacak ve migration çalıştırılacak.

---

### Domain Ayarları

Domain sağlayıcınızda (örn: GoDaddy, Namecheap) aşağıdaki DNS kayıtlarını ekleyin:

```
A Record:
  Host: @
  Value: SUNUCU_IP_ADRESINIZ
  TTL: 3600

A Record:
  Host: www
  Value: SUNUCU_IP_ADRESINIZ
  TTL: 3600
```

**Not:** DNS değişikliklerinin yayılması 1-48 saat sürebilir.

---

## 🚀 Deployment Adımları

### 1. Sunucuya Bağlanın

```bash
ssh root@SUNUCU_IP_ADRESINIZ
```

### 2. Sistem Güncellemesi

```bash
sudo apt update && sudo apt upgrade -y
```

### 3. Gerekli Paketleri Kurun

**Not:** PostgreSQL server kurulmayacak, sadece client kurulacak (mevcut database'e bağlanmak için).

```bash
# Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Yarn
sudo corepack enable
corepack prepare yarn@stable --activate

# PostgreSQL Client (sadece client!)
sudo apt install -y postgresql-client

# Nginx
sudo apt install -y nginx

# PM2
sudo npm install -g pm2

# Certbot (SSL için)
sudo apt install -y certbot python3-certbot-nginx
```

### 4. Database Bağlantı Testi

```bash
# Mevcut database'e bağlantıyı test et
PGPASSWORD='518518Erkan' psql -h wgkosgwkg8o4wg4k8cgcw4og -U postgres -d demir_db -c '\l'
```

**Bağlantı başarılıysa devam edin. Başarısızsa:**

- Database sunucusunun çalıştığından emin olun
- Firewall kurallarını kontrol edin
- Network bağlantısını kontrol edin

### 5. Proje Dosyalarını Yükleyin

```bash
# Proje dizini oluştur
sudo mkdir -p /var/www
cd /var/www

# Dosyaları yükleyin (SCP/FTP ile veya Git clone)
# Örnek: scp -r yy/demir-gayrimenkul root@SUNUCU_IP:/var/www/
```

### 6. Environment Variables

```bash
cd /var/www/demir-gayrimenkul

# .env.production dosyası zaten hazır
# Kontrol edin:
cat .env.production
```

**Önemli:** `.env.production` dosyasında şunlar ayarlanmış:

- `NEXT_PUBLIC_APP_URL="http://demirgayrimenkul.com.tr"`
- `NEXTAUTH_URL="http://demirgayrimenkul.com.tr"`
- Database bağlantı bilgileri

### 7. Dependencies ve Build

```bash
cd /var/www/demir-gayrimenkul

# Dependencies yükle
yarn install

# Database migration
yarn drizzle-kit push

# Production build
yarn build
```

### 8. PM2 ile Next.js Başlatma

```bash
# Next.js'i başlat
pm2 start yarn --name "demir-next" -- start

# Otomatik başlatma
pm2 startup
pm2 save

# Durumu kontrol et
pm2 status
pm2 logs demir-next
```

### 9. Nginx Yapılandırması

```bash
# Nginx config dosyasını kopyala
sudo cp /var/www/demir-gayrimenkul/nginx-production.conf /etc/nginx/sites-available/demirgayrimenkul

# Symlink oluştur
sudo ln -s /etc/nginx/sites-available/demirgayrimenkul /etc/nginx/sites-enabled/

# Default site'ı kaldır
sudo rm /etc/nginx/sites-enabled/default

# Nginx test
sudo nginx -t

# Nginx başlat
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 10. SSL Sertifikası (Let's Encrypt)

```bash
# SSL sertifikası al
sudo certbot --nginx -d demirgayrimenkul.com.tr -d www.demirgayrimenkul.com.tr

# Otomatik yenileme testi
sudo certbot renew --dry-run
```

**Not:** Certbot otomatik olarak nginx config'i güncelleyecek ve HTTPS'i aktif edecektir.

### 11. Firewall Ayarları

```bash
# UFW kurulumu
sudo apt install -y ufw

# Port açma
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Firewall aktifleştir
sudo ufw enable
sudo ufw status
```

---

## ✅ Deployment Kontrol Listesi

- [ ] DNS kayıtları eklendi (A record: @ ve www)
- [ ] Sunucuya SSH bağlantısı yapıldı
- [ ] Node.js 22.x kuruldu
- [ ] PostgreSQL client kuruldu
- [ ] **Mevcut database bağlantısı test edildi** (wgkosgwkg8o4wg4k8cgcw4og:5432/demir_db)
- [ ] Proje dosyaları `/var/www/demir-gayrimenkul` dizinine yüklendi
- [ ] `.env.production` dosyası kontrol edildi
- [ ] `yarn install` çalıştırıldı
- [ ] `yarn drizzle-kit push` ile migration yapıldı
- [ ] `yarn build` başarılı
- [ ] PM2 ile Next.js başlatıldı
- [ ] Nginx kuruldu ve yapılandırıldı
- [ ] SSL sertifikası alındı (Let's Encrypt)
- [ ] Firewall ayarlandı
- [ ] Site test edildi: https://demirgayrimenkul.com.tr

---

## 🔧 Test ve Doğrulama

### 1. DNS Propagation Kontrolü

```bash
# DNS'in yayılıp yayılmadığını kontrol et
nslookup demirgayrimenkul.com.tr
dig demirgayrimenkul.com.tr
```

### 2. Site Erişim Testi

```bash
# HTTP testi
curl -I http://demirgayrimenkul.com.tr

# HTTPS testi (SSL kurulumundan sonra)
curl -I https://demirgayrimenkul.com.tr
```

### 3. Next.js Çalışıyor mu?

```bash
pm2 status
pm2 logs demir-next --lines 50
```

### 4. Nginx Çalışıyor mu?

```bash
sudo systemctl status nginx
sudo nginx -t
```

### 5. SSL Sertifikası Geçerli mi?

```bash
sudo certbot certificates
```

---

## 🐛 Sorun Giderme

### DNS Yayılmadı

**Sorun:** Site açılmıyor, "DNS_PROBE_FINISHED_NXDOMAIN" hatası

**Çözüm:**

1. DNS kayıtlarını kontrol edin (A record doğru mu?)
2. 24-48 saat bekleyin (DNS propagation)
3. `nslookup demirgayrimenkul.com.tr` ile kontrol edin

### Next.js Başlamıyor

**Sorun:** PM2'de "errored" durumunda

**Çözüm:**

```bash
# Logları kontrol et
pm2 logs demir-next --lines 100

# Build hatası varsa
cd /var/www/demir-gayrimenkul
rm -rf .next
yarn build

# Yeniden başlat
pm2 restart demir-next
```

### Nginx 502 Bad Gateway

**Sorun:** Site açılıyor ama 502 hatası veriyor

**Çözüm:**

```bash
# Next.js çalışıyor mu?
pm2 status

# Port 3000 dinliyor mu?
sudo netstat -tulpn | grep :3000

# Next.js'i yeniden başlat
pm2 restart demir-next
```

### SSL Sertifikası Alınamıyor

**Sorun:** Certbot hata veriyor

**Çözüm:**

1. DNS'in yayıldığından emin olun
2. Port 80 ve 443'ün açık olduğundan emin olun
3. Nginx'in çalıştığından emin olun

```bash
# Port kontrolü
sudo netstat -tulpn | grep -E ':(80|443)'

# Nginx durumu
sudo systemctl status nginx

# Certbot debug mode
sudo certbot --nginx -d demirgayrimenkul.com.tr --debug
```

---

## 📊 Monitoring ve Bakım

### PM2 Monitoring

```bash
# Tüm process'leri listele
pm2 list

# Detaylı bilgi
pm2 show demir-next

# Logları izle
pm2 logs demir-next --lines 100

# Memory/CPU kullanımı
pm2 monit
```

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/demirgayrimenkul-access.log

# Error logs
sudo tail -f /var/log/nginx/demirgayrimenkul-error.log
```

### Database Backup

```bash
# Backup oluştur
pg_dump -U postgres demir_db > backup_$(date +%Y%m%d).sql

# Restore
psql -U postgres demir_db < backup_20260122.sql
```

### SSL Sertifikası Yenileme

```bash
# Manuel yenileme
sudo certbot renew

# Otomatik yenileme testi
sudo certbot renew --dry-run
```

---

## 🔄 Güncelleme Prosedürü

Yeni kod değişikliklerini deploy etmek için:

```bash
# 1. Sunucuya bağlan
ssh root@SUNUCU_IP

# 2. Proje dizinine git
cd /var/www/demir-gayrimenkul

# 3. Yeni dosyaları yükle (Git pull veya SCP)
git pull origin main
# veya
# scp -r yy/demir-gayrimenkul/* root@SUNUCU_IP:/var/www/demir-gayrimenkul/

# 4. Dependencies güncelle (gerekirse)
yarn install

# 5. Build
yarn build

# 6. PM2'yi yeniden başlat
pm2 restart demir-next

# 7. Logları kontrol et
pm2 logs demir-next --lines 50
```

---

## 📞 Destek

### Yararlı Komutlar

```bash
# Sistem durumu
pm2 status
sudo systemctl status nginx

# Database bağlantı testi
PGPASSWORD='518518Erkan' psql -h wgkosgwkg8o4wg4k8cgcw4og -U postgres -d demir_db -c 'SELECT version();'

# Loglar
pm2 logs demir-next
sudo tail -f /var/log/nginx/demirgayrimenkul-error.log

# Yeniden başlatma
pm2 restart demir-next
sudo systemctl restart nginx
```

### Acil Durum

Eğer site çöktüyse:

1. **PM2 kontrol:** `pm2 status` - Next.js çalışıyor mu?
2. **Nginx kontrol:** `sudo systemctl status nginx` - Nginx çalışıyor mu?
3. **Database kontrol:** `sudo systemctl status postgresql` - PostgreSQL çalışıyor mu?
4. **Logları incele:** `pm2 logs demir-next --lines 100`

---

## 🎉 Başarılı Deployment!

Site artık şu adreslerde yayında:

- **HTTP:** http://demirgayrimenkul.com.tr
- **HTTPS:** https://demirgayrimenkul.com.tr (SSL kurulumundan sonra)
- **WWW:** https://www.demirgayrimenkul.com.tr

**Tebrikler Erkan! 🚀**

---

**Hazırlayan:** Kiro AI Assistant  
**Tarih:** 2026-01-22  
**Domain:** demirgayrimenkul.com.tr  
**Versiyon:** 1.0.0
