# 🚀 Coolify Deployment - demirgayrimenkul.com.tr

## ⚡ Hızlı Başlangıç (5 Dakika)

### 1️⃣ DNS Ayarları (Cloudflare ile)

**⚠️ Önemli:** Domain'de sadece nameserver değiştirilebiliyorsa **Cloudflare DNS** kullan!

#### Cloudflare Kurulumu (Detaylı: NAMESERVER_SETUP.md)

1. **Cloudflare hesabı oluştur:** https://dash.cloudflare.com/sign-up
2. **Domain ekle:** `demirgayrimenkul.com.tr`
3. **DNS kayıtları ekle:**
   ```
   Type: A, Name: @, Content: COOLIFY_SUNUCU_IP, Proxy: ON
   Type: A, Name: www, Content: COOLIFY_SUNUCU_IP, Proxy: ON
   ```
4. **Nameserver'ları kopyala** (örn: `aron.ns.cloudflare.com`)
5. **Domain sağlayıcında nameserver değiştir**
6. **24-48 saat bekle** (DNS propagation)

**⏰ DNS yayılması 1-48 saat sürebilir!**

**Alternatif:** Domain'de A record ekleyebiliyorsan:

```
A Record:
  Host: @
  Value: COOLIFY_SUNUCU_IP_ADRESINIZ
  TTL: 3600

A Record:
  Host: www
  Value: COOLIFY_SUNUCU_IP_ADRESINIZ
  TTL: 3600
```

---

### 2️⃣ Coolify'da Proje Oluştur

1. **Coolify Dashboard** → **New Resource** → **Application**
2. **Git Repository** bağla (GitHub/GitLab)
3. **Branch** seç: `main` veya `master`
4. **Build Pack** seç: `Dockerfile`

---

### 3️⃣ Domain Ayarları (Coolify'da)

**Domains** sekmesinde:

```
Primary Domain: demirgayrimenkul.com.tr
Additional Domains: www.demirgayrimenkul.com.tr
```

**SSL/TLS:**

