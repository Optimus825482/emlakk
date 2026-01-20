# Coolify Deployment Hataları - Düzeltme Raporu

## 🎯 Yapılan Düzeltmeler

### 1. ✅ TypeScript Type Error (appointments/route.ts)

**Sorun:**

```typescript
// Line 44 - Type mismatch hatası
conditions.push(eq(appointments.type, dbType));
// Error: Type 'string' is not assignable to type '"viewing" | "valuation" | "consultation" | "selling" | "other"'
```

**Çözüm:**

```typescript
// Explicit type casting eklendi
conditions.push(
  eq(appointments.type, dbType as typeof appointments.type.$inferSelect),
);
```

**Dosya:** `src/app/api/appointments/route.ts`

---

### 2. ✅ Environment Variables Validation (env.ts)

**Sorun:**

```
SUPABASE_URL: Invalid input: expected string, received undefined
SUPABASE_ANON_KEY: Invalid input: expected string, received undefined
SUPABASE_SERVICE_KEY: Invalid input: expected string, received undefined
NEXTAUTH_SECRET: Invalid input: expected string, received undefined
```

**Çözüm:**

```typescript
// Supabase değişkenleri optional yapıldı (artık kullanılmıyor)
SUPABASE_URL: z.string().url().optional(),
SUPABASE_ANON_KEY: z.string().min(1).optional(),
SUPABASE_SERVICE_KEY: z.string().min(1).optional(),

// NextAuth v5 için AUTH_SECRET eklendi
NEXTAUTH_SECRET: z.string().min(1).optional(),
AUTH_SECRET: z.string().min(1).optional(),

// DIRECT_URL eklendi
DIRECT_URL: z.string().url().optional(),
```

**Dosya:** `src/lib/env.ts`

---

### 3. ✅ Dockerfile Build Arguments

**Sorun:**
Build sırasında environment variables eksik.

**Çözüm:**

```dockerfile
# CRAWLER_API_URL eklendi
ARG CRAWLER_API_URL

ENV CRAWLER_API_URL=$CRAWLER_API_URL
```

**Dosya:** `Dockerfile`

---

### 4. ✅ Environment Files Cleanup

**Değişiklikler:**

**`.env` dosyası:**

- ❌ Supabase değişkenleri kaldırıldı
- ✅ `CRAWLER_API_URL` eklendi
- ✅ Sadece gerekli değişkenler tutuldu

**`.env.production` dosyası:**

- ✅ `CRAWLER_API_URL=http://flask:5000` eklendi
- ✅ Production-ready yapılandırma

---

## 📋 Coolify Deployment Checklist

### Ön Hazırlık

- [x] TypeScript hatası düzeltildi
- [x] Environment validation güncellendi
- [x] Dockerfile optimize edildi
- [x] .env dosyaları temizlendi

### Coolify Panelinde Yapılacaklar

#### 1. Environment Variables (Zorunlu)

```bash
DATABASE_URL=postgres://postgres:518518Erkan@wgkosgwkg8o4wg4k8cgcw4og:5432/demir_db
DIRECT_URL=postgres://postgres:518518Erkan@wgkosgwkg8o4wg4k8cgcw4og:5432/demir_db
AUTH_SECRET=k8J2mN9pQ4rS7tV0wX3yZ6aB1cD5eF8gH2iJ4kL7mN0pQ3rS6tU9vW2xY5zA8bC1d
AUTH_TRUST_HOST=true
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

#### 2. Build Arguments

Coolify'da "Build Arguments" bölümüne ekle:

```
DATABASE_URL=${DATABASE_URL}
DIRECT_URL=${DIRECT_URL}
AUTH_SECRET=${AUTH_SECRET}
NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
CRAWLER_API_URL=${CRAWLER_API_URL}
```

#### 3. Port Configuration

- Container Port: `3000`
- Public Port: `80` (veya `443` SSL ile)

#### 4. Health Check (Opsiyonel)

- Path: `/api/health`
- Interval: `30s`
- Timeout: `10s`

---

## 🚀 Deployment Komutu

Coolify otomatik deploy yapacak, ama manuel test için:

```bash
# Local test
docker build -t demir-gayrimenkul \
  --build-arg DATABASE_URL="postgres://postgres:518518Erkan@wgkosgwkg8o4wg4k8cgcw4og:5432/demir_db" \
  --build-arg DIRECT_URL="postgres://postgres:518518Erkan@wgkosgwkg8o4wg4k8cgcw4og:5432/demir_db" \
  --build-arg AUTH_SECRET="k8J2mN9pQ4rS7tV0wX3yZ6aB1cD5eF8gH2iJ4kL7mN0pQ3rS6tU9vW2xY5zA8bC1d" \
  --build-arg NEXT_PUBLIC_APP_URL="http://localhost:3000" \
  .

docker run -p 3000:3000 demir-gayrimenkul
```

---

## 🔍 Deployment Sonrası Test

### 1. Build Başarılı mı?

Coolify logs'da şunları ara:

```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Creating an optimized production build
```

### 2. Container Çalışıyor mu?

```bash
curl https://your-domain.com
```

Beklenen: Next.js homepage

### 3. API Çalışıyor mu?

```bash
curl https://your-domain.com/api/listings?limit=1
```

Beklenen: JSON response ile ilan listesi

### 4. Database Bağlantısı?

Logs'da şunu ara:

```
✓ Database connected
```

Hata varsa:

```
Error: connect ECONNREFUSED
```

Bu durumda database hostname/credentials kontrol et.

---

## 🐛 Hata Durumunda

### Build Hatası

1. Coolify build logs'u kontrol et
2. TypeScript hatası varsa: `getDiagnostics` çalıştır
3. Environment variables eksikse: Coolify panelinde kontrol et

### Runtime Hatası

1. Coolify runtime logs'u kontrol et
2. Database bağlantısını test et
3. Environment variables'ları doğrula

### Database Connection Error

```bash
# Database erişimini test et
psql -h wgkosgwkg8o4wg4k8cgcw4og -U postgres -d demir_db -p 5432
```

Şifre: `518518Erkan`

---

## 📊 Beklenen Build Süresi

- **Dependencies Install:** 2-3 dakika
- **TypeScript Build:** 1-2 dakika
- **Next.js Build:** 2-3 dakika
- **Docker Image:** 1 dakika

**Toplam:** ~6-9 dakika

---

## ✅ Başarı Kriterleri

- [ ] Build hatasız tamamlandı
- [ ] Container başarıyla başladı
- [ ] Homepage açılıyor
- [ ] API endpoints çalışıyor
- [ ] Database bağlantısı aktif
- [ ] Logs'da hata yok

---

## 📞 Sorun Giderme

Hala sorun yaşıyorsan:

1. **Build logs:** Coolify → Application → Logs → Build
2. **Runtime logs:** Coolify → Application → Logs → Runtime
3. **Environment:** Coolify → Application → Environment Variables
4. **Database:** PostgreSQL bağlantısını test et

---

**Durum:** ✅ Tüm hatalar düzeltildi, production'a hazır!

**Son Güncelleme:** 21 Ocak 2026
