# 🚀 Coolify + Cloudflare Deployment - demirgayrimenkul.com.tr

## ⚡ Hızlı Başlangıç (Nameserver ile)

Bu rehber, domain'de **sadece nameserver değiştirebildiğin** durumlar için hazırlanmıştır.

---

## 1️⃣ Cloudflare DNS Kurulumu

### Adım 1: Cloudflare Hesabı

1. https://dash.cloudflare.com/sign-up → Kayıt ol
2. Email'i doğrula

### Adım 2: Domain Ekle

1. **"Add a Site"** tıkla
2. Domain gir: `demirgayrimenkul.com.tr`
3. **Free Plan** seç
4. **Continue**

### Adım 3: DNS Kayıtları

Cloudflare'de şu kayıtları ekle:

```
Type: A
Name: @
Content: COOLIFY_SUNUCU_IP_ADRESINIZ
Proxy: ✅ Proxied (Turuncu bulut AÇIK)
TTL: Auto

Type: A
Name: www
Content: COOLIFY_SUNUCU_IP_ADRESINIZ
Proxy: ✅ Proxied (Turuncu bulut AÇIK)
TTL: Auto
```

**Önemli:** "Proxied" (turuncu bulut) aktif olmalı!

### Adım 4: Nameserver'ları Kopyala

Cloudflare size 2 nameserver verecek:

```
Örnek:
aron.ns.cloudflare.com
uma.ns.cloudflare.com
```

Bu nameserver'ları kopyala.

### Adım 5: Domain Sağlayıcında Nameserver Değiştir

Domain sağlayıcının (GoDaddy, Namecheap, vb.) panelinde:

1. **DNS/Nameserver Settings** bölümüne git
2. **Custom Nameservers** seç
3. Cloudflare nameserver'larını gir
4. **Kaydet**

### Adım 6: Cloudflare'de SSL Ayarları

Cloudflare dashboard'da:

1. **SSL/TLS** sekmesi
2. **Encryption mode** → **Full (strict)** seç
3. **Edge Certificates** → **Always Use HTTPS** → **ON**

**⏰ DNS propagation 24-48 saat sürebilir!**

---

## 2️⃣ Coolify'da Proje Kurulumu

### Adım 1: Proje Oluştur

1. **Coolify Dashboard** → **New Resource** → **Application**
2. **Git Repository** bağla
3. **Branch** seç: `main`
4. **Build Pack**: `Dockerfile`

### Adım 2: Domain Ayarları

**Domains** sekmesinde:

```
Primary Domain: demirgayrimenkul.com.tr
Additional Domains: www.demirgayrimenkul.com.tr
```

**SSL/TLS Ayarları:**

- ❌ **Enable SSL** → KAPALI (Cloudflare SSL sağlar)
- ❌ **Force HTTPS** → KAPALI (Cloudflare yönetir)

**Önemli:** Cloudflare kullanıyorsan Coolify'da SSL'i kapalı tut!

### Adım 3: Environment Variables

**Environment** sekmesinde:

```bash
# Database (Mevcut - YENİ OLUŞTURULMAYACAK!)
DATABASE_URL=postgres://postgres:518518Erkan@wgkosgwkg8o4wg4k8cgcw4og:5432/demir_db
DIRECT_URL=postgres://postgres:518518Erkan@wgkosgwkg8o4wg4k8cgcw4og:5432/demir_db

# Auth
AUTH_SECRET=k8J2mN9pQ4rS7tV0wX3yZ6aB1cD5eF8gH2iJ4kL7mN0pQ3rS6tU9vW2xY5zA8bC1d
AUTH_TRUST_HOST=true
NEXTAUTH_URL=https://demirgayrimenkul.com.tr

# App (HTTPS kullan - Cloudflare SSL var)
NEXT_PUBLIC_APP_URL=https://demirgayrimenkul.com.tr
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBNWI2QmdOUdIuQzGSSdE4BeXPULBhcPPA

# AI (Opsiyonel)
DEEPSEEK_API_KEY=sk-2750fa1691164dd2940c2ec3cb37d2e6

# Google Analytics (Opsiyonel)
GA_PROPERTY_ID=519422690
GA_CLIENT_EMAIL=demir-427@demir-net.iam.gserviceaccount.com
GA_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC2AuBUSbHjSoXE
...
-----END PRIVATE KEY-----
```

**Not:** `NEXTAUTH_URL` ve `NEXT_PUBLIC_APP_URL` için **HTTPS** kullan (Cloudflare SSL var).

### Adım 4: Build Settings

**General** sekmesinde:

```
Build Pack: Dockerfile
Dockerfile Location: ./Dockerfile
Port: 3000
```

### Adım 5: Deploy

**Deploy** butonuna tıkla!

**Beklenen Build Süresi:** 5-8 dakika

---

## 3️⃣ Cloudflare Ek Ayarlar (Opsiyonel)

### Performans Optimizasyonu

**Speed** sekmesinde:

- ✅ **Auto Minify** → CSS, JavaScript, HTML
- ✅ **Brotli** → ON
- ✅ **Rocket Loader** → ON

### Güvenlik

**Security** sekmesinde:

- ✅ **Security Level** → Medium
- ✅ **Bot Fight Mode** → ON
- ✅ **Challenge Passage** → 30 minutes

### Caching

**Caching** sekmesinde:

- **Browser Cache TTL** → 4 hours
- **Always Online** → ON

---

## ✅ Deployment Kontrol Listesi

