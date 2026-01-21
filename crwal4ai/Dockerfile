FROM python:3.12-slim

# Çekirdek bağımlılıklar (Chrome için gerekli kütüphaneler + curl)
RUN apt-get update && apt-get install -y \
    wget gnupg unzip libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libasound2 \
    libpango-1.0-0 libcairo2 libxshmfence1 x11-utils xvfb curl \
    && rm -rf /var/lib/apt/lists/*

# Google Chrome Kurulumu (GPG anahtar yöntemi ile)
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Önce bağımlılıkları kuralım (Root seviyesindeki crawler motoru için)
COPY requirements.txt ./root_requirements.txt
RUN pip install --no-cache-dir -r root_requirements.txt

# Proje dosyalarını kopyala
COPY . .

# Admin panel dizinine geç ve oradaki bağımlılıkları kur
WORKDIR /app/admin_remix
RUN pip install --no-cache-dir -r requirements.txt

# .env dosyasını oluştur (eğer yoksa .env.example'dan)
RUN if [ ! -f .env ]; then \
        if [ -f .env.example ]; then \
            cp .env.example .env; \
            echo "✅ .env created from .env.example"; \
        else \
            echo "DATABASE_URL=postgres://postgres:518518Erkan@wgkosgwkg8o4wg4k8cgcw4og:5432/demir_db" > .env; \
            echo "✅ .env created with default DATABASE_URL"; \
        fi \
    fi

# Sanal Ekran (Headless Chrome alternatifi)
ENV DISPLAY=:99
ENV DATABASE_URL=postgres://postgres:518518Erkan@wgkosgwkg8o4wg4k8cgcw4og:5432/demir_db
EXPOSE 5001

# Sağlık Kontrolü (Health Check)
# Port 5001'in yanıt verip vermediğini kontrol eder
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5001/ || exit 1

# Başlatma Komutu: Xvfb başlat, beklet ve sonra Flask Admin Panel'i çalıştır
CMD ["sh", "-c", "Xvfb :99 -screen 0 1920x1080x24 & sleep 2; python app.py"]