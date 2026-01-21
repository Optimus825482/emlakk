# Crawler Sunucu Kurulum ve Sorun Giderme

## 🚨 Crawler Çalışmıyor - Sorun Giderme Adımları

### 1. Diagnostic Tool Çalıştır

Sunucuya SSH ile bağlan ve diagnostic tool'u çalıştır:

```bash
cd /path/to/crwal4ai/admin_remix
python diagnostic.py
```

Bu tool şunları kontrol eder:

- ✅ Python versiyonu
- ✅ Google Chrome kurulu mu
- ✅ Xvfb (virtual display) çalışıyor mu
- ✅ Python dependencies kurulu mu
- ✅ Database bağlantısı çalışıyor mu
- ✅ Dosya izinleri doğru mu
- ✅ Crawler script syntax hatası var mı

### 2. Logları Kontrol Et

Crawler çalıştırıldığında 2 log dosyası oluşur:

```bash
# STDOUT logu
cat /path/to/crwal4ai/admin_remix/crawler_debug.log

# STDERR logu (hatalar burada)
cat /path/to/crwal4ai/admin_remix/crawler_error.log
```

### 3. Manuel Test

Crawler'ı manuel olarak test et:

```bash
cd /path/to/crwal4ai/admin_remix
python sahibinden_uc_batch_supabase.py --categories konut_satilik --max-pages 1
```

Eğer hata alırsan, hatayı not al ve düzelt.

---

## 🔧 Yaygın Sorunlar ve Çözümleri

### Sorun 1: Chrome Bulunamadı

**Hata:**

```
selenium.common.exceptions.WebDriverException: Message: unknown error: cannot find Chrome binary
```

**Çözüm:**

```bash
# Chrome kur
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
apt-get update
apt-get install -y google-chrome-stable

# Kontrol et
google-chrome --version
```

### Sorun 2: Display Hatası

**Hata:**

```
selenium.common.exceptions.WebDriverException: Message: unknown error: Chrome failed to start: exited abnormally
```

**Çözüm:**

```bash
# Xvfb kur
apt-get install -y xvfb

# Xvfb başlat
Xvfb :99 -screen 0 1920x1080x24 &

# DISPLAY değişkenini ayarla
export DISPLAY=:99

# Kontrol et
echo $DISPLAY
ps aux | grep Xvfb
```

### Sorun 3: Database Bağlantı Hatası

**Hata:**

```
psycopg2.OperationalError: could not connect to server
```

**Çözüm:**

```bash
# .env dosyasını kontrol et
cat /path/to/crwal4ai/admin_remix/.env

# DATABASE_URL doğru mu?
# Doğru format:
# DATABASE_URL=postgres://postgres:518518Erkan@wgkosgwkg8o4wg4k8cgcw4og:5432/demir_db

# Database'e bağlanabilir misin?
psql "postgres://postgres:518518Erkan@wgkosgwkg8o4wg4k8cgcw4og:5432/demir_db" -c "SELECT 1"
```

### Sorun 4: Python Dependencies Eksik

**Hata:**

```
ModuleNotFoundError: No module named 'undetected_chromedriver'
```

**Çözüm:**

```bash
cd /path/to/crwal4ai/admin_remix
pip install -r requirements.txt

# Veya tek tek:
pip install undetected-chromedriver selenium beautifulsoup4 psycopg2-binary flask python-dotenv
```

### Sorun 5: Dosya İzin Hatası

**Hata:**

```
PermissionError: [Errno 13] Permission denied: '/app/admin_remix/uc_chrome_profile'
```

**Çözüm:**

```bash
# Crawler klasörüne yazma izni ver
chmod -R 755 /path/to/crwal4ai/admin_remix
chown -R www-data:www-data /path/to/crwal4ai/admin_remix

# Veya Docker içinde:
chmod -R 777 /app/admin_remix/uc_chrome_profile
```

---

## 🐳 Docker Container İçinde Sorun Giderme

### Container'a Gir

```bash
# Container ID'yi bul
docker ps

# Container'a gir
docker exec -it <container_id> bash
```

### Diagnostic Tool Çalıştır

