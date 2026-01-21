# Local'de (Windows) Crawler Çalıştırma

## Neden Local'de Çalıştırmalıyım?

**Sorun:** Sunucuda Cloudflare challenge çözülmüyor (datacenter IP'si bot olarak algılanıyor)

**Çözüm:** Local'den (ev IP'si) çalıştır - Cloudflare ev IP'sine güveniyor!

**Avantajlar:**

- ✅ Cloudflare bypass çalışıyor
- ✅ Proxy'ye gerek yok (ücretsiz)
- ✅ Hızlı test ve debug
- ✅ Chrome görsel olarak açılıyor (debug için ideal)

**Dezavantajlar:**

- ❌ Manuel çalıştırma gerekiyor
- ❌ Bilgisayar açık olmalı
- ❌ Otomatik cron job yok

---

## 🚀 Hızlı Başlangıç (3 Adım)

### 1. Gerekli Paketleri Yükle

```bash
cd yy/demir-gayrimenkul/crwal4ai/admin_remix
pip install -r requirements.txt
```

**Gerekli Paketler:**

- undetected-chromedriver
- selenium
- beautifulsoup4
- psycopg2
- python-dotenv
- flask

### 2. Database Bağlantısını Test Et

`.env.local` dosyası zaten hazır:

```
DATABASE_URL=postgres://postgres:518518Erkan@77.42.68.4:5432/demir_db
```

Test et:

```bash
python -c "from db_manager import db; print('✅ Database bağlantısı OK' if db._pool else '❌ Bağlantı hatası')"
```

### 3. Crawler'ı Çalıştır

**Kolay Yol (Batch Script):**

```bash
run_local.bat
```

**Manuel Yol:**

```bash
# .env.local'i aktif et
copy .env.local .env

# Crawler'ı çalıştır
python sahibinden_crawler.py --categories konut_satilik --max-pages 5
```

---

## 📊 Kullanım Örnekleri

### Tek Kategori (Hızlı Test)

```bash
python sahibinden_crawler.py --categories konut_satilik --max-pages 1
```

### Birden Fazla Kategori

```bash
python sahibinden_crawler.py --categories konut_satilik,arsa_satilik --max-pages 5
```

### Tüm Kategoriler (Uzun Sürer)

```bash
python sahibinden_crawler.py --max-pages 20
```

### Sync Modu (Kaldırılan İlanları Tespit Et)

```bash
python sahibinden_crawler.py --categories konut_satilik --max-pages 999 --sync
```

---

## 🔍 Beklenen Çıktı

**Başarılı Çalışma:**

```
2026-01-21 08:22:19,326 - INFO - ✅ Postgres (via db_manager) bağlantısı kuruldu
2026-01-21 08:22:19,326 - INFO - 📥 1000 mevcut ID yüklendi
2026-01-21 08:22:19,326 - INFO - 🚀 Chrome başlatılıyor...
2026-01-21 08:22:19,326 - INFO - 📍 Platform: Windows
2026-01-21 08:22:19,326 - INFO - ✅ Chrome hazır!
2026-01-21 08:22:32,863 - INFO - 📊 Toplam ilan sayısı: 625
2026-01-21 08:22:33,070 - INFO - ✅ 51 ilan işlendi, 47 yeni, 4 güncellendi
```

**Cloudflare Challenge (Nadiren):**

```
2026-01-21 08:22:19,226 - INFO - ⏳ Cloudflare challenge tespit edildi, bekleniyor...
2026-01-21 08:22:25,000 - INFO - ✅ Cloudflare challenge çözüldü!
```

---

## ⚙️ Ayarlar

### Rate Limiter (Hız Ayarı)

`sahibinden_crawler.py` - satır ~240:

**Yavaş Mod (Güvenli):**

```python
base_delay=4.0,  # 4 saniye/sayfa
requests_per_minute=20,  # 20 istek/dakika
```

**Hızlı Mod (Local için ideal):**

```python
base_delay=2.0,  # 2 saniye/sayfa
requests_per_minute=40,  # 40 istek/dakika
```

**Turbo Mod (Riskli):**

```python
base_delay=1.0,  # 1 saniye/sayfa
requests_per_minute=60,  # 60 istek/dakika
```

### Chrome Ayarları

Eğer Chrome açılmıyorsa, path'i kontrol et:

`sahibinden_crawler.py` - satır ~620:

