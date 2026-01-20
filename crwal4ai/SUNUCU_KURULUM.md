# Sahibinden Crawler - Sunucu Kurulumu

## ⚠️ Önemli Not: Headless Mode

Sahibinden.com Cloudflare koruması **headless modda çalışmıyor**. Sunucu ortamında çalıştırmak için **Xvfb (Virtual Display)** kullanılmalı.

## Seçenek 1: Docker ile Kurulum (Önerilen)

```bash
cd crwal4ai

# Docker image oluştur
docker build -t sahibinden-crawler .

# Çalıştır
docker run -v $(pwd)/output:/app/output sahibinden-crawler
```

## Seçenek 2: Linux Sunucuda Manuel Kurulum

### 1. Xvfb Kurulumu

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y xvfb

# CentOS/RHEL
sudo yum install -y xorg-x11-server-Xvfb
```

### 2. Python Bağımlılıkları

```bash
pip install crawl4ai[all] beautifulsoup4
crawl4ai-setup
```

### 3. Xvfb ile Çalıştırma

```bash
# Virtual display başlat
Xvfb :99 -screen 0 1920x1080x24 &
export DISPLAY=:99

# Crawler'ı çalıştır
python sahibinden_crawl4ai.py
```

### 4. Tek Komutla Çalıştırma

```bash
xvfb-run -a python sahibinden_crawl4ai.py
```

## Seçenek 3: Cron Job ile Otomatik Çalıştırma

```bash
# Crontab düzenle
crontab -e

# Her gün saat 06:00'da çalıştır
0 6 * * * cd /path/to/crwal4ai && xvfb-run -a python sahibinden_crawl4ai.py >> /var/log/sahibinden-crawler.log 2>&1
```

## Seçenek 4: Systemd Service

```bash
# /etc/systemd/system/sahibinden-crawler.service
[Unit]
Description=Sahibinden Crawler
After=network.target

[Service]
Type=oneshot
User=crawler
WorkingDirectory=/path/to/crwal4ai
Environment=DISPLAY=:99
ExecStartPre=/usr/bin/Xvfb :99 -screen 0 1920x1080x24
ExecStart=/usr/bin/python3 sahibinden_crawl4ai.py
StandardOutput=append:/var/log/sahibinden-crawler.log
StandardError=append:/var/log/sahibinden-crawler.log

[Install]
WantedBy=multi-user.target
```

## Alternatif: Residential Proxy

Eğer Xvfb çözümü yeterli olmazsa, residential proxy servisleri kullanılabilir:

1. **BrightData** - https://brightdata.com
2. **Oxylabs** - https://oxylabs.io
3. **Smartproxy** - https://smartproxy.com

Bu servisler Cloudflare bypass için özel çözümler sunuyor.

## Çıktı Dosyaları

- `sahibinden_crawl4ai_liste.json` - İlan listesi
- `sahibinden_crawl4ai_detay.json` - İlan detayları

## Sorun Giderme

### "0 ilan bulundu" Hatası

- Cloudflare bypass başarısız olmuş olabilir
- Xvfb'nin düzgün çalıştığından emin olun: `echo $DISPLAY`
- Browser'ın yüklendiğinden emin olun: `crawl4ai-setup`

### Timeout Hataları

- `page_timeout` değerini artırın (varsayılan: 60000ms)
- İnternet bağlantısını kontrol edin

### Memory Hataları

- Docker'da memory limit artırın
- `--shm-size=2g` parametresi ekleyin
