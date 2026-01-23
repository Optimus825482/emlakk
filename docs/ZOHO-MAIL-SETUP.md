# 📧 Zoho Mail Kurulum Rehberi

**Domain:** demirgayrimenkul.com.tr  
**Maliyet:** $1/ay/kullanıcı (veya ücretsiz 5 kullanıcıya kadar - Lite plan)  
**Süre:** 15-30 dakika

---

## 📋 İçindekiler

1. [Zoho Mail Kaydı](#1-zoho-mail-kaydı)
2. [Domain Doğrulama](#2-domain-doğrulama)
3. [DNS Kayıtları](#3-dns-kayıtları)
4. [Email Adresleri Oluşturma](#4-email-adresleri-oluşturma)
5. [SMTP Ayarları (Uygulama için)](#5-smtp-ayarları)
6. [Mobil ve Desktop Kurulum](#6-mobil-ve-desktop-kurulum)
7. [Sorun Giderme](#7-sorun-giderme)

---

## 1. Zoho Mail Kaydı

### Adım 1.1: Zoho Mail'e Git

```
https://www.zoho.com/mail/
```

### Adım 1.2: Plan Seç

- **Ücretsiz Plan (Lite):** 5 kullanıcıya kadar, 5GB/kullanıcı
- **Mail Lite:** $1/ay/kullanıcı, 10GB/kullanıcı
- **Mail Premium:** $4/ay/kullanıcı, 50GB/kullanıcı

**Tavsiye:** Başlangıç için **Ücretsiz Plan** yeterli!

### Adım 1.3: Kayıt Ol

1. "Sign Up Free" butonuna tıkla
2. Domain adını gir: `demirgayrimenkul.com.tr`
3. İlk admin hesabını oluştur:
   - Email: `admin@demirgayrimenkul.com.tr`
   - Şifre: Güçlü bir şifre belirle
4. Telefon doğrulaması yap

---

## 2. Domain Doğrulama

Zoho, domain'in sahibi olduğunu doğrulamak için 3 yöntem sunar:

### Yöntem 1: TXT Kaydı (ÖNERİLEN)

**Domain sağlayıcında (örn: GoDaddy, Namecheap) DNS ayarlarına git:**

```
Kayıt Tipi: TXT
Host/Name: @ (veya boş)
Value: zb12345678 (Zoho'nun verdiği kod)
TTL: 3600
```

### Yöntem 2: HTML Dosyası

```html
<!-- public/.well-known/zoho-verification.html -->
zb12345678
```

### Yöntem 3: CNAME Kaydı

```
Kayıt Tipi: CNAME
Host/Name: zb12345678
Value: zmverify.zoho.com
TTL: 3600
```

**Doğrulama:**

- DNS değişikliği 10-30 dakika sürebilir
- Zoho panelinde "Verify" butonuna tıkla

---

## 3. DNS Kayıtları

Domain doğrulandıktan sonra email için gerekli DNS kayıtlarını ekle:

### 3.1 MX Kayıtları (Email Alma)

Domain sağlayıcında DNS ayarlarına git ve şu MX kayıtlarını ekle:

```
Kayıt Tipi: MX
Host/Name: @ (veya boş)
Priority: 10
Value: mx.zoho.com
TTL: 3600

Kayıt Tipi: MX
Host/Name: @ (veya boş)
Priority: 20
Value: mx2.zoho.com
TTL: 3600

Kayıt Tipi: MX
Host/Name: @ (veya boş)
Priority: 50
Value: mx3.zoho.com
TTL: 3600
```

### 3.2 SPF Kaydı (Spam Koruması)

```
Kayıt Tipi: TXT
Host/Name: @ (veya boş)
Value: v=spf1 include:zoho.com ~all
TTL: 3600
```

**Eğer mevcut SPF kaydın varsa:**

```
v=spf1 include:zoho.com include:_spf.google.com ~all
```

### 3.3 DKIM Kaydı (Email İmzalama)

Zoho panelinde: **Email Configuration → DKIM**

```
Kayıt Tipi: TXT
Host/Name: zoho._domainkey
Value: v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC... (Zoho'nun verdiği uzun key)
TTL: 3600
```

### 3.4 DMARC Kaydı (Email Güvenliği)

```
Kayıt Tipi: TXT
Host/Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:admin@demirgayrimenkul.com.tr
TTL: 3600
```

**DMARC Politikaları:**

- `p=none` - Sadece raporla (başlangıç için)
- `p=quarantine` - Şüpheli emailleri spam'e at
- `p=reject` - Şüpheli emailleri reddet

### 3.5 DNS Kayıtları Özet Tablosu

| Tip | Host             | Value                        | Priority | TTL  |
| --- | ---------------- | ---------------------------- | -------- | ---- |
| MX  | @                | mx.zoho.com                  | 10       | 3600 |
| MX  | @                | mx2.zoho.com                 | 20       | 3600 |
| MX  | @                | mx3.zoho.com                 | 50       | 3600 |
| TXT | @                | v=spf1 include:zoho.com ~all | -        | 3600 |
| TXT | zoho.\_domainkey | v=DKIM1; k=rsa; p=...        | -        | 3600 |
| TXT | \_dmarc          | v=DMARC1; p=none; rua=...    | -        | 3600 |

---

## 4. Email Adresleri Oluşturma

### Adım 4.1: Zoho Admin Paneline Git

```
https://mailadmin.zoho.com/
```

### Adım 4.2: Kullanıcı Ekle

**Users → Add User**

**Önerilen Email Adresleri:**

1. **info@demirgayrimenkul.com.tr**
   - Ad: Demir Gayrimenkul
   - Kullanım: Genel iletişim, web sitesi formları

2. **destek@demirgayrimenkul.com.tr**
   - Ad: Destek Ekibi
   - Kullanım: Müşteri destek talepleri

3. **mustafa@demirgayrimenkul.com.tr**
   - Ad: Mustafa Demir
   - Kullanım: Kişisel iletişim

4. **randevu@demirgayrimenkul.com.tr**
   - Ad: Randevu Sistemi
   - Kullanım: Otomatik randevu bildirimleri

5. **noreply@demirgayrimenkul.com.tr**
   - Ad: No Reply
   - Kullanım: Otomatik sistem emailleri

### Adım 4.3: Email Grupları (Opsiyonel)

**Groups → Create Group**

```
Grup: iletisim@demirgayrimenkul.com.tr
Üyeler: mustafa@, info@
```

---

## 5. SMTP Ayarları (Uygulama için)

### 5.1 Uygulama Şifresi Oluştur

**Zoho Mail → Settings → Security → App Passwords**

1. "Generate New Password" tıkla
2. İsim: "Demir Gayrimenkul Web App"
3. Şifreyi kopyala (bir daha gösterilmez!)

### 5.2 Next.js Uygulamasında Kullan

**`.env.local` dosyasına ekle:**

```bash
# Zoho Mail SMTP
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=info@demirgayrimenkul.com.tr
SMTP_PASS=uygulama_şifresi_buraya
SMTP_FROM=info@demirgayrimenkul.com.tr
SMTP_FROM_NAME=Demir Gayrimenkul
```

### 5.3 Nodemailer Konfigürasyonu

**`src/lib/email.ts` oluştur:**

```typescript
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // false for 587, true for 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  try {
    const info = await transporter.sendMail({
      from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""), // HTML'den text oluştur
    });

    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error };
  }
}
```

### 5.4 Test Email Gönder

**`src/app/api/test-email/route.ts` oluştur:**

```typescript
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function GET() {
  const result = await sendEmail({
    to: "test@example.com",
    subject: "Test Email - Demir Gayrimenkul",
    html: `
      <h1>Test Email</h1>
      <p>Bu bir test emailidir.</p>
      <p>Zoho Mail SMTP başarıyla çalışıyor! ✅</p>
    `,
  });

  return NextResponse.json(result);
}
```

**Test et:**

```bash
curl http://localhost:3000/api/test-email
```

### 5.5 SMTP Ayarları Özet

| Ayar              | Değer                             |
| ----------------- | --------------------------------- |
| **SMTP Host**     | smtp.zoho.com                     |
| **SMTP Port**     | 587 (TLS) veya 465 (SSL)          |
| **Güvenlik**      | STARTTLS (587) veya SSL/TLS (465) |
| **Kullanıcı Adı** | info@demirgayrimenkul.com.tr      |
| **Şifre**         | Uygulama şifresi                  |
| **Günlük Limit**  | 500 email/gün (ücretsiz plan)     |

---

## 6. Mobil ve Desktop Kurulum

### 6.1 Webmail (Tarayıcı)

```
https://mail.zoho.com/
```

### 6.2 Mobil Uygulamalar

**iOS:**

- App Store'dan "Zoho Mail" indir
- Giriş yap: `info@demirgayrimenkul.com.tr`

**Android:**

- Play Store'dan "Zoho Mail" indir
- Giriş yap: `info@demirgayrimenkul.com.tr`

### 6.3 Desktop Email İstemcileri

**Outlook, Thunderbird, Apple Mail için:**

**IMAP Ayarları (Email Alma):**

```
IMAP Server: imap.zoho.com
Port: 993
Güvenlik: SSL/TLS
Kullanıcı: info@demirgayrimenkul.com.tr
Şifre: Hesap şifresi
```

**SMTP Ayarları (Email Gönderme):**

```
SMTP Server: smtp.zoho.com
Port: 587 (veya 465)
Güvenlik: STARTTLS (veya SSL/TLS)
Kullanıcı: info@demirgayrimenkul.com.tr
Şifre: Hesap şifresi
```

---

## 7. Sorun Giderme

### 7.1 Email Gönderilmiyor

**Kontrol Listesi:**

- ✅ MX kayıtları doğru mu? → `nslookup -type=mx demirgayrimenkul.com.tr`
- ✅ SPF kaydı var mı? → `nslookup -type=txt demirgayrimenkul.com.tr`
- ✅ SMTP şifresi doğru mu?
- ✅ Port 587 açık mı? (firewall kontrolü)
- ✅ Günlük limit aşıldı mı? (500 email/gün)

**Test Komutu:**

```bash
telnet smtp.zoho.com 587
```

### 7.2 Email Spam'e Düşüyor

**Çözümler:**

1. DKIM kaydını ekle (yukarıda anlatıldı)
2. DMARC kaydını ekle
3. SPF kaydını kontrol et
4. Email içeriğinde spam kelimeleri kullanma
5. HTML/Text oranını dengele

**Spam Test:**

```
https://www.mail-tester.com/
```

### 7.3 DNS Değişiklikleri Uygulanmadı

**Bekleme Süresi:**

- Genelde 10-30 dakika
- Bazen 24-48 saat sürebilir

**DNS Kontrol:**

```bash
# MX kayıtları
nslookup -type=mx demirgayrimenkul.com.tr

# SPF kaydı
nslookup -type=txt demirgayrimenkul.com.tr

# DKIM kaydı
nslookup -type=txt zoho._domainkey.demirgayrimenkul.com.tr
```

**Online DNS Kontrol:**

```
https://mxtoolbox.com/SuperTool.aspx
```

### 7.4 Uygulama Şifresi Çalışmıyor

**Çözüm:**

1. Zoho Mail → Settings → Security
2. "Two-Factor Authentication" aktif mi kontrol et
3. Yeni uygulama şifresi oluştur
4. `.env.local` dosyasını güncelle
5. Uygulamayı yeniden başlat

### 7.5 "Authentication Failed" Hatası

**Olası Nedenler:**

- ❌ Yanlış kullanıcı adı/şifre
- ❌ 2FA aktif ama uygulama şifresi kullanılmamış
- ❌ Hesap kilitlenmiş (çok fazla başarısız deneme)
- ❌ SMTP portu yanlış (587 veya 465 kullan)

---

## 8. Güvenlik Önerileri

### 8.1 İki Faktörlü Doğrulama (2FA)

**Zoho Mail → Settings → Security → Two-Factor Authentication**

1. 2FA'yı aktif et
2. Authenticator app kullan (Google Authenticator, Authy)
3. Yedek kodları kaydet

### 8.2 IP Kısıtlaması

**Admin Panel → Security → IP Restrictions**

Sadece belirli IP'lerden erişime izin ver:

```
Ofis IP: 123.456.789.0
Sunucu IP: 234.567.890.0
```

### 8.3 Email Şifreleme

**S/MIME Sertifikası:**

- Zoho Mail → Settings → Security → S/MIME
- Ücretsiz veya ücretli sertifika al
- Email'leri şifrele ve imzala

---

## 9. Faydalı Linkler

- **Zoho Mail Admin:** https://mailadmin.zoho.com/
- **Webmail:** https://mail.zoho.com/
- **Destek:** https://help.zoho.com/portal/en/kb/mail
- **DNS Kontrol:** https://mxtoolbox.com/
- **Spam Test:** https://www.mail-tester.com/
- **DMARC Analiz:** https://dmarc.org/

---

## 10. Hızlı Başlangıç Checklist

- [ ] Zoho Mail'e kaydol
- [ ] Domain'i doğrula (TXT kaydı)
- [ ] MX kayıtlarını ekle
- [ ] SPF kaydını ekle
- [ ] DKIM kaydını ekle
- [ ] DMARC kaydını ekle
- [ ] Email adreslerini oluştur
- [ ] Uygulama şifresi oluştur
- [ ] `.env.local` dosyasını güncelle
- [ ] Test email gönder
- [ ] Mobil uygulamayı kur
- [ ] 2FA'yı aktif et

---

## 📞 Destek

Sorun yaşarsan:

1. Zoho destek: https://help.zoho.com/
2. DNS kontrol: `nslookup` komutları
3. SMTP test: `telnet smtp.zoho.com 587`

**Kurulum tamamlandı! 🎉**

Email adreslerin artık hazır: `info@demirgayrimenkul.com.tr`
