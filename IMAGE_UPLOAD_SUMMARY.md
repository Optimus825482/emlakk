# Görsel Yükleme Sistemi - Özet

## 🎯 Sorun

Admin panelden yüklenen görseller production sunucuda görünmüyor.

## ✅ Çözüm

Coolify Volume Mount ile persistent storage kullanımı.

## 📁 Dosya Yapısı

```
public/uploads/
├── hero/          # Ana sayfa hero görselleri
├── founder/       # Kurucu fotoğrafları
├── content/       # İçerik görselleri
└── listings/      # İlan görselleri
```

## 🔧 Teknik Detaylar

### Upload API

- **Endpoint**: `/api/upload`
- **Method**: POST (multipart/form-data)
- **Max Size**: 5MB
- **Formats**: JPG, PNG, WebP, GIF
- **Optimization**: Sharp ile otomatik WebP dönüşümü
- **Brightness**: Karanlık görseller otomatik iyileştirilir

### Dosya Yolu

```
Local:       public/uploads/folder/filename.webp
Production:  /var/lib/coolify/uploads/demir-gayrimenkul/folder/filename.webp
Public URL:  https://demirgayrimenkul.com.tr/uploads/folder/filename.webp
```

### Next.js Config

```typescript
// next.config.ts
images: {
  unoptimized: true,  // Local uploads için
}
async headers() {
  return [{
    source: "/uploads/:path*",
    headers: [{
      key: "Cache-Control",
      value: "public, max-age=31536000, immutable"
    }]
  }]
}
```

## 🚀 Deployment

### Coolify Volume Mount

```
Source Path:      /var/lib/coolify/uploads/demir-gayrimenkul
Destination Path: /app/public/uploads
Read Only:        ❌ (Kapalı)
```

### Adımlar

1. Coolify → Storage → Add Volume
2. Yukarıdaki ayarları gir
3. Save → Redeploy
4. Test: Admin panelden görsel yükle
5. Kontrol: Browser'da URL'i aç

## 📝 Kullanım

### Admin Panelde Görsel Yükleme

**Hakkımızda Sayfası:**

```
/admin/hakkimizda → Kurucu Profili → Kurucu Fotoğrafı
```

**Ana Sayfa Hero:**

```
/admin/icerik → Hero Görseli
```

**İlan Görseli:**

```
/admin/ilanlar/yeni → Görsel Yükle
```

### Component Kullanımı

```tsx
import { ImageUpload } from "@/components/ui/image-upload";

<ImageUpload
  value={imageUrl}
  onChange={(url) => setImageUrl(url)}
  folder="hero"
  aspectRatio="16:9"
  recommendedSize="1920x1080"
  label="Hero Görseli"
  enableEditor={true}
/>;
```

## 🔍 Troubleshooting

| Sorun         | Çözüm                                         |
| ------------- | --------------------------------------------- |
| 404 Not Found | Volume mount kontrol et, redeploy yap         |
| 403 Forbidden | `chmod 755` ve `chown 1000:1000` çalıştır     |
| Upload hatası | Read Only kapalı olmalı                       |
| Görsel bozuk  | Sharp optimization hatası, logları kontrol et |

## 📊 Özellikler

✅ Otomatik WebP dönüşümü (80% boyut azaltma)  
✅ Karanlık görsel iyileştirme (brightness boost)  
✅ Thumbnail oluşturma (listings için)  
✅ Drag & drop yükleme  
✅ URL ile görsel ekleme  
✅ Görsel düzenleme (crop, rotate, filter)  
✅ Persistent storage (volume mount)  
✅ Cache optimization (1 yıl)

## 📚 İlgili Dosyalar

- `src/app/api/upload/route.ts` - Upload API
- `src/components/ui/image-upload.tsx` - Upload component
- `src/components/ui/image-editor.tsx` - Görsel düzenleyici
- `next.config.ts` - Next.js config
- `.gitignore` - Uploads klasörü ignore
- `PRODUCTION_IMAGE_FIX.md` - Detaylı çözüm
- `COOLIFY_DEPLOYMENT_CHECKLIST.md` - Deployment adımları

## 🎓 Notlar

- Görseller `/var/lib/coolify/uploads/` klasöründe saklanır
- Container restart'larında kaybolmaz (persistent)
- Backup almak kolay (tek klasör)
- Gelecekte S3/R2'ye geçiş yapılabilir

## ✨ Gelecek İyileştirmeler

- [ ] Cloudflare R2 entegrasyonu (CDN)
- [ ] Bulk upload (çoklu görsel)
- [ ] Görsel galerisi (media library)
- [ ] Otomatik thumbnail boyutları
- [ ] Video upload desteği
- [ ] Görsel sıkıştırma seviyeleri
