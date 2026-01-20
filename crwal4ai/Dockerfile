FROM python:3.12-slim

# Çekirdek bağımlılıklar (Chrome için gerekli kütüphaneler)
RUN apt-get update && apt-get install -y \
    wget gnupg unzip libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libasound2 \
    libpango-1.0-0 libcairo2 libxshmfence1 x11-utils xvfb \
    && rm -rf /var/lib/apt/lists/*

# Google Chrome Kurulumu
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Sanal Ekran (Headless Chrome alternatifi)
ENV DISPLAY=:99
EXPOSE 8765

# Başlatma Komutu
CMD Xvfb :99 -screen 0 1920x1080x24 & uvicorn mining_api:app --host 0.0.0.0 --port 8765
