# 🌐 Nameserver Kurulumu - demirgayrimenkul.com.tr

## 📋 Durum: Sadece Nameserver Değiştirilebiliyor

Domain sağlayıcınızda sadece nameserver değiştirebiliyorsanız, 2 seçeneğiniz var:

---

## ✅ Çözüm 1: Cloudflare DNS (ÖNERİLEN)

Cloudflare ücretsiz ve güçlü bir DNS servisi sağlar.

### Adım 1: Cloudflare Hesabı Oluştur

1. https://dash.cloudflare.com/sign-up adresine git
2. Email ve şifre ile kayıt ol
3. Email'i doğrula

### Adım 2: Domain Ekle

1. Cloudflare dashboard'da **"Add a Site"** tıkla
2. Domain'i gir: `demirgayrimenkul.com.tr`
3. **Free Plan** seç
4. **Continue** tıkla

### Adım 3: DNS Kayıtları Ekle

Cloudflare otomatik olarak mevcut kayıtları tarayacak. Şu kayıtları ekle/düzenle:

```
Type: A
Name: @
Content: COOLIFY_SUNUCU_IP_ADRESINIZ
Proxy: ✅ Proxied (Turuncu bulut)
TTL: Auto

Type: A
Name: www
Content: COOLIFY_SUNUCU_IP_ADRESINIZ
Proxy: ✅ Proxied (Turuncu bulut)
TTL: Auto
```

**Önemli:** "Proxied" (turuncu bulut) seçeneğini aktif et. Bu Cloudflare'in CDN ve güvenlik özelliklerini aktif eder.

### Adım 4: Nameserver'ları Kopyala

Cloudflare size 2 nameserver verecek, örneğin:

```
aron.ns.cloudflare.com
uma.ns.cloudflare.com
```

### Adım 5: Domain Sağlayıcınızda Nameserver Değiştir

Domain sağlayıcınızın (GoDaddy, Namecheap, vb.) panelinde:

1. **DNS/Nameserver Settings** bölümüne git
2. **Custom Nameservers** seç
3. Cloudflare'den aldığın 2 nameserver'ı gir:
   ```
   aron.ns.cloudflare.com
   uma.ns.cloudflare.com
   ```
4. Kaydet

### Adım 6: Cloudflare'de Doğrulama Bekle

- Nameserver değişikliği 24-48 saat sürebilir
- Cloudflare otomatik olarak kontrol edecek
- Email ile bildirim alacaksın

### Adım 7: SSL/TLS Ayarları (Cloudflare)

Cloudflare dashboard'da:

1. **SSL/TLS** sekmesine git
2. **Encryption mode** → **Full (strict)** seç
3. **Edge Certificates** → **Always Use HTTPS** → ON

### Adım 8: Coolify'da Domain Ayarla

Coolify panelinde:

```
Primary Domain: demirgayrimenkul.com.tr
Additional Domains: www.demirgayrimenkul.com.tr
```

**SSL:** Cloudflare zaten SSL sağlıyor, Coolify'da "Force HTTPS" kapalı olabilir.

---

## ✅ Çözüm 2: Coolify Sunucusunda DNS (Alternatif)

Eğer Coolify sunucunuzda DNS server kurabiliyorsanız:

### Adım 1: Coolify Sunucusunda Bind9 Kur

```bash
ssh root@COOLIFY_SUNUCU_IP

# Bind9 kurulumu
sudo apt update
sudo apt install -y bind9 bind9utils bind9-doc

# Bind9'u başlat
sudo systemctl start bind9
sudo systemctl enable bind9
```

### Adım 2: DNS Zone Dosyası Oluştur

```bash
sudo nano /etc/bind/db.demirgayrimenkul.com.tr
```

İçeriği:

```
$TTL    3600
@       IN      SOA     ns1.demirgayrimenkul.com.tr. admin.demirgayrimenkul.com.tr. (
                        2026012201      ; Serial
                        3600            ; Refresh
                        1800            ; Retry
                        604800          ; Expire
                        3600 )          ; Negative Cache TTL
;
@       IN      NS      ns1.demirgayrimenkul.com.tr.
@       IN      NS      ns2.demirgayrimenkul.com.tr.
@       IN      A       COOLIFY_SUNUCU_IP
www     IN      A       COOLIFY_SUNUCU_IP
ns1     IN      A       COOLIFY_SUNUCU_IP
ns2     IN      A       COOLIFY_SUNUCU_IP
```

### Adım 3: Bind9 Yapılandırması

```bash
sudo nano /etc/bind/named.conf.local
```

Ekle:

```
zone "demirgayrimenkul.com.tr" {
    type master;
    file "/etc/bind/db.demirgayrimenkul.com.tr";
};
```

### Adım 4: Bind9'u Yeniden Başlat

```bash
sudo systemctl restart bind9
sudo systemctl status bind9
```

### Adım 5: Domain Sağlayıcınızda Nameserver Değiştir