```bash
cd /app/admin_remix
python diagnostic.py
```

### Logları İzle

```bash
# Flask app logu
docker logs -f <container_id>

# Crawler logu
docker exec -it <container_id> tail -f /app/admin_remix/crawler_debug.log
docker exec -it <container_id> tail -f /app/admin_remix/crawler_error.log
```

### Manuel Crawler Test

```bash
docker exec -it <container_id> bash
cd /app/admin_remix
export DISPLAY=:99
python sahibinden_uc_batch_supabase.py --categories konut_satilik --max-pages 1
```

---

## 📊 Mining Jobs Tablosunu Kontrol Et

Crawler job'ları `mining_jobs` tablosunda saklanır:

```sql
-- Son 10 job'u göster
SELECT
    id,
    job_type,
    status,
    created_at,
    error
FROM mining_jobs
ORDER BY created_at DESC
LIMIT 10;

-- Failed job'ların hatalarını göster
SELECT
    id,
    created_at,
    error
FROM mining_jobs
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 5;
```

---

## 🔄 Crawler'ı Yeniden Başlat

### Docker Container'ı Yeniden Başlat

```bash
# Container'ı durdur
docker stop <container_id>

# Container'ı başlat
docker start <container_id>

# Veya yeniden build et
cd /path/to/crwal4ai
docker build -t crawler-app .
docker run -d -p 5001:5001 --name crawler crawler-app
```

### Coolify'da Yeniden Deploy

1. Coolify dashboard'a git
2. Crawler service'i bul
3. "Redeploy" butonuna tıkla
4. Logları izle

---

## 📝 Önemli Notlar

1. **Xvfb Mutlaka Çalışmalı**: Headless Chrome için virtual display gerekli
2. **DISPLAY=:99**: Environment variable doğru ayarlanmalı
3. **Chrome Kurulu Olmalı**: google-chrome-stable paketi kurulu olmalı
4. **Database Bağlantısı**: Internal hostname kullan (wgkosgwkg8o4wg4k8cgcw4og:5432)
5. **Dosya İzinleri**: Chrome profile klasörüne yazma izni olmalı

---

## 🆘 Hala Çalışmıyor mu?

1. **Diagnostic tool çıktısını kaydet**:

   ```bash
   python diagnostic.py > diagnostic_output.txt
   ```

2. **Tüm logları topla**:

   ```bash
   cat crawler_debug.log > all_logs.txt
   cat crawler_error.log >> all_logs.txt
   docker logs <container_id> >> all_logs.txt
   ```

3. **Database job'larını kontrol et**:

   ```sql
   SELECT * FROM mining_jobs ORDER BY created_at DESC LIMIT 5;
   ```

4. **Bu bilgileri Erkan'a gönder** - sorun çözülür!

---

## ✅ Başarılı Kurulum Kontrolü

Crawler doğru çalışıyorsa:

1. ✅ `python diagnostic.py` tüm kontrolleri geçer
2. ✅ Manuel test başarılı olur
3. ✅ `mining_jobs` tablosunda `status='completed'` görünür
4. ✅ `collected_listings` tablosuna yeni ilanlar eklenir
5. ✅ Admin panelde "İşlem Günlüğü" sayfasında job görünür

---

**Son Güncelleme**: 21 Ocak 2026
**Yazar**: Kiro AI Assistant

---

## 🔥 CLOUDFLARE 403 SORUNU (GÜNCEL)

**Durum:** Sunucudan `curl` ile Sahibinden'e erişilemiyor (403 Forbidden)

```bash
curl -I https://www.sahibinden.com/satilik/sakarya-hendek
# HTTP/2 403
# server: cloudflare
```

**Neden:** Cloudflare, sunucu IP'sini bot olarak algılıyor.

**Çözüm:** Chrome browser ile **görsel olarak** (headless değil) erişmek gerekiyor. Xvfb ile virtual display kullanıyoruz.

### ✅ Yapılan İyileştirmeler (21 Ocak 2026)

