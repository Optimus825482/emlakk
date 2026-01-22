# Production Image Upload Fix - Final Solution

## Problem

Yüklenen resimler 404 veriyor:

- `https://demirgayrimenkul.com.tr/uploads/founder/1769101144364-98mri3.webp`
- `https://demirgayrimenkul.com.tr/uploads/listings/*`

Container içinde dosyalar var (`/app/public/uploads/`) ama web'den erişilemiyor.

## Root Cause

1. Coolify'da container restart olduğunda dosyalar kayboluyor
2. Next.js static dosyaları serve ediyor ama persistent storage yok
3. Traefik reverse proxy static dosyaları doğru route etmiyor

## Solution: Persistent Volume Mount

### Step 1: Coolify Dashboard'dan Volume Ekle

```
Coolify Dashboard → Applications → Demir Gayrimenkul → Storages → Add Storage

Source Path (Host): /var/www/uploads
Destination Path (Container): /app/public/uploads
```

### Step 2: Mevcut Dosyaları Kopyala

Sunucuda (SSH ile `root@77.42.68.4`):

```bash
# Container ID'yi bul
docker ps | grep demir

# Container'dan host'a kopyala
docker cp <CONTAINER_ID>:/app/public/uploads/. /var/www/uploads/

# İzinleri ayarla
chmod -R 755 /var/www/uploads
chown -R 1000:1000 /var/www/uploads

# Klasör yapısını kontrol et
ls -la /var/www/uploads/
ls -la /var/www/uploads/listings/
ls -la /var/www/uploads/founder/
```

### Step 3: Container'ı Redeploy Et

Coolify Dashboard'dan:

```
Applications → Demir Gayrimenkul → Redeploy
```

### Step 4: Test Et

```bash
# Container içinde kontrol et
docker exec -it <CONTAINER_ID> ls -la /app/public/uploads/

# Web'den test et
curl -I https://demirgayrimenkul.com.tr/uploads/founder/1769101144364-98mri3.webp
```

## Alternative Solution: Nginx Static Serve

Eğer persistent volume çalışmazsa, Nginx ile static dosyaları serve et:

### 1. Nginx Config Ekle

`nginx-static.conf` dosyası oluşturuldu (proje root'unda).

### 2. Coolify'da Nginx Ekle

```
Coolify Dashboard → Applications → Demir Gayrimenkul → Services → Add Service

Type: Nginx
Config File: nginx-static.conf
Port: 80
```

### 3. Traefik Routing Güncelle

```
Coolify Dashboard → Applications → Demir Gayrimenkul → Domains

Add Rule:
- Path: /uploads/*
- Service: nginx
- Port: 80
```

## Verification

### Test Commands

```bash
# 1. Container içinde dosyalar var mı?
docker exec -it <CONTAINER_ID> ls -la /app/public/uploads/listings/

# 2. Host'ta dosyalar var mı?
ls -la /var/www/uploads/listings/

# 3. Web'den erişilebiliyor mu?
curl -I https://demirgayrimenkul.com.tr/uploads/founder/1769101144364-98mri3.webp

# 4. Nginx logları
docker logs <CONTAINER_ID> | grep uploads
```

### Expected Results

```bash
# Container içinde
total 15268
-rw-r--r-- 1 root root  346430 Jan 21 01:10 1768220793763-...png
-rw-r--r-- 1 root root  206994 Jan 21 02:16 1768961776888-2evvdl.jpeg
...

# Host'ta
total 15268
-rw-r--r-- 1 1000 1000  346430 Jan 21 01:10 1768220793763-...png
-rw-r--r-- 1 1000 1000  206994 Jan 21 02:16 1768961776888-2evvdl.jpeg
...

# Web'den
HTTP/2 200
content-type: image/webp
cache-control: public, immutable
```

## Current Status

✅ Dosyalar container içinde mevcut:

- `/app/public/uploads/listings/` - 15268 KB (7 dosya)
- `/app/public/uploads/founder/` - 432 KB (9 dosya)

❌ Web'den erişilemiyor:

- 404 Not Found

🔧 Next Step:

- Persistent volume mount ekle (Coolify Dashboard)
- Mevcut dosyaları kopyala
- Redeploy

## Files Modified

- `nginx-static.conf` - Nginx static serve config (yeni)
- `PRODUCTION_IMAGE_FIX_FINAL.md` - Bu dokümantasyon (yeni)

## Notes

- Container ID: `5e0f3d942de8` (değişebilir)
- Server IP: `77.42.68.4`
- Domain: `demirgayrimenkul.com.tr`
- Upload API: `/api/upload` (çalışıyor, dosyalar kaydediliyor)
- Problem: Static serve (Next.js public folder)
