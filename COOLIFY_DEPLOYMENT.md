# Coolify Deployment Rehberi

Bu rehber, Demir Gayrimenkul projesinin Coolify üzerinde nasıl deploy edileceğini açıklar.

## 🔧 Gerekli Environment Variables

Coolify panelinde aşağıdaki environment variables'ları tanımla:

### Zorunlu Değişkenler

```bash
# Database
DATABASE_URL=postgres://postgres:518518Erkan@wgkosgwkg8o4wg4k8cgcw4og:5432/demir_db
DIRECT_URL=postgres://postgres:518518Erkan@wgkosgwkg8o4wg4k8cgcw4og:5432/demir_db

# Auth (NextAuth v5)
AUTH_SECRET=k8J2mN9pQ4rS7tV0wX3yZ6aB1cD5eF8gH2iJ4kL7mN0pQ3rS6tU9vW2xY5zA8bC1d
AUTH_TRUST_HOST=true

# App Config
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### Opsiyonel Değişkenler

```bash
# AI Services
DEEPSEEK_API_KEY=sk-2750fa1691164dd2940c2ec3cb37d2e6

# Crawler API (Flask admin panel için)
CRAWLER_API_URL=http://flask:5000

# Google Analytics
GA_PROPERTY_ID=519422690
GA_CLIENT_EMAIL=demir-427@demir-net.iam.gserviceaccount.com
GA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## 🚀 Deployment Adımları

### 1. Coolify'da Yeni Proje Oluştur

1. Coolify dashboard'a giriş yap
2. "New Resource" → "Application" seç
3. Git repository'yi bağla (GitHub/GitLab)
4. Branch seç (main/master)

### 2. Build Settings

**Build Pack:** Dockerfile

**Dockerfile Path:** `./Dockerfile`

**Build Arguments:**

```
DATABASE_URL=${DATABASE_URL}
DIRECT_URL=${DIRECT_URL}
AUTH_SECRET=${AUTH_SECRET}
NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
CRAWLER_API_URL=${CRAWLER_API_URL}
```

### 3. Environment Variables

Yukarıdaki "Gerekli Environment Variables" bölümündeki tüm değişkenleri Coolify panelinde tanımla.

**Önemli:**

- `NEXT_PUBLIC_APP_URL` değerini gerçek domain'inle değiştir
- `AUTH_SECRET` değerini güvenli bir şekilde oluştur: `openssl rand -base64 32`

### 4. Port Configuration

**Container Port:** 3000

**Public Port:** 80 veya 443 (SSL ile)

### 5. Health Check

**Health Check Path:** `/api/health` (opsiyonel)

**Health Check Interval:** 30s

### 6. Deploy

"Deploy" butonuna tıkla ve build loglarını takip et.

## 🐛 Yaygın Hatalar ve Çözümleri

### Hata 1: TypeScript Type Error (appointments/route.ts)

**Hata:**

```
Type 'string' is not assignable to type '"viewing" | "valuation" | "consultation" | "selling" | "other"'
```

**Çözüm:** ✅ Düzeltildi! `mapAppointmentType()` fonksiyonu artık doğru type casting yapıyor.

### Hata 2: Environment Variables Undefined

**Hata:**

```
SUPABASE_URL: Invalid input: expected string, received undefined
NEXTAUTH_SECRET: Invalid input: expected string, received undefined
```

**Çözüm:** ✅ Düzeltildi!

- Supabase değişkenleri artık optional (kullanılmıyor)
- `NEXTAUTH_SECRET` yerine `AUTH_SECRET` kullanılıyor
- `env.ts` validation güncellendi

### Hata 3: Database Connection Failed

**Hata:**

```
Error: connect ECONNREFUSED
```

**Çözüm:**

1. Database hostname'in doğru olduğundan emin ol: `wgkosgwkg8o4wg4k8cgcw4og`
2. Port'un açık olduğunu kontrol et: `5432`
3. Credentials'ların doğru olduğunu doğrula
4. Coolify container'ının database'e erişebildiğinden emin ol (network ayarları)

### Hata 4: Build Timeout

**Hata:**

```
Build exceeded maximum time limit
```

**Çözüm:**

1. Coolify'da build timeout'u artır (Settings → Build → Timeout)
2. `.dockerignore` dosyasını kontrol et - gereksiz dosyalar build'e dahil olmasın
3. Multi-stage build optimize edilmiş durumda

## 📊 Build Süresi Optimizasyonu

Dockerfile zaten optimize edilmiş durumda:

1. **Multi-stage build:** Builder ve runner ayrı
2. **Layer caching:** Dependencies önce install ediliyor
3. **Production build:** Sadece gerekli dosyalar kopyalanıyor
4. **Slim image:** `node:22-bookworm-slim` kullanılıyor

Ortalama build süresi: **5-8 dakika**

## 🔍 Deployment Sonrası Kontroller

### 1. Health Check

```bash
curl https://your-domain.com/api/health
```

Beklenen yanıt:

```json
{
  "status": "ok",
  "timestamp": "2026-01-21T..."
}
```

### 2. Database Connection

```bash
curl https://your-domain.com/api/listings?limit=1
```

Eğer veri dönüyorsa database bağlantısı çalışıyor demektir.

### 3. Logs

Coolify panelinde "Logs" sekmesinden runtime loglarını kontrol et:

```bash
# Başarılı başlangıç logları:
✓ Ready in 2.3s
✓ Local: http://localhost:3000
✓ Network: http://0.0.0.0:3000
```

## 🔄 Yeniden Deploy

Kod değişikliği yaptıktan sonra:

1. Git'e push yap
2. Coolify otomatik deploy tetikler (webhook varsa)
3. Veya manuel "Redeploy" butonuna tıkla

## 🛡️ Güvenlik Notları

1. **AUTH_SECRET:** Asla public repository'de paylaşma
2. **Database Credentials:** Environment variables'da sakla
3. **API Keys:** Coolify'ın secret management'ını kullan
4. **HTTPS:** SSL sertifikası aktif et (Let's Encrypt)

## 📞 Destek

Sorun yaşarsan:

1. Coolify build loglarını kontrol et
2. Runtime loglarını incele
3. Database bağlantısını test et
4. Environment variables'ları doğrula

---

**Son Güncelleme:** 21 Ocak 2026
**Durum:** ✅ Production Ready
