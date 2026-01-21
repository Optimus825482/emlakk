# Crawler Proxy Kurulumu

## Sorun

Cloudflare, Hetzner sunucu IP'sini bot olarak algılıyor ve challenge'ı çözdürmüyor:

- Sayfa başlığı: "Bir dakika lütfen..."
- 90 saniye bekliyor ama challenge hiç çözülmüyor
- searchResultsTable hiç yüklenmiyor

## Çözüm: Residential Proxy

### Önerilen Servisler

1. **Bright Data (eski Luminati)** - En güvenilir
   - https://brightdata.com/
   - Türkiye residential proxy
   - ~$500/ay (10GB)

2. **Smartproxy**
   - https://smartproxy.com/
   - Türkiye residential proxy
   - ~$75/ay (5GB)

3. **Oxylabs**
   - https://oxylabs.io/
   - Türkiye residential proxy
   - ~$300/ay (10GB)

### Kurulum

1. **Proxy Bilgilerini Al:**

```
Proxy Host: proxy.example.com
Proxy Port: 8080
Username: your_username
Password: your_password
```

2. **sahibinden_uc_batch_supabase.py Güncelle:**

```python
def _get_chrome_options(self):
    """Chrome ayarları - Proxy ile"""

    # PROXY AYARLARI (Buraya kendi bilgilerini gir)
    PROXY_HOST = "proxy.smartproxy.com"  # Örnek
    PROXY_PORT = "10000"
    PROXY_USER = "your_username"
    PROXY_PASS = "your_password"

    user_agent = (
        "Mozilla/5.0 (X11; Linux x86_64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36"
    )

    options = uc.ChromeOptions()

    # Proxy ayarı
    proxy_string = f"{PROXY_USER}:{PROXY_PASS}@{PROXY_HOST}:{PROXY_PORT}"
    options.add_argument(f'--proxy-server=http://{proxy_string}')

    # Diğer ayarlar...
    options.add_argument(f"user-agent={user_agent}")
    # ... (geri kalan ayarlar aynı)

    return options
```

3. **Test Et:**

```bash
cd /app/admin_remix
python sahibinden_uc_batch_supabase.py --categories konut_satilik --max-pages 1

# Beklenen:
# ✅ Chrome hazır!
# 📄 Sayfa başlığı: Emlak İlanları sahibinden.com'da
# ✅ Sayfa içeriği yüklendi
# ✅ 50 ilan işlendi
```

---

## 2️⃣ ALTERNATİF: VPN Kullan

Sunucuya VPN kur ve Türkiye IP'si al:

```bash
# OpenVPN kur
apt install openvpn

# VPN config dosyasını yükle (VPN sağlayıcıdan al)
openvpn --config turkey.ovpn

# Test et
curl https://ipinfo.io/ip
# Türkiye IP'si görmeli
```

---

## 3️⃣ ALTERNATİF: Farklı Sunucu

Hetzner yerine Türkiye'deki bir VPS kullan:

- DigitalOcean Istanbul datacenter
- Linode Frankfurt (Türkiye'ye yakın)
- Türk VPS sağlayıcıları (Turhost, Natro, vs.)

Cloudflare, Türkiye IP'lerini daha az blokluyor.

---

## 4️⃣ GEÇİCİ ÇÖZÜM: Manuel Test

Eğer proxy alamıyorsan, local bilgisayarından (Windows) crawler'ı çalıştır:

```bash
# Local'de (Windows)
cd yy/demir-gayrimenkul/crwal4ai/admin_remix
python sahibinden_uc_batch_supabase.py --categories konut_satilik --max-pages 5

# Çalışıyor! (Ev IP'si Cloudflare'e güvenilir)
```

Sonra verileri manuel olarak sunucuya aktar.

---

## Tavsiye

**En iyi çözüm:** Smartproxy veya Bright Data residential proxy kullan.

- Güvenilir
- Türkiye IP'si
- Cloudflare bypass garantili
- Aylık ~$75-500 (kullanıma göre)

**Geçici çözüm:** Local'den çalıştır, verileri manuel aktar.

**Uzun vadeli:** Farklı sunucu/datacenter dene.