- ✅ Enable SSL (Let's Encrypt)
- ✅ Force HTTPS

---

### 4️⃣ Environment Variables

**Environment** sekmesinde şu değişkenleri ekle:

#### 🔴 Zorunlu Değişkenler

```bash
# Database (Mevcut database - YENİ OLUŞTURULMAYACAK!)
DATABASE_URL=postgres://postgres:518518Erkan@wgkosgwkg8o4wg4k8cgcw4og:5432/demir_db
DIRECT_URL=postgres://postgres:518518Erkan@wgkosgwkg8o4wg4k8cgcw4og:5432/demir_db

# Auth
AUTH_SECRET=k8J2mN9pQ4rS7tV0wX3yZ6aB1cD5eF8gH2iJ4kL7mN0pQ3rS6tU9vW2xY5zA8bC1d
AUTH_TRUST_HOST=true
NEXTAUTH_URL=http://demirgayrimenkul.com.tr

# App
NEXT_PUBLIC_APP_URL=http://demirgayrimenkul.com.tr
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBNWI2QmdOUdIuQzGSSdE4BeXPULBhcPPA
```

#### 🟡 Opsiyonel Değişkenler

```bash
# AI Services
DEEPSEEK_API_KEY=sk-2750fa1691164dd2940c2ec3cb37d2e6

# Google Analytics
GA_PROPERTY_ID=519422690
GA_CLIENT_EMAIL=demir-427@demir-net.iam.gserviceaccount.com
GA_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC2AuBUSbHjSoXE
Mfp9cP/Qm15RCBVe2Yln9tZA4SOJG9iFxSrYHHB1LALalZUYypgojhUXd2LJB287
df2tsO4oNAN8gEUBGi3wS1r7oZ7dzv1qVDFdqd6u9SpOwxpj1prwgxa7YBFtb8+9
HOUXQHJniS0bcP9o6OESIxf5+99C2vvQnFkFXj3Y6zD3647LZL3fOBVZ4tkMEKId
QN8kJz3KlwpPAR6Sb/SBddRTAU4I4xuehI7lj9LgX5kdCuOK7g3bIUeb2X9u41pu
hLnVsEGnYsGPM/IyTMUNDVBEmW/JSHcfX/BzPgldbn7mt87slejoSMUZmwfeArwa
u2zDewhzAgMBAAECggEACzOzHczpU11XTUNsMMM/I1YkoGUYd5143PquphCVMM+T
bGw9nk5lx3hddpmFMyDo63oPJ0IURN4dxPGWmtWMWtIUstlsJcy4LhVdNKZ2Uh12
sFAdN7AIQglZwL42RhXDtHDE+eRIPk2G4hNAsEUppWCmc41pUsoebBDX3W1YiNM5
oSyEnP6EDQWF7CXMdlj+DVugVUm5iZzUDIOeWGrWfuiuwA+DvWpf83E9TQUXWGgD
5K0qgzKFFfFUi4nj75pxcPN8JpKfi1K4j5cpl/jMnli8KcFioSg81Fx6REuGHb/c
IljBlPm1NOYmBXjPxsp8ld4rMvHOOBoOPwpeguuN/QKBgQD3mALXNKmHW/gG6x0J
feDUeSi4xr9s/x3nT/jgEumKHqPm/sl4/YDXnlktvllItQJtfx1wnYd0msL6WghV
PIadQwT+2aj55AxLcTjL081AbACFDurz8Xe52DCb+DKQpIRT7/wMXDHapxuoE4Nu
pwQ1aQjvb4Gj/6WI2g1ucEyF3wKBgQC8MNjcs4ix0h6s6UAXLP2WS9YRuBrlih3Q
hKGHC9WmnP3aoGSYWmCKGKKuPnD4cZb5anNS7+eZvoZHsP0xxQjGF8gumxt5dHt7
HrLVBiVa95O1mXqh/8kUsFIMoRUAw7lzTQlz9VPTqPDhcsZelVUQnVE4gmY9ccCJ
uOnPJkYH7QKBgQD1800vFqMpUVTLGpdXrHHA3zJyiwvxbGP6OdkSTfcsO0+50XO1
+q0Yg7Y22JW8wgLNXq6SBgpe7LWvF+ybL2rRoZe+yd0vjzgfYTN4VsfXrPG/O5hu
B3pVZMq0xRMF2EeTUhvg81yaxdGVXvz62HI31EUKBIyVqwh3L5SUFn4NpQKBgE/Y
ccqCKfc4bWdzt4udvSItnu/5qv/E8A1umJIRxV5hsZs2/jdd8SPme+9t8sSWfTXp
onCH9T3YBmUYhPS+4pAZuwd7K9cGQvXj+oBDkUndTUB5k/xz6D7s6IMPPTgL0v1G
rEIUzrI5NaqR5fRva54XAUT2nqZnQwer+xe253OpAoGAdvVo6zFlqNG2Kgv6KBUp
FrIF5mJE+R2NpZvf81ncq6tPrceKiAweCX6n+4tDQpHUkF+pOS4FynXt0acWUYEQ
2PnkHOgBguM3LmqEdjemuLutvh8dA53Xjae/pSpKWzbrubckxezCDquB1M7lAeUa
76kbZAMzFnO5r11nPH8qJWw=
-----END PRIVATE KEY-----
```

**Not:** `GA_PRIVATE_KEY` için Coolify'da "Multiline" seçeneğini kullan.

---

### 5️⃣ Build Settings

**General** sekmesinde:

```
Build Pack: Dockerfile
Dockerfile Location: ./Dockerfile
Port: 3000
```

**Advanced:**

```
Build Command: (boş bırak - Dockerfile kullanılacak)
Start Command: (boş bırak - Dockerfile CMD kullanılacak)
```

---

### 6️⃣ Deploy!

**Deploy** butonuna tıkla ve build loglarını izle.

**Beklenen Build Süresi:** 5-8 dakika

---

## ✅ Deployment Kontrol Listesi

- [ ] DNS kayıtları eklendi (@ ve www)
- [ ] Coolify'da proje oluşturuldu
- [ ] Git repository bağlandı
- [ ] Domain ayarlandı (demirgayrimenkul.com.tr)
- [ ] SSL aktifleştirildi (Let's Encrypt)
- [ ] Environment variables eklendi
- [ ] Build settings yapılandırıldı
- [ ] Deploy başlatıldı
- [ ] Build başarılı
- [ ] Site test edildi

---

## 🔍 Deployment Sonrası Test

### 1. Site Erişimi

```bash
# HTTP test
curl -I http://demirgayrimenkul.com.tr

# HTTPS test (SSL sonrası)
curl -I https://demirgayrimenkul.com.tr
```

### 2. Database Bağlantısı

```bash
# API test
curl https://demirgayrimenkul.com.tr/api/listings?limit=1
```

Eğer veri dönüyorsa database bağlantısı çalışıyor ✅

### 3. Logs

Coolify panelinde **Logs** sekmesinden:

```
✓ Ready in 2.3s
✓ Local: http://localhost:3000
✓ Network: http://0.0.0.0:3000
```

---

## 🐛 Sorun Giderme

### DNS Yayılmadı

**Kontrol:**

```bash
nslookup demirgayrimenkul.com.tr
dig demirgayrimenkul.com.tr
```

**Çözüm:** 24-48 saat bekle

---

### Build Hatası

**Kontrol:** Coolify **Build Logs** sekmesi

**Yaygın Hatalar:**

1. **TypeScript Error:** Kod hatası var, düzelt
2. **Dependency Error:** `package.json` kontrol et
3. **Environment Variable Missing:** Tüm zorunlu değişkenler eklenmiş mi?

---

### Database Bağlantı Hatası

**Kontrol:**

```bash
# Coolify container'ından test et
PGPASSWORD='518518Erkan' psql -h wgkosgwkg8o4wg4k8cgcw4og -U postgres -d demir_db -c '\l'
```

**Olası Nedenler:**

1. Database sunucusu çalışmıyor
2. Firewall port 5432'yi engelliyor
3. Network bağlantısı yok
4. Yanlış credentials

---

### SSL Sertifikası Alınamıyor

**Kontrol:**

1. DNS yayıldı mı? (`nslookup demirgayrimenkul.com.tr`)
2. Port 80 ve 443 açık mı?
3. Domain doğru yazıldı mı?

**Çözüm:** Coolify **SSL** sekmesinden "Force SSL" yeniden dene

---

## 🔄 Güncelleme (Redeploy)

Kod değişikliği sonrası:

### Otomatik (Webhook)

1. Git'e push yap
2. Coolify otomatik deploy tetikler

### Manuel

1. Coolify panelinde **Redeploy** butonuna tıkla
2. Build loglarını izle

---

## 📊 Monitoring

### Coolify Dashboard

- **Status:** Running/Stopped
- **CPU/Memory:** Kaynak kullanımı
- **Logs:** Runtime logs
- **Metrics:** Request/Response times

### External Monitoring

```bash
# Uptime monitoring
curl -I https://demirgayrimenkul.com.tr

# Response time
time curl -s https://demirgayrimenkul.com.tr > /dev/null
```

---

## 🎉 Başarılı Deployment!

Site artık yayında:

- **HTTP:** http://demirgayrimenkul.com.tr
- **HTTPS:** https://demirgayrimenkul.com.tr (SSL sonrası)
- **WWW:** https://www.demirgayrimenkul.com.tr

---

## 📞 Destek

Sorun yaşarsan:

1. **Build Logs:** Coolify panelinde kontrol et
2. **Runtime Logs:** Hata mesajlarını incele
3. **Database:** Bağlantı testi yap
4. **Environment:** Tüm değişkenler doğru mu?

---

## 🔐 Güvenlik Notları

1. **AUTH_SECRET:** Asla public repository'de paylaşma
2. **Database Credentials:** Coolify environment variables'da sakla
3. **API Keys:** Secret olarak işaretle
4. **HTTPS:** SSL sertifikası aktif et
5. **Firewall:** Sadece gerekli portları aç (80, 443)

---

## 📚 Ek Kaynaklar

- **Coolify Docs:** https://coolify.io/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Let's Encrypt:** https://letsencrypt.org/

---

**Hazırlayan:** Kiro AI Assistant  
**Domain:** demirgayrimenkul.com.tr  
**Platform:** Coolify  
**Tarih:** 2026-01-22  
**Durum:** ✅ Production Ready