```python
if is_windows:
    chromium_path = r"C:\Users\erkan\undetected-chromium\chromium\chrome-win\chrome.exe"
    chromedriver_path = r"C:\Users\erkan\chromedriver\win64-146.0.7643.0\chromedriver-win64\chromedriver.exe"
```

---

## 🐛 Sorun Giderme

### Sorun 1: Database Bağlantı Hatası

**Hata:**

```
❌ Database connection pool error: could not translate host name
```

**Çözüm:**

```bash
# .env.local dosyasını kontrol et
type .env.local

# DATABASE_URL doğru mu?
# postgres://postgres:518518Erkan@77.42.68.4:5432/demir_db

# Sunucu erişilebilir mi?
ping 77.42.68.4

# Port açık mı?
telnet 77.42.68.4 5432
```

### Sorun 2: Chrome Başlamıyor

**Hata:**

```
❌ Chrome başlatma hatası: [Errno 2] No such file or directory
```

**Çözüm:**

```bash
# Chrome path'ini kontrol et
dir "C:\Users\erkan\undetected-chromium\chromium\chrome-win\chrome.exe"

# Yoksa, path'i güncelle (sahibinden_crawler.py - satır 620)
```

### Sorun 3: Paket Eksik

**Hata:**

```
ModuleNotFoundError: No module named 'undetected_chromedriver'
```

**Çözüm:**

```bash
pip install -r requirements.txt

# Veya tek tek:
pip install undetected-chromedriver selenium beautifulsoup4 psycopg2 python-dotenv flask
```

### Sorun 4: Cloudflare Block (Nadiren)

**Hata:**

```
❌ Cloudflare challenge çözülemedi! Timeout (90s)
```

**Çözüm:**

```bash
# Rate limiter'ı yavaşlat (base_delay: 2 -> 4)
# Veya birkaç dakika bekle ve tekrar dene
# Local'de nadiren olur (ev IP'si güvenilir)
```

---

## 📈 Performans

**Local (Windows - Ev IP'si):**

- 1 sayfa: ~5 saniye
- 100 ilan: ~10 saniye
- 625 ilan (13 sayfa): ~1 dakika

**Sunucu (Hetzner - Datacenter IP):**

- Cloudflare challenge çözülmüyor ❌
- Proxy gerekli ($75/ay)

---

## 🔄 Otomatik Çalıştırma (Opsiyonel)

Windows Task Scheduler ile otomatik çalıştır:

1. **Task Scheduler** aç
2. **Create Basic Task** → "Crawler Daily"
3. **Trigger:** Daily, 03:00 AM
4. **Action:** Start a program
   - Program: `C:\Python313\python.exe`
   - Arguments: `sahibinden_crawler.py --max-pages 20`
   - Start in: `D:\demir\yy\demir-gayrimenkul\crwal4ai\admin_remix`
5. **Finish**

---

## 📊 Sonuçları Görüntüleme

### Admin Panel (Local)

```bash
# Admin panel'i başlat
python app.py

# Tarayıcıda aç
http://localhost:5000
```

### Database (pgAdmin)

```
Host: 77.42.68.4
Port: 5432
Database: demir_db
Username: postgres
Password: 518518Erkan

# Sorgu:
SELECT COUNT(*) FROM sahibinden_liste WHERE category = 'konut';
```

### Public Site

```
https://demir-gayrimenkul.vercel.app/ilanlar
```

---

## 💡 İpuçları

1. **İlk Çalıştırma:** 1 sayfa ile test et (`--max-pages 1`)
2. **Hız:** Local'de hızlı çalışır, rate limiter'ı artırabilirsin
3. **Sync:** Haftada 1 kez `--sync` ile kaldırılan ilanları temizle
4. **Backup:** Crawler çalıştırmadan önce database backup al
5. **Log:** `crawler_debug.log` dosyasını kontrol et

---

## 🎯 Özet

**Local'de çalıştırmak için:**

1. `pip install -r requirements.txt`
2. `run_local.bat` çalıştır
3. Sonuçları admin panel'den gör

**Avantajlar:** Ücretsiz, hızlı, Cloudflare bypass çalışıyor

**Dezavantajlar:** Manuel çalıştırma, bilgisayar açık olmalı

**Uzun Vadeli Çözüm:** Proxy al ($75/ay) ve sunucuda otomatik çalıştır