```
ns1.demirgayrimenkul.com.tr
ns2.demirgayrimenkul.com.tr
```

**Not:** Bu yöntem daha karmaşık ve Cloudflare kadar güvenli değil.

---

## 🎯 Hangi Çözümü Seçmeliyim?

### Cloudflare (ÖNERİLEN) ✅

**Avantajlar:**

- ✅ Ücretsiz
- ✅ Kolay kurulum
- ✅ Otomatik SSL
- ✅ CDN (hızlı yükleme)
- ✅ DDoS koruması
- ✅ Web Application Firewall (WAF)
- ✅ Analytics
- ✅ 24/7 uptime

**Dezavantajlar:**

- ❌ Üçüncü parti servise bağımlılık

### Kendi DNS Server

**Avantajlar:**

- ✅ Tam kontrol
- ✅ Üçüncü parti yok

**Dezavantajlar:**

- ❌ Karmaşık kurulum
- ❌ Bakım gerektirir
- ❌ CDN yok
- ❌ DDoS koruması yok
- ❌ Sunucu çökerse DNS de çöker

---

## 📊 Cloudflare Kurulum Özeti (Önerilen)

```
1. Cloudflare hesabı oluştur
   ↓
2. Domain ekle (demirgayrimenkul.com.tr)
   ↓
3. DNS kayıtları ekle (A record @ ve www)
   ↓
4. Cloudflare nameserver'ları kopyala
   ↓
5. Domain sağlayıcında nameserver değiştir
   ↓
6. 24-48 saat bekle (DNS propagation)
   ↓
7. Cloudflare'de SSL/TLS ayarla (Full strict)
   ↓
8. Coolify'da domain ayarla
   ↓
9. Deploy!
```

---

## 🔍 DNS Propagation Kontrolü

Nameserver değişikliğinden sonra:

```bash
# Nameserver kontrolü
nslookup -type=ns demirgayrimenkul.com.tr

# A record kontrolü
nslookup demirgayrimenkul.com.tr

# Detaylı kontrol
dig demirgayrimenkul.com.tr

# Online araç
https://www.whatsmydns.net/
```

---

## 🐛 Sorun Giderme

### Nameserver Değişmedi

**Kontrol:**

```bash
nslookup -type=ns demirgayrimenkul.com.tr
```

**Çözüm:**

- 24-48 saat bekle
- Domain sağlayıcıda doğru girildiğini kontrol et
- Cache temizle: `ipconfig /flushdns` (Windows) veya `sudo systemd-resolve --flush-caches` (Linux)

### Cloudflare'de Domain Doğrulanmadı

**Kontrol:**

- Cloudflare dashboard'da "Pending Nameserver Update" yazıyor mu?

**Çözüm:**

- Nameserver'ların doğru girildiğini kontrol et
- DNS propagation'ı bekle
- Cloudflare'e "Recheck Now" tıkla

### Site Açılmıyor (Nameserver Değişti)

**Kontrol:**

```bash
# DNS çözümleniyor mu?
nslookup demirgayrimenkul.com.tr

# Sunucu erişilebilir mi?
ping COOLIFY_SUNUCU_IP
```

**Çözüm:**

- Cloudflare'de A record'ları kontrol et
- Coolify'da domain ayarlarını kontrol et
- Coolify'da deployment başarılı mı kontrol et

---

## 📞 Destek

### Cloudflare Destek

- **Docs:** https://developers.cloudflare.com/
- **Community:** https://community.cloudflare.com/
- **Status:** https://www.cloudflarestatus.com/

### DNS Araçları

- **DNS Checker:** https://www.whatsmydns.net/
- **DNS Propagation:** https://dnschecker.org/
- **Nameserver Lookup:** https://mxtoolbox.com/SuperTool.aspx

---

## 🎉 Başarılı Kurulum!

Nameserver değişikliği tamamlandıktan sonra:

- **HTTP:** http://demirgayrimenkul.com.tr
- **HTTPS:** https://demirgayrimenkul.com.tr (Cloudflare SSL)
- **WWW:** https://www.demirgayrimenkul.com.tr

---

## 🔐 Cloudflare Ek Özellikler

Kurulumdan sonra aktif edebilirsin:

### Güvenlik

- **Firewall Rules:** Belirli ülkelerden erişimi engelle
- **Rate Limiting:** DDoS koruması
- **Bot Fight Mode:** Bot trafiğini engelle

### Performans

- **Auto Minify:** CSS/JS/HTML minify
- **Brotli Compression:** Daha iyi sıkıştırma
- **Rocket Loader:** JavaScript optimize et

### Caching

- **Browser Cache TTL:** 4 saat
- **Always Online:** Site çökse bile cache'den servis et

---

**Hazırlayan:** Kiro AI Assistant  
**Domain:** demirgayrimenkul.com.tr  
**Çözüm:** Cloudflare DNS (Önerilen)  
**Tarih:** 2026-01-22