1. **Chrome Options Optimize Edildi:**
   - Linux User-Agent (X11; Linux x86_64)
   - WebGL ve Canvas fingerprint eklendi
   - Gerçek browser profili (languages, preferences)
   - Automation flags tamamen gizlendi

2. **Cloudflare Challenge Detection:**
   - "Checking your browser" mesajı tespit ediliyor
   - Challenge çözülene kadar bekliyor (max 30 saniye)
   - 403 durumunda hemen durduruluyor

3. **Rate Limiter Yavaşlatıldı:**
   - Base delay: 4 saniye (Cloudflare için güvenli)
   - Min delay: 2.5 saniye
   - Requests/minute: 20 (çok yavaş ama güvenli)

4. **CDP Commands ile Stealth:**
   - `navigator.webdriver` undefined
   - `navigator.plugins` dolu array
   - `window.chrome` object eklendi

### 🧪 Test Adımları

```bash
# 1. Xvfb çalışıyor mu?
ps aux | grep Xvfb
# Çıktı: Xvfb :99 -screen 0 1920x1080x24

# 2. DISPLAY ayarlı mı?
echo $DISPLAY
# Çıktı: :99

# 3. Chrome başlıyor mu?
cd /app/admin_remix
python diagnostic.py
# ✅ Chrome found: /usr/bin/google-chrome
# ✅ Xvfb is running

# 4. Crawler test (1 sayfa)
python sahibinden_uc_batch_supabase.py --categories konut_satilik --max-pages 1

# Beklenen çıktı:
# 🚀 Chrome başlatılıyor...
# ✅ Chrome hazır!
# 🌐 https://www.sahibinden.com/satilik/sakarya-hendek...
# ⏳ Cloudflare challenge tespit edildi, bekleniyor...
# ✅ Cloudflare challenge çözüldü!
# ✅ 50 ilan işlendi, 5 yeni, 45 güncellendi
```

### 🚨 Hala Block Yiyorsa

**Seçenek 1: Daha Yavaş Crawl**

```python
# sahibinden_uc_batch_supabase.py - satır ~240
self.rate_limiter = AdaptiveRateLimiter(
    RateLimiterConfig(
        base_delay=8.0,  # 4 -> 8 saniye (ÇOK YAVAŞ)
        min_delay=5.0,   # 2.5 -> 5 saniye
        requests_per_minute=10,  # 20 -> 10 istek/dakika
    )
)
```

**Seçenek 2: Proxy Kullan**

```python
# sahibinden_uc_batch_supabase.py - _get_chrome_options() içinde
options.add_argument('--proxy-server=http://proxy-ip:port')
```

**Seçenek 3: Residential Proxy Servisi**

- Bright Data, Oxylabs, Smartproxy gibi servisler
- Türkiye IP'si kullan (Sahibinden Türkiye sitesi)

**Seçenek 4: VPN**

```bash
# Sunucuya VPN kur
apt install openvpn
# Türkiye sunucusuna bağlan
```

**Seçenek 5: Farklı Sunucu/IP**

- Hetzner yerine Türkiye'deki bir VPS kullan
- Cloudflare Türkiye IP'lerini daha az blokluyor
- Veya farklı bir Hetzner datacenter dene

### 📊 Crawler Performans Beklentileri

**Yavaş Mod (Güvenli):**

- 20 istek/dakika = 3 saniye/sayfa
- 100 sayfa = ~5 dakika
- 1000 ilan = ~10 dakika

**Normal Mod:**

- 30 istek/dakika = 2 saniye/sayfa
- 100 sayfa = ~3.5 dakika

**Turbo Mod (RİSKLİ - Block riski yüksek):**

- 60 istek/dakika = 1 saniye/sayfa
- 100 sayfa = ~2 dakika

### 🔍 Debug: Cloudflare Challenge Görme

Eğer challenge'ı görmek istersen:

```bash
# VNC server kur (opsiyonel)
apt install x11vnc
x11vnc -display :99 -forever -nopw -listen 0.0.0.0 -xkb

# Lokal bilgisayardan bağlan
# VNC Viewer: sunucu-ip:5900
# Chrome'un Cloudflare challenge'ı çözdüğünü görebilirsin
```

---
