#!/bin/bash

# Demir Gayrimenkul - Production Deployment with Persistent Uploads
# Bu script Coolify'da çalıştırılacak

set -e

echo "🚀 Demir Gayrimenkul Deployment Başlıyor..."

# 1. Host'ta uploads klasörünü oluştur
echo "📁 Host'ta /var/www/uploads klasörü oluşturuluyor..."
mkdir -p /var/www/uploads/listings
mkdir -p /var/www/uploads/founder
mkdir -p /var/www/uploads/hero
mkdir -p /var/www/uploads/content

# 2. Mevcut container'dan dosyaları kopyala (eğer varsa)
CONTAINER_ID=$(docker ps -q -f name=demir-nextjs)
if [ ! -z "$CONTAINER_ID" ]; then
    echo "📦 Mevcut container'dan dosyalar kopyalanıyor..."
    docker cp $CONTAINER_ID:/app/public/uploads/listings/. /var/www/uploads/listings/ 2>/dev/null || echo "⚠️  listings klasörü boş veya bulunamadı"
    docker cp $CONTAINER_ID:/app/public/uploads/founder/. /var/www/uploads/founder/ 2>/dev/null || echo "⚠️  founder klasörü boş veya bulunamadı"
    docker cp $CONTAINER_ID:/app/public/uploads/hero/. /var/www/uploads/hero/ 2>/dev/null || echo "⚠️  hero klasörü boş veya bulunamadı"
    docker cp $CONTAINER_ID:/app/public/uploads/content/. /var/www/uploads/content/ 2>/dev/null || echo "⚠️  content klasörü boş veya bulunamadı"
else
    echo "⚠️  Mevcut container bulunamadı, yeni deployment yapılıyor..."
fi

# 3. İzinleri ayarla (1000:1000 = Node.js user in container)
echo "🔐 Dosya izinleri ayarlanıyor..."
chown -R 1000:1000 /var/www/uploads
chmod -R 755 /var/www/uploads

# 4. Docker Compose ile deploy et
echo "🐳 Docker Compose ile deployment yapılıyor..."
docker-compose down 2>/dev/null || true
docker-compose up -d --build

# 5. Container'ın başlamasını bekle
echo "⏳ Container'ın başlaması bekleniyor..."
sleep 10

# 6. Health check
echo "🏥 Health check yapılıyor..."
CONTAINER_ID=$(docker ps -q -f name=demir-nextjs)
if [ ! -z "$CONTAINER_ID" ]; then
    echo "✅ Container başarıyla başlatıldı: $CONTAINER_ID"
    
    # Container içinde uploads klasörünü kontrol et
    echo "📂 Container içinde uploads klasörü kontrol ediliyor..."
    docker exec $CONTAINER_ID ls -la /app/public/uploads/
    
    # Dosya sayılarını göster
    LISTINGS_COUNT=$(docker exec $CONTAINER_ID find /app/public/uploads/listings -type f 2>/dev/null | wc -l)
    FOUNDER_COUNT=$(docker exec $CONTAINER_ID find /app/public/uploads/founder -type f 2>/dev/null | wc -l)
    echo "📊 Listings: $LISTINGS_COUNT dosya"
    echo "📊 Founder: $FOUNDER_COUNT dosya"
else
    echo "❌ Container başlatılamadı!"
    exit 1
fi

# 7. Logs göster
echo "📋 Son 20 satır log:"
docker logs --tail 20 $CONTAINER_ID

echo ""
echo "✅ Deployment tamamlandı!"
echo "🌐 URL: https://demirgayrimenkul.com.tr"
echo "📁 Uploads: /var/www/uploads (persistent)"
echo ""
echo "Test için:"
echo "curl -I https://demirgayrimenkul.com.tr/uploads/founder/1769101144364-98mri3.webp"
