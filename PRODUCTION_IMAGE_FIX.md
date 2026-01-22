# Production Görsel Sorunu Çözümü

## Sorun

Admin panelden yüklenen görseller production sunucuda görünmüyor.

**Neden?**

- Next.js build sırasında `public/` klasörü static olarak kopyalanır
- Runtime'da yüklenen dosyalar (`public/uploads/`) build sonrası eklenir
- Next.js production'da bu dosyaları serve etmez

## Çözüm: Coolify Volume Mount + Nginx

### 1. Coolify Volume Ayarları

Coolify dashboard'da projenize gidin:

1. **Storage** sekmesine tıklayın
2. **Add Volume** butonuna tıklayın
3. Şu ayarları yapın:
   - **Source Path (Host)**: `/var/lib/coolify/uploads/demir-gayrimenkul`
   - **Destination Path (Container)**: `/app/public/uploads`
   - **Read Only**: ❌ (Kapalı - yazma izni gerekli)

4. **Save** ve **Redeploy** yapın

### 2. Nginx Konfigürasyonu (Opsiyonel - Performans için)

Eğer Coolify'da Nginx proxy kullanıyorsanız, static dosyalar için özel konfigürasyon ekleyin:

```nginx
# Coolify Nginx Custom Config
location /uploads/ {
    alias /var/lib/coolify/uploads/demir-gayrimenkul/;
    expires 30d;
    add_header Cache-Control "public, immutable";
    access_log off;
}
```

### 3. Dockerfile Güncellemesi (Gerekirse)

Eğer custom Dockerfile kullanıyorsanız, uploads klasörünü oluşturun:

```dockerfile
# Dockerfile içinde
RUN mkdir -p /app/public/uploads && \
    chmod 755 /app/public/uploads
```

### 4. Test

1. Admin panelden bir görsel yükleyin
2. Dönen URL'i kontrol edin: `/uploads/hero/1234567890-abc123.webp`
3. Browser'da direkt URL'i açın: `https://demirgayrimenkul.com.tr/uploads/hero/1234567890-abc123.webp`
4. Görsel görünüyorsa ✅ başarılı!

## Alternatif Çözüm: External Storage (Gelecek için)

Daha scalable bir çözüm için external storage kullanabilirsiniz:

### Cloudflare R2 (Önerilen - Ücretsiz 10GB)

1. Cloudflare R2 bucket oluşturun
2. `.env.production` dosyasına ekleyin:

```env
# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=demir-gayrimenkul-uploads
R2_PUBLIC_URL=https://uploads.demirgayrimenkul.com.tr
```

3. Upload API'sini güncelleyin (kod hazır, sadece env variable ekleyin)

### AWS S3

```env
# AWS S3
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=demir-gayrimenkul-uploads
S3_PUBLIC_URL=https://s3.eu-central-1.amazonaws.com/demir-gayrimenkul-uploads
```

## Mevcut Görselleri Taşıma

Eğer local'de görseller varsa, sunucuya kopyalayın:

```bash
# Local'den sunucuya
scp -r public/uploads/* user@server:/var/lib/coolify/uploads/demir-gayrimenkul/

# Veya rsync ile
rsync -avz public/uploads/ user@server:/var/lib/coolify/uploads/demir-gayrimenkul/
```

## Kontrol Listesi

- [ ] Coolify'da volume mount eklendi
- [ ] Container redeploy edildi
- [ ] Test görseli yüklendi
- [ ] Görsel browser'da açıldı
- [ ] Admin panelde görsel görünüyor
- [ ] Ana sayfada görsel görünüyor
- [ ] Hakkımızda sayfasında görsel görünüyor

## Sorun Devam Ederse

1. **Container loglarını kontrol edin:**

   ```bash
   # Coolify dashboard -> Logs
   # Veya SSH ile:
   docker logs <container_id>
   ```

2. **Dosya izinlerini kontrol edin:**

   ```bash
   ls -la /var/lib/coolify/uploads/demir-gayrimenkul/
   # Çıktı: drwxr-xr-x (755 olmalı)
   ```

3. **Next.js static file serving'i test edin:**
   - Browser console'da network tab'ı açın
   - Görsel URL'ine gidin
   - Status code: 200 ✅ / 404 ❌ / 403 ❌

4. **Coolify support'a başvurun:**
   - Discord: https://discord.gg/coolify
   - GitHub: https://github.com/coollabsio/coolify/issues

## Notlar

- Volume mount sonrası container restart gerekir
- Görseller `/var/lib/coolify/uploads/demir-gayrimenkul/` klasöründe saklanır
- Bu klasör container'lar arası paylaşılır (persistent storage)
- Backup almayı unutmayın!