- [ ] Cloudflare hesabı oluşturuldu
- [ ] Domain Cloudflare'e eklendi
- [ ] DNS kayıtları eklendi (A record @ ve www, Proxied ON)
- [ ] Cloudflare nameserver'ları kopyalandı
- [ ] Domain sağlayıcında nameserver değiştirildi
- [ ] Cloudflare SSL ayarlandı (Full strict)
- [ ] DNS propagation beklendi (24-48 saat)
- [ ] Coolify'da proje oluşturuldu
- [ ] Git repository bağlandı
- [ ] Domain ayarlandı (SSL KAPALI)
- [ ] Environment variables eklendi (HTTPS URL'ler)
- [ ] Build settings yapılandırıldı
- [ ] Deploy başlatıldı
- [ ] Build başarılı
- [ ] Site test edildi

---

## 🔍 Test ve Doğrulama

### 1. DNS Propagation Kontrolü

```bash
# Nameserver kontrolü
nslookup -type=ns demirgayrimenkul.com.tr

# A record kontrolü
nslookup demirgayrimenkul.com.tr

# Online araç
https://www.whatsmydns.net/
```

### 2. Site Erişimi

```bash
# HTTP test (Cloudflare otomatik HTTPS'e yönlendirir)
curl -I http://demirgayrimenkul.com.tr

# HTTPS test
curl -I https://demirgayrimenkul.com.tr
```

### 3. SSL Kontrolü

```bash
# SSL sertifikası kontrolü
openssl s_client -connect demirgayrimenkul.com.tr:443 -servername demirgayrimenkul.com.tr

# Online araç
https://www.ssllabs.com/ssltest/
```

### 4. Cloudflare Çalışıyor mu?

Response header'larında şunları ara:

```
cf-ray: xxxxx
cf-cache-status: HIT/MISS
server: cloudflare
```

---

## 🐛 Sorun Giderme

### DNS Yayılmadı

**Kontrol:**

```bash
nslookup -type=ns demirgayrimenkul.com.tr
```

**Çözüm:**

- 24-48 saat bekle
- Domain sağlayıcıda nameserver'ları kontrol et
- Cloudflare'de "Recheck Now" tıkla

### Cloudflare'de "Pending Nameserver Update"

**Çözüm:**

- Nameserver'ların doğru girildiğini kontrol et
- DNS cache temizle: `ipconfig /flushdns` (Windows)
- Bekle (propagation süreci)

### Site Açılmıyor (DNS Yayıldı)

**Kontrol:**

```bash
# DNS çözümleniyor mu?
nslookup demirgayrimenkul.com.tr

# Sunucu erişilebilir mi?
ping COOLIFY_SUNUCU_IP
```

**Çözüm:**

1. Cloudflare'de A record'ları kontrol et
2. Cloudflare Proxy (turuncu bulut) aktif mi?
3. Coolify'da deployment başarılı mı?
4. Coolify logs kontrol et

### SSL Hatası (Mixed Content)

**Sorun:** Bazı kaynaklar HTTP ile yükleniyor

**Çözüm:**

1. Cloudflare'de "Always Use HTTPS" aktif mi?
2. Environment variables'da HTTPS kullanılıyor mu?
3. Cloudflare SSL mode "Full (strict)" mi?

### Cloudflare 522 Error

**Sorun:** Cloudflare sunucuya bağlanamıyor

**Çözüm:**

1. Coolify container çalışıyor mu? (`pm2 status` veya Coolify dashboard)
2. Port 3000 açık mı?
3. Firewall kuralları doğru mu?
4. Cloudflare'de doğru IP girilmiş mi?

---

## 📊 Cloudflare Analytics

Cloudflare dashboard'da **Analytics** sekmesinden:

- **Traffic:** Ziyaretçi sayısı, bandwidth
- **Security:** Engellenen tehditler
- **Performance:** Cache hit rate, response time
- **DNS:** DNS query sayısı

---

## 🔄 Güncelleme (Redeploy)

Kod değişikliği sonrası:

1. Git'e push yap
2. Coolify otomatik deploy tetikler (webhook varsa)
3. Veya Coolify'da **Redeploy** tıkla

**Not:** Cloudflare cache'i temizlemek istersen:

- Cloudflare dashboard → **Caching** → **Purge Everything**

---

## 🎉 Başarılı Deployment!

Site artık yayında:

- **HTTP:** http://demirgayrimenkul.com.tr (otomatik HTTPS'e yönlendirilir)
- **HTTPS:** https://demirgayrimenkul.com.tr ✅
- **WWW:** https://www.demirgayrimenkul.com.tr ✅

**Cloudflare Özellikleri:**

- ✅ SSL/TLS (Otomatik)
- ✅ CDN (Global)
- ✅ DDoS Koruması
- ✅ Web Application Firewall
- ✅ Analytics
- ✅ Always Online

---

## 📞 Destek

### Cloudflare

- **Docs:** https://developers.cloudflare.com/
- **Community:** https://community.cloudflare.com/
- **Status:** https://www.cloudflarestatus.com/

### DNS Araçları

- **DNS Checker:** https://www.whatsmydns.net/
- **SSL Test:** https://www.ssllabs.com/ssltest/
- **Nameserver Lookup:** https://mxtoolbox.com/SuperTool.aspx

---

**Hazırlayan:** Kiro AI Assistant  
**Domain:** demirgayrimenkul.com.tr  
**Platform:** Coolify + Cloudflare  
**Tarih:** 2026-01-22  
**Durum:** ✅ Production Ready
