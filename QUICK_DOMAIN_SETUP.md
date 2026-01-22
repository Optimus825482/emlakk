# ⚡ Hızlı Domain Kurulum - demirgayrimenkul.com.tr

## 🎯 5 Dakikada Deployment

### 1️⃣ DNS Ayarları (Domain Sağlayıcınızda)

Domain sağlayıcınıza (GoDaddy, Namecheap, vb.) girin ve şu kayıtları ekleyin:

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

**⏰ DNS yayılması 1-48 saat sürebilir!**

---

### 2️⃣ Sunucuya Dosyaları Yükleyin

```bash
# Yerel bilgisayarınızdan
scp -r yy/demir-gayrimenkul root@SUNUCU_IP:/var/www/
```

---

### 3️⃣ Sunucuya Bağlanın

```bash
ssh root@SUNUCU_IP
```

---

### 4️⃣ Deployment Script'i Çalıştırın

```bash
cd /var/www/demir-gayrimenkul

# Script'i çalıştırılabilir yapın
chmod +x deploy-domain.sh

# Tam kurulum (tek komut!)
sudo ./deploy-domain.sh full
```

**Script otomatik olarak şunları yapacak:**

- ✅ DNS kontrolü
- ✅ Node.js, PostgreSQL, Nginx kurulumu
- ✅ Database oluşturma
- ✅ Proje build
- ✅ PM2 ile Next.js başlatma
- ✅ Nginx yapılandırma
- ✅ SSL sertifikası (Let's Encrypt)
- ✅ Firewall ayarları

---

### 5️⃣ Test Edin

```bash
# Site açılıyor mu?
curl -I http://demirgayrimenkul.com.tr

# HTTPS çalışıyor mu? (SSL kurulumundan sonra)
curl -I https://demirgayrimenkul.com.tr
```

---

## 🎉 Tamamlandı!

Site artık yayında:

- **HTTP:** http://demirgayrimenkul.com.tr
- **HTTPS:** https://demirgayrimenkul.com.tr
- **WWW:** https://www.demirgayrimenkul.com.tr

---

## 🔧 Manuel Kurulum (Adım Adım)

Eğer otomatik script kullanmak istemiyorsanız:

```bash
# 1. DNS kontrolü
sudo ./deploy-domain.sh dns

# 2. Bağımlılıkları kur
sudo ./deploy-domain.sh deps

# 3. Database kur
sudo ./deploy-domain.sh db

# 4. Proje build
sudo ./deploy-domain.sh build

# 5. PM2 kur
sudo ./deploy-domain.sh pm2

# 6. Nginx kur
sudo ./deploy-domain.sh nginx

# 7. SSL kur
sudo ./deploy-domain.sh ssl

# 8. Firewall kur
sudo ./deploy-domain.sh firewall

# 9. Durum kontrol
sudo ./deploy-domain.sh status
```

---

## 📊 Durum Kontrolü

```bash
# Sistem durumu
sudo ./deploy-domain.sh status

# URL'leri göster
sudo ./deploy-domain.sh urls

# PM2 logları
pm2 logs demir-next

# Nginx logları
sudo tail -f /var/log/nginx/demirgayrimenkul-error.log
```

---

## 🐛 Sorun mu Var?

### DNS Yayılmadı

```bash
# DNS kontrolü
nslookup demirgayrimenkul.com.tr
```

### Site Açılmıyor

```bash
# Servisleri kontrol et
pm2 status
sudo systemctl status nginx
```

### SSL Hatası

```bash
# SSL sertifikasını kontrol et
sudo certbot certificates

# Manuel SSL kurulumu
sudo certbot --nginx -d demirgayrimenkul.com.tr -d www.demirgayrimenkul.com.tr
```

---

## 📞 Detaylı Dokümantasyon

Daha fazla bilgi için:

- **DOMAIN_DEPLOYMENT.md** - Detaylı deployment rehberi
- **DEPLOYMENT_GUIDE.md** - Genel deployment rehberi

---

**Hazırlayan:** Kiro AI Assistant  
**Domain:** demirgayrimenkul.com.tr  
**Tarih:** 2026-01-22
