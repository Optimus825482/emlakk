#!/bin/bash
# Xvfb Virtual Display başlat
# Bu sayede headless=False ile çalışırken gerçek bir ekran simüle edilir

echo "🖥️ Xvfb (Virtual Display) başlatılıyor..."
Xvfb :99 -screen 0 1920x1080x24 &
export DISPLAY=:99

echo "✅ Virtual Display hazır: $DISPLAY"
echo "🚀 Crawler başlatılıyor..."

# Ana komutu çalıştır
exec "$@"
