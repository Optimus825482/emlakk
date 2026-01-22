# Coolify Deployment Checklist - Görsel Sorunu Çözümü

## 🚨 Acil Çözüm: Görseller Görünmüyor

### Adım 1: Coolify Volume Mount (5 dakika)

1. **Coolify Dashboard'a girin**
   - Projenizi seçin: `demir-gayrimenkul`

2. **Storage sekmesine gidin**
   - Sol menüden **Storage** tıklayın

3. **Volume ekleyin**
   - **Add Volume** butonuna tıklayın
   - Şu ayarları yapın:
     ```
     Source Path (Host):      /var/lib/coolify/uploads/demir-gayrimenkul
     Destination Path:        /app/public/uploads
     Read Only:               ❌ (Kapalı)
     ```
   - **Save** butonuna tıklayın

4. **Redeploy yapın**
   - **Redeploy** butonuna tıklayın
   - Container yeniden başlayacak (1-2 dakika)

### Adım 2: Test

1. **Admin panele girin**
   - `https://demirgayrimenkul.com.tr/admin/giris`

2. **Hakkımızda sayfasına gidin**
   - Sol menüden **Hakkımızda** tıklayın

3. **Kurucu fotoğrafı yükleyin**
   - **Kurucu Profili** sekmesinde
   - **Kurucu Fotoğrafı** bölümüne bir resim yükleyin
   - **Kaydet** butonuna tıklayın

4. **Görseli kontrol edin**
   - Yüklenen görselin URL'ini kopyalayın (örn: `/uploads/founder/1234567890-abc123.webp`)
   - Yeni sekmede açın: `https://demirgayrimenkul.com.tr/uploads/founder/1234567890-abc123.webp`
   - ✅ Görsel görünüyorsa başarılı!
   - ❌ 404 hatası alıyorsanız aşağıdaki troubleshooting'e bakın

### Adım 3: Ana Sayfa ve Diğer Görseller

Aynı şekilde test edin:

- **Ana Sayfa Hero**: `/admin/icerik` → Hero görseli yükleyin
- **İlanlar**: `/admin/ilanlar/yeni` → İlan görseli yükleyin
- **İçerik**: `/admin/icerik` → İçerik görselleri yükleyin

## 🔧 Troubleshooting

### Sorun: 404 Not Found

**Neden:** Volume mount doğru yapılmamış veya container restart olmamış

**Çözüm:**

1. Coolify'da **Logs** sekmesine gidin
2. Container loglarında şu satırı arayın:
   ```
   Mounted /var/lib/coolify/uploads/demir-gayrimenkul to /app/public/uploads
   ```
3. Yoksa volume mount'u tekrar kontrol edin ve redeploy yapın

### Sorun: 403 Forbidden

**Neden:** Dosya izinleri yanlış

**Çözüm:**

1. Coolify sunucusuna SSH ile bağlanın
2. Şu komutu çalıştırın:
   ```bash
   sudo chmod -R 755 /var/lib/coolify/uploads/demir-gayrimenkul
   sudo chown -R 1000:1000 /var/lib/coolify/uploads/demir-gayrimenkul
   ```
3. Container'ı restart edin

### Sorun: Görseller yüklenmiyor (Upload hatası)

**Neden:** Container içinde yazma izni yok

**Çözüm:**

1. Volume mount'ta **Read Only** kapalı olmalı (❌)
2. Container loglarında şu hatayı arayın:
   ```
   EACCES: permission denied, open '/app/public/uploads/...'
   ```
3. Varsa yukarıdaki chmod/chown komutlarını çalıştırın

## 📊 Mevcut Görselleri Taşıma

Eğer local'de görseller varsa sunucuya kopyalayın:

### Windows'tan (PowerShell):

```powershell
# SCP ile
scp -r public/uploads/* user@server:/var/lib/coolify/uploads/demir-gayrimenkul/

# Veya WinSCP kullanın (GUI)
```

### Linux/Mac'ten:

```bash
# Rsync ile (önerilen)
rsync -avz --progress public/uploads/ user@server:/var/lib/coolify/uploads/demir-gayrimenkul/

# Veya SCP ile
scp -r public/uploads/* user@server:/var/lib/coolify/uploads/demir-gayrimenkul/
```

## ✅ Başarı Kontrol Listesi

- [ ] Coolify'da volume mount eklendi
- [ ] Source path: `/var/lib/coolify/uploads/demir-gayrimenkul`
- [ ] Destination path: `/app/public/uploads`
- [ ] Read Only: Kapalı (❌)
- [ ] Container redeploy edildi
- [ ] Test görseli yüklendi
- [ ] Görsel browser'da açıldı (200 OK)
- [ ] Admin panelde görsel görünüyor
- [ ] Ana sayfada görsel görünüyor
- [ ] Hakkımızda sayfasında görsel görünüyor

## 🎯 Sonuç

Bu adımları tamamladıktan sonra:

- ✅ Admin panelden yüklenen tüm görseller görünecek
- ✅ Görseller container restart'larında kaybolmayacak
- ✅ Görseller persistent storage'da saklanacak
- ✅ Backup almak kolay olacak

## 📚 Ek Bilgi

- **Volume path**: `/var/lib/coolify/uploads/demir-gayrimenkul/`
- **Container path**: `/app/public/uploads/`
- **Public URL**: `https://demirgayrimenkul.com.tr/uploads/...`
- **Klasör yapısı**:
  ```
  /var/lib/coolify/uploads/demir-gayrimenkul/
  ├── hero/          # Ana sayfa hero görselleri
  ├── founder/       # Kurucu fotoğrafları
  ├── content/       # İçerik görselleri
  └── listings/      # İlan görselleri
  ```

## 🆘 Destek

Sorun devam ederse:

- **Coolify Discord**: https://discord.gg/coolify
- **Coolify Docs**: https://coolify.io/docs
- **GitHub Issues**: https://github.com/coollabsio/coolify/issues

---

**Not:** Bu çözüm production-ready ve scalable'dır. Gelecekte daha fazla trafik olursa Cloudflare R2 veya AWS S3'e geçiş yapabilirsiniz (detaylar için `PRODUCTION_IMAGE_FIX.md` dosyasına bakın).
