# Cloudflare Bypass - İlk Çalıştırma Kılavuzu

## 🚨 KRİTİK: Headless Mode Sorunu

**SORUN:** Undetected-chromedriver headless mode'da Chrome'a bağlanamıyor:

```
❌ session not created: cannot connect to chrome at 127.0.0.1:xxxxx
```

**ÇÖZÜM:** Headless mode KULLANMA! Chrome penceresini açık tut.

```python
# ❌ YANLIŞ - Headless mode (çalışmaz)
options.add_argument("--headless=new")

# ✅ DOĞRU - Headful mode (çalışır)
# Headless argument ekleme!
```

## 🔧 Ek Gereksinimler

1. **Chrome Profile Temizliği:** İlk çalıştırmada profile temizle

```powershell
Remove-Item -Recurse -Force "D:\demir\yy\demir-gayrimenkul\crwal4ai\uc_chrome_profile"
```

2. **ChromeDriver Cache Temizliği:**

```powershell
Remove-Item -Recurse -Force "$env:APPDATA\undetected_chromedriver"
```

3. **Chrome Processleri Kapat:**

```powershell
Get-Process chrome,chromedriver -ErrorAction SilentlyContinue | Stop-Process -Force
```

---

## 🚨 Sorun (Eski - Çözüldü)

Crawler ilk çalıştırmada şu hatayı veriyor:

```
❌ Navigate hatası: 'NoneType' object has no attribute 'get'
🚫 Block algılandı! Backoff: 1, Yeni delay: 7.1s
```

## 🔍 Neden Oluyor?

Sahibinden.com, Cloudflare koruması kullanıyor. Undetected-chromedriver ilk çalıştırmada:

1. Chrome penceresi açar
2. Cloudflare challenge sayfası gösterir
3. **Manuel geçiş gerektirir** (checkbox tıklama veya CAPTCHA)
4. Geçtikten sonra cookie'leri kaydeder
5. Sonraki çalıştırmalarda otomatik bypass yapar

## ✅ Çözüm: Manuel İlk Geçiş

### Adım 1: Crawler'ı Tek Başına Çalıştır

Mining API yerine direkt Python script'i çalıştır:

```bash
cd D:\demir\yy\demir-gayrimenkul\crwal4ai
python sahibinden_uc_batch_supabase.py --categories konut_satilik --max-pages 1
```

### Adım 2: Chrome Penceresi Açılacak

- Otomatik olarak Chrome penceresi açılır
- Sahibinden.com'a gider
- Cloudflare challenge sayfası gösterir

### Adım 3: Manuel Geçiş

**Seçenek A: Checkbox (Kolay)**

- "I'm not a robot" checkbox'ını tıkla
- Birkaç saniye bekle
- Sayfa yüklenecek

**Seçenek B: CAPTCHA (Zor)**

- Resim seçme CAPTCHA'sı çıkarsa çöz
- Doğru resimleri seç
- "Verify" tıkla

### Adım 4: Başarı Kontrolü

Terminal'de şunu göreceksin:

```
✅ Supabase bağlantısı kuruldu
📥 1000 mevcut ID yüklendi
📂 Kategori: konut_satilik
📄 Sayfa 1 taranıyor...
✅ 20 ilan bulundu
```

### Adım 5: Mining API ile Test Et

Artık Mining API üzerinden çalışacak:

```bash
# Mining API'yi başlat
uvicorn mining_api:app --port 8765 --reload

# Admin panelden test et
http://localhost:3000/admin/veri-toplama
```

## 🔧 Alternatif: Headless Mode Devre Dışı

Eğer sürekli manuel geçiş yapmak istemiyorsan, headless mode'u kapat:

### `sahibinden_uc_batch_supabase.py` Düzenle

```python
# Satır ~150 civarı
def _init_driver(self):
    """Undetected Chrome driver başlat"""
    options = uc.ChromeOptions()

    # Headless mode'u kapat (manuel geçiş için)
    # options.add_argument("--headless=new")  # Bu satırı yorum yap

    options.add_argument("--disable-blink-features=AutomationControlled")
    # ...
```

Bu şekilde her çalıştırmada Chrome penceresi açılır ve manuel geçiş yapabilirsin.

## 📊 Rate Limiter Davranışı

Cloudflare block algılandığında:

- **Backoff Level:** 1 → 2 → 3 (her block'ta artar)
- **Delay:** 2s → 7s → 15s → 30s (exponential)
- **Success:** Delay azalır, backoff sıfırlanır

## 🎯 Production Çözümü

Production'da sürekli manuel geçiş yapılamaz. Alternatifler:

### 1. Proxy Rotation

```python
# Rotating proxy kullan
options.add_argument(f"--proxy-server={proxy_url}")
```

### 2. Residential Proxies

- Bright Data, Oxylabs gibi servisler
- Cloudflare bypass garantisi
- Aylık $50-200 arası

### 3. Selenium Stealth

```python
from selenium_stealth import stealth

stealth(driver,
    languages=["tr-TR", "tr"],
    vendor="Google Inc.",
    platform="Win32",
    webgl_vendor="Intel Inc.",
    renderer="Intel Iris OpenGL Engine",
    fix_hairline=True,
)
```

### 4. Browser Fingerprint Randomization

```python
# User-Agent rotation
user_agents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
]
options.add_argument(f"user-agent={random.choice(user_agents)}")
```

## 🐛 Debug: Cloudflare Bypass Kontrol

### Log Mesajları

```python
# Başarılı bypass
✅ Supabase bağlantısı kuruldu
📄 Sayfa 1 taranıyor...
✅ 20 ilan bulundu

# Başarısız bypass
❌ Navigate hatası: 'NoneType' object has no attribute 'get'
🚫 Block algılandı! Backoff: 1, Yeni delay: 7.1s
❌ Sayfa yüklenemedi
```

### Manuel Test

```python
# Python console'da test et
from sahibinden_uc_batch_supabase import SahibindenSupabaseCrawler

crawler = SahibindenSupabaseCrawler()
html = crawler.navigate("https://www.sahibinden.com/satilik/sakarya-hendek")

if html:
    print("✅ Bypass başarılı!")
else:
    print("❌ Bypass başarısız!")
```

## 📝 Özet

1. **İlk çalıştırma:** Manuel Cloudflare geçişi gerekli
2. **Sonraki çalıştırmalar:** Cookie'ler sayesinde otomatik
3. **Production:** Proxy rotation veya residential proxy kullan
4. **Debug:** Log mesajlarını takip et

## 🔗 Kaynaklar

- [Undetected ChromeDriver](https://github.com/ultrafunkamsterdam/undetected-chromedriver)
- [Selenium Stealth](https://github.com/diprajpatra/selenium-stealth)
- [Cloudflare Bypass Techniques](https://www.zenrows.com/blog/bypass-cloudflare)
