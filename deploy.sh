#!/bin/bash

# Demir Gayrimenkul - Deployment Script
# Kullanım: ./deploy.sh [start|stop|restart|logs|build]

set -e

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Banner
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════╗"
echo "║   Demir Gayrimenkul Deployment       ║"
echo "╚═══════════════════════════════════════╝"
echo -e "${NC}"

# Komut kontrolü
COMMAND=${1:-start}

case $COMMAND in
    start)
        echo -e "${YELLOW}🚀 Servisleri başlatıyorum...${NC}"
        docker-compose up -d
        echo -e "${GREEN}✅ Servisler başlatıldı!${NC}"
        echo ""
        echo "📍 Next.js: http://localhost:3000"
        echo "📍 Admin Panel: http://localhost:5001"
        echo "📍 Nginx: http://localhost"
        echo ""
        echo "Logları görmek için: ./deploy.sh logs"
        ;;
    
    stop)
        echo -e "${YELLOW}🛑 Servisleri durduruyor...${NC}"
        docker-compose down
        echo -e "${GREEN}✅ Servisler durduruldu!${NC}"
        ;;
    
    restart)
        echo -e "${YELLOW}🔄 Servisleri yeniden başlatıyorum...${NC}"
        docker-compose restart
        echo -e "${GREEN}✅ Servisler yeniden başlatıldı!${NC}"
        ;;
    
    logs)
        SERVICE=${2:-}
        if [ -z "$SERVICE" ]; then
            echo -e "${YELLOW}📋 Tüm servis logları:${NC}"
            docker-compose logs -f
        else
            echo -e "${YELLOW}📋 $SERVICE logları:${NC}"
            docker-compose logs -f $SERVICE
        fi
        ;;
    
    build)
        echo -e "${YELLOW}🔨 Servisleri yeniden build ediyorum...${NC}"
        docker-compose build --no-cache
        echo -e "${GREEN}✅ Build tamamlandı!${NC}"
        ;;
    
    status)
        echo -e "${YELLOW}📊 Servis durumları:${NC}"
        docker-compose ps
        ;;
    
    clean)
        echo -e "${RED}🗑️  Tüm container'ları ve volume'ları siliyorum...${NC}"
        read -p "Emin misiniz? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose down -v
            echo -e "${GREEN}✅ Temizlendi!${NC}"
        else
            echo -e "${YELLOW}İptal edildi.${NC}"
        fi
        ;;
    
    migrate)
        echo -e "${YELLOW}🗄️  Database migration çalıştırıyorum...${NC}"
        docker-compose exec nextjs yarn drizzle-kit push
        echo -e "${GREEN}✅ Migration tamamlandı!${NC}"
        ;;
    
    shell)
        SERVICE=${2:-nextjs}
        echo -e "${YELLOW}🐚 $SERVICE shell'e bağlanıyorum...${NC}"
        docker-compose exec $SERVICE sh
        ;;
    
    *)
        echo -e "${RED}❌ Geçersiz komut: $COMMAND${NC}"
        echo ""
        echo "Kullanım: ./deploy.sh [KOMUT]"
        echo ""
        echo "Komutlar:"
        echo "  start     - Servisleri başlat"
        echo "  stop      - Servisleri durdur"
        echo "  restart   - Servisleri yeniden başlat"
        echo "  logs      - Logları göster (opsiyonel: servis adı)"
        echo "  build     - Servisleri yeniden build et"
        echo "  status    - Servis durumlarını göster"
        echo "  clean     - Tüm container ve volume'ları sil"
        echo "  migrate   - Database migration çalıştır"
        echo "  shell     - Servis shell'ine bağlan (opsiyonel: servis adı)"
        echo ""
        echo "Örnekler:"
        echo "  ./deploy.sh start"
        echo "  ./deploy.sh logs nextjs"
        echo "  ./deploy.sh shell postgres"
        exit 1
        ;;
esac
