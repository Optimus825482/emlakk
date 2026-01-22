# 📊 Google Analytics 4 Kurulum Rehberi

## ⚠️ Önemli Not

Google Analytics entegrasyonu **opsiyoneldir**. Eğer kurulum yapmazsanız:

- Admin panelinde analytics verileri "0" olarak görünür
- Sistem normal çalışmaya devam eder
- Hiçbir hata fırlatılmaz (graceful fallback)

## 🎯 Ne İçin Kullanılıyor?

Admin panelinde (`/admin`) şu metrikleri görmek için:

- Toplam kullanıcı sayısı
- Yeni kullanıcılar
- Oturum sayısı
- Sayfa görüntülemeleri
- Ortalama oturum süresi
- Bounce rate
- En çok görüntülenen sayfalar
- Trafik kaynakları
- Günlük trend grafikleri
- Realtime aktif kullanıcılar

## 🚀 Kurulum Adımları

### 1. Google Analytics 4 Property Oluştur

1. [Google Analytics](https://analytics.google.com/) → Admin
2. "Create Property" → Property adı gir
3. Property ID'yi not et (örn: `123456789`)

### 2. Service Account Oluştur

1. [Google Cloud Console](https://console.cloud.google.com/)
2. Proje seç veya yeni oluştur
3. "IAM & Admin" → "Service Accounts"
4. "Create Service Account"
   - Name: `analytics-reader`
   - Role: **Viewer** (okuma yetkisi yeterli)
5. "Keys" → "Add Key" → "Create New Key" → JSON
6. JSON dosyasını indir

### 3. Service Account'a Analytics Erişimi Ver

1. [Google Analytics](https://analytics.google.com/) → Admin
2. Property → "Property Access Management"
3. "Add Users" → Service Account email'ini ekle
4. Role: **Viewer** seç
5. Save

### 4. Environment Variables Ekle

#### Option 1: Full JSON (Önerilen)

```bash
# .env.local
GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'

GA_PROPERTY_ID="123456789"
```

#### Option 2: Individual Variables

```bash
# .env.local
GA_CLIENT_EMAIL="analytics-reader@project.iam.gserviceaccount.com"
GA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
GA_PROPERTY_ID="123456789"
```

**Not**: Private key'de `\n` karakterleri olmalı (newline escape)

### 5. Test Et

```bash
npm run dev
```

Admin paneline git: `http://localhost:3000/admin`

Analytics kartlarında veri görmelisin. Eğer "0" görüyorsan:

1. Console'da hata var mı kontrol et
2. Service Account email'i Analytics'e eklenmiş mi?
3. Property ID doğru mu?
4. Private key formatı doğru mu? (`\n` karakterleri var mı?)

## 🐛 Sorun Giderme

### "Analytics client not available"

**Sebep**: Credentials eksik veya hatalı

**Çözüm**:

1. `.env.local` dosyasında değişkenler var mı kontrol et
2. JSON formatı geçerli mi? (JSON validator kullan)
3. Private key'de `\n` karakterleri var mı?

### "Authentication Failed (Invalid Credentials)"

**Sebep**: Service Account yetkileri yok

**Çözüm**:

1. Google Analytics → Admin → Property Access Management
2. Service Account email'ini ekle
3. Role: **Viewer** seç

### "Property not found"

**Sebep**: Property ID yanlış

**Çözüm**:

1. Google Analytics → Admin → Property Settings
2. Property ID'yi kopyala (sadece rakamlar)
3. `.env.local` dosyasında `GA_PROPERTY_ID` güncelle

### Veri görünmüyor

**Sebep**: Property'de henüz veri yok

**Çözüm**:

1. Google Analytics tracking code'u sitenize eklenmiş mi?
2. Birkaç saat bekleyin (veri işleme süresi)
3. Realtime raporlarda veri var mı kontrol edin

## 📝 Örnek JSON Credentials

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC...\n-----END PRIVATE KEY-----\n",
  "client_email": "analytics-reader@your-project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

## 🔒 Güvenlik

- Service Account JSON'unu **asla** git'e commit etme
- `.env.local` dosyası `.gitignore`'da olmalı
- Production'da environment variables kullan (Vercel, Railway, etc.)
- Service Account'a sadece **Viewer** yetkisi ver (yazma yetkisi gereksiz)

## 🚫 Analytics Olmadan Çalışma

Eğer Google Analytics kurmak istemiyorsan:

- Hiçbir şey yapma, sistem otomatik olarak graceful fallback yapar
- Admin panelinde analytics kartları "0" gösterir
- Hiçbir hata fırlatılmaz
- Sistem normal çalışır

## 📚 Daha Fazla Bilgi

- [Google Analytics Data API](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [Service Account Authentication](https://cloud.google.com/docs/authentication/production)
- [GA4 Property Setup](https://support.google.com/analytics/answer/9304153)

---

**Not**: Bu kurulum sadece **backend analytics** içindir (admin paneli). Frontend tracking için ayrıca Google Analytics tracking code'u eklemelisin.
