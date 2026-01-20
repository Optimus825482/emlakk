# 🛠️ Hetzner CX32 (Ubuntu) - Sunucu Kurulum ve Canlıya Alma Rehberi

Hayırlı olsun Erkan! CX32 (8GB RAM) canavar gibi bir seçim. Şimdi bu sunucuyu bir "Scraping & Web" istasyonuna çevireceğiz. Adım adım gidelim:

## 1. Sunucuya İlk Bağlantı (SSH)

Hetzner sana bir IP adresi ve bir şifre (veya SSH Key kullandıysan anahtar) vermiş olmalı. Terminalini (veya PowerShell'i) aç ve bağlan:

```bash
ssh root@SUNUCU_IP_ADRESIN
```

## 2. Sistemi Güncelle ve Temel Araçları Kur

```bash
apt update && apt upgrade -y
apt install -y git curl wget build-essential python3-venv python3-pip zip unzip
```

## 3. Crawler İçin Kritik Gereksinimler (Chrome & Xvfb)

Sahibinden'i taramak için bir tarayıcıya ve sunucuda ekran olmadığı için bir "sanal ekrana" ihtiyacımız var.

```bash
# Bağımlılıkları kur
apt install -y libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 \
libxcomposite1 libxdamage1 libxrandr2 libgbm1 libasound2 libpango-1.0-0 libcairo2 \
libxshmfence1 x11-utils xvfb

# Google Chrome Kurulumu (Latest Stable)
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
apt install ./google-chrome-stable_current_amd64.deb -y
```

## 4. PM2 Kurulumu (Uygulamaları 7/24 Çalıştırmak İçin)

Uygulamanın terminali kapattığında durmaması için PM2 kullanacağız.

```bash
# Node.js (LTS) Kurulumu
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# PM2 Global kurulum
npm install pm2 -g
```

## 5. Proje Dosyalarını Sunucuya Atma

En kolay yol Git kullanmaktır. (Eğer repo özel ise bir PAT -Personal Access Token- oluşturman gerekebilir).

```bash
cd /root
git clone https://github.com/KULLANICI_ADI/PROJE_ADI.git
cd PROJE_ADI
```

## 6. Mining API (Python) Kurulumu

```bash
cd crwal4ai
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Crawler-setup (Chromedriver indirmesi için)
python3 -c "import undetected_chromedriver as uc; uc.Chrome()" # Test için bir kez çalıştır
```

## 7. Next.js Uygulaması Kurulumu

```bash
cd .. # Proje kök dizinine dön
npm install
# Environment dosyasını oluştur (Önemli!)
cp .env.example .env
nano .env # SUPABASE_URL, KEY vb. buraya yapıştır
npm run build
```

## 8. Uygulamaları Başlatma

Aşağıdaki komutlarla iki servisi de PM2'ye emanet edeceğiz:

### Mining API Başlat (Xvfb ile):

```bash
cd crwal4ai
pm2 start "xvfb-run -a venv/bin/uvicorn mining_api:app --host 0.0.0.0 --port 8765" --name "mining-api"
```

### Next.js Başlat:

```bash
cd ..
pm2 start "npm run start" --name "nextds-app"
```

## 9. Güvenlik (Firewall)

Sunucuya sadece gerekli portlardan erişim izni verelim:

```bash
ufw allow 22       # SSH
ufw allow 3000     # Next.js
ufw allow 8765     # Mining API
ufw allow 80       # HTTP
ufw allow 443      # HTTPS
ufw enable
```

---

## 🎯 Sonraki Adımlar

1.  **Mining API Test**: Tarayıcından `http://SUNUCU_IP:8765/health` adresine git. "healthy" yazısını görmelisin.
2.  **Next.js Test**: `http://SUNUCU_IP:3000` adresine git.
3.  **SSL (HTTPS)**: Eğer bir domainin varsa (erkanemlak.com gibi), sunucuya **Nginx** ve **Certbot** kurarak profesyonel bir görünüme kavuşturabiliriz.

**Nasıl gidiyor?** SSH ile bağlanabildin mi? Takıldığın bir adım olursa direkt buradayım.



Access Key

CW49V92ZNVI5AKK5V04R

Secret Key

k7f55q850iQmjlfjRXa5h8Cumh0bU9SpSdTp0R0d

# API token

7uzHDNipcLoAIrszXplNVpL76VG3AOiYL2WnvQ69omXXaJtraTtNVkxB8uo90zLf
