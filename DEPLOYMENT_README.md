# 🚀 Demir Gayrimenkul - Deployment Rehberi

## 📋 Deployment Yöntemi: Coolify + Cloudflare

Bu proje **Coolify** ile deploy edilir ve **Cloudflare DNS** kullanır.

---

## 📚 Dokümantasyon

### 1. **COOLIFY_CLOUDFLARE_SETUP.md** ⭐ (ANA REHBER)

Coolify + Cloudflare ile deployment için **adım adım** rehber.

**İçerik:**

- Cloudflare DNS kurulumu
- Nameserver değiştirme
- Coolify proje oluşturma
- Domain ve SSL ayarları
- Environment variables
- Test ve sorun giderme

### 2. **NAMESERVER_SETUP.md** (DETAYLI)

Nameserver değiştirme ve DNS yönetimi için detaylı rehber.

**İçerik:**

- Cloudflare vs Kendi DNS server
- DNS propagation kontrolü
- Sorun giderme

### 3. **COOLIFY_DEPLOYMENT.md** (GENEL)

Coolify deployment için genel bilgiler ve environment variables.

---

## ⚡ Hızlı Başlangıç

### 1. Cloudflare Kurulumu

```bash
1. https://dash.cloudflare.com/sign-up → Kayıt ol
2. "Add a Site" → demirgayrimenkul.com.tr
3. DNS kayıtları ekle (A record @ ve www → COOLIFY_SUNUCU_IP)
4. Nameserver'ları kopyala
5. Domain sağlayıcında nameserver değiştir
6. SSL ayarla (Full strict + Always HTTPS)
```

### 2. Coolify Kurulumu

```bash
1. Coolify → New Resource → Application
2. Git repo bağla
3. Domain: demirgayrimenkul.com.tr
4. SSL: KAPALI (Cloudflare SSL sağlar)
5. Environment variables ekle
6. Deploy!
```

---

## 🔧 Environment Variables (Coolify'da)

```bash
# Database (Mevcut - YENİ OLUŞTURULMAYACAK!)
DATABASE_URL=postgres://postgres:518518Erkan@wgkosgwkg8o4wg4k8cgcw4og:5432/demir_db
DIRECT_URL=postgres://postgres:518518Erkan@wgkosgwkg8o4wg4k8cgcw4og:5432/demir_db

# Auth
AUTH_SECRET=k8J2mN9pQ4rS7tV0wX3yZ6aB1cD5eF8gH2iJ4kL7mN0pQ3rS6tU9vW2xY5zA8bC1d
AUTH_TRUST_HOST=true
NEXTAUTH_URL=https://demirgayrimenkul.com.tr

# App (HTTPS - Cloudflare SSL var)
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
GA_PRIVATE_KEY=<multiline - Coolify'da ekle>
```

---

## ✅ Deployment Checklist

- [ ] Cloudflare hesabı oluşturuldu
- [ ] Domain Cloudflare'e eklendi
- [ ] DNS kayıtları eklendi (Proxy ON)
- [ ] Nameserver değiştirildi
- [ ] DNS propagation beklendi (24-48 saat)
- [ ] Cloudflare SSL ayarlandı (Full strict)
- [ ] Coolify'da proje oluşturuldu
- [ ] Git repo bağlandı
- [ ] Domain ayarlandı (SSL KAPALI)
- [ ] Environment variables eklendi
- [ ] Deploy başlatıldı
- [ ] Site test edildi

---

## 🔍 Test

```bash
# DNS kontrolü
nslookup demirgayrimenkul.com.tr

# Site erişimi
curl -I https://demirgayrimenkul.com.tr

# SSL kontrolü
https://www.ssllabs.com/ssltest/
```

---

## 🎯 Önemli Notlar

1. **Database:** Mevcut database kullanılır, yeni oluşturulmaz
2. **SSL:** Cloudflare SSL sağlar, Coolify'da SSL KAPALI
3. **HTTPS:** Environment variables'da HTTPS kullan
4. **Nameserver:** DNS propagation 24-48 saat sürebilir
5. **Cloudflare Proxy:** A record'larda turuncu bulut AÇIK olmalı

---

## 📞 Destek

Sorun yaşarsan:

1. **COOLIFY_CLOUDFLARE_SETUP.md** → Detaylı rehber
2. **NAMESERVER_SETUP.md** → DNS sorunları
3. Coolify build logs → Hata mesajları
4. Cloudflare analytics → Traffic kontrolü

---

## 🎉 Site URL'leri

- **HTTP:** http://demirgayrimenkul.com.tr (→ HTTPS)
- **HTTPS:** https://demirgayrimenkul.com.tr ✅
- **WWW:** https://www.demirgayrimenkul.com.tr ✅

---

**Platform:** Coolify + Cloudflare  
**Domain:** demirgayrimenkul.com.tr  
**Tarih:** 2026-01-22  
**Durum:** ✅ Production Ready
