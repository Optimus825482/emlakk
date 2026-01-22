#!/bin/bash

# ============================================
# Demir Gayrimenkul - Domain Deployment Script
# Domain: demirgayrimenkul.com.tr
# ============================================

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/var/www/demir-gayrimenkul"
DOMAIN="demirgayrimenkul.com.tr"
WWW_DOMAIN="www.demirgayrimenkul.com.tr"
NGINX_CONFIG="/etc/nginx/sites-available/demirgayrimenkul"
PM2_APP_NAME="demir-next"

# Functions
print_header() {
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then 
        print_error "Bu script root olarak çalıştırılmalıdır"
        exit 1
    fi
}

check_dns() {
    print_header "DNS Kontrolü"
    
    if nslookup $DOMAIN > /dev/null 2>&1; then
        print_success "DNS kaydı bulundu: $DOMAIN"
    else
        print_warning "DNS kaydı bulunamadı: $DOMAIN"
        print_info "DNS propagation 24-48 saat sürebilir"
    fi
}

install_dependencies() {
    print_header "Bağımlılıkları Kurma"
    
    # Node.js
    if ! command -v node &> /dev/null; then
        print_info "Node.js kuruluyor..."
        curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
        apt install -y nodejs
        print_success "Node.js kuruldu"
    else
        print_success "Node.js zaten kurulu: $(node --version)"
    fi
    
    # Yarn
    if ! command -v yarn &> /dev/null; then
        print_info "Yarn kuruluyor..."
        corepack enable
        corepack prepare yarn@stable --activate
        print_success "Yarn kuruldu"
    else
        print_success "Yarn zaten kurulu: $(yarn --version)"
    fi
    
    # PostgreSQL Client (sadece client, server değil!)
    if ! command -v psql &> /dev/null; then
        print_info "PostgreSQL client kuruluyor..."
        apt install -y postgresql-client
        print_success "PostgreSQL client kuruldu"
    else
        print_success "PostgreSQL client zaten kurulu"
    fi
    
    # Nginx
    if ! command -v nginx &> /dev/null; then
        print_info "Nginx kuruluyor..."
        apt install -y nginx
        systemctl enable nginx
        print_success "Nginx kuruldu"
    else
        print_success "Nginx zaten kurulu"
    fi
    
    # PM2
    if ! command -v pm2 &> /dev/null; then
        print_info "PM2 kuruluyor..."
        npm install -g pm2
        print_success "PM2 kuruldu"
    else
        print_success "PM2 zaten kurulu"
    fi
    
    # Certbot
    if ! command -v certbot &> /dev/null; then
        print_info "Certbot kuruluyor..."
        apt install -y certbot python3-certbot-nginx
        print_success "Certbot kuruldu"
    else
        print_success "Certbot zaten kurulu"
    fi
}

setup_database() {
    print_header "Database Bağlantı Kontrolü"
    
    print_info "Mevcut veritabanına bağlantı test ediliyor..."
    
    # Test database connection
    if PGPASSWORD='518518Erkan' psql -h wgkosgwkg8o4wg4k8cgcw4og -U postgres -d demir_db -c '\q' 2>/dev/null; then
        print_success "Database bağlantısı başarılı: demir_db"
    else
        print_error "Database bağlantısı başarısız!"
        print_info "Bağlantı bilgileri:"
        print_info "  Host: wgkosgwkg8o4wg4k8cgcw4og"
        print_info "  Database: demir_db"
        print_info "  User: postgres"
        print_warning "Lütfen database sunucusunun çalıştığından ve erişilebilir olduğundan emin olun"
        exit 1
    fi
}

build_project() {
    print_header "Proje Build"
    
    cd $PROJECT_DIR
    
    print_info "Dependencies yükleniyor..."
    yarn install
    print_success "Dependencies yüklendi"
    
    print_info "Database migration çalıştırılıyor..."
    yarn drizzle-kit push
    print_success "Migration tamamlandı"
    
    print_info "Production build yapılıyor..."
    yarn build
    print_success "Build tamamlandı"
}

setup_pm2() {
    print_header "PM2 Kurulumu"
    
    # Check if PM2 app is running
    if pm2 list | grep -q $PM2_APP_NAME; then
        print_info "PM2 app yeniden başlatılıyor..."
        pm2 restart $PM2_APP_NAME
    else
        print_info "PM2 app başlatılıyor..."
        cd $PROJECT_DIR
        pm2 start yarn --name $PM2_APP_NAME -- start
        pm2 save
    fi
    
    # Setup startup script
    pm2 startup systemd -u root --hp /root
    
    print_success "PM2 kurulumu tamamlandı"
}

setup_nginx() {
    print_header "Nginx Kurulumu"
    
    # Copy nginx config
    print_info "Nginx config kopyalanıyor..."
    cp $PROJECT_DIR/nginx-production.conf $NGINX_CONFIG
    
    # Create symlink
    if [ ! -L /etc/nginx/sites-enabled/demirgayrimenkul ]; then
        ln -s $NGINX_CONFIG /etc/nginx/sites-enabled/demirgayrimenkul
    fi
    
    # Remove default site
    if [ -L /etc/nginx/sites-enabled/default ]; then
        rm /etc/nginx/sites-enabled/default
    fi
    
    # Test nginx config
    print_info "Nginx config test ediliyor..."
    nginx -t
    
    # Restart nginx
    print_info "Nginx yeniden başlatılıyor..."
    systemctl restart nginx
    
    print_success "Nginx kurulumu tamamlandı"
}

setup_ssl() {
    print_header "SSL Sertifikası Kurulumu"
    
    print_warning "SSL sertifikası almak için DNS'in yayılmış olması gerekir"
    read -p "SSL kurulumuna devam etmek istiyor musunuz? (y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "SSL sertifikası alınıyor..."
        certbot --nginx -d $DOMAIN -d $WWW_DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
        
        if [ $? -eq 0 ]; then
            print_success "SSL sertifikası başarıyla kuruldu"
            
            # Test auto-renewal
            print_info "Otomatik yenileme test ediliyor..."
            certbot renew --dry-run
            print_success "Otomatik yenileme ayarlandı"
        else
            print_error "SSL sertifikası alınamadı"
            print_info "DNS'in yayılmasını bekleyin ve sonra şu komutu çalıştırın:"
            print_info "sudo certbot --nginx -d $DOMAIN -d $WWW_DOMAIN"
        fi
    else
        print_info "SSL kurulumu atlandı"
        print_info "Daha sonra şu komutu çalıştırabilirsiniz:"
        print_info "sudo certbot --nginx -d $DOMAIN -d $WWW_DOMAIN"
    fi
}

setup_firewall() {
    print_header "Firewall Kurulumu"
    
    if ! command -v ufw &> /dev/null; then
        apt install -y ufw
    fi
    
    print_info "Firewall kuralları ayarlanıyor..."
    ufw allow 22/tcp   # SSH
    ufw allow 80/tcp   # HTTP
    ufw allow 443/tcp  # HTTPS
    
    # Enable firewall
    print_warning "Firewall aktifleştirilecek. SSH bağlantınızın kesilmediğinden emin olun!"
    read -p "Devam etmek istiyor musunuz? (y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ufw --force enable
        print_success "Firewall aktifleştirildi"
    else
        print_info "Firewall kurulumu atlandı"
    fi
}

show_status() {
    print_header "Sistem Durumu"
    
    echo -e "${BLUE}PM2 Status:${NC}"
    pm2 status
    
    echo -e "\n${BLUE}Nginx Status:${NC}"
    systemctl status nginx --no-pager | head -n 10
    
    echo -e "\n${BLUE}Database Connection:${NC}"
    if PGPASSWORD='518518Erkan' psql -h wgkosgwkg8o4wg4k8cgcw4og -U postgres -d demir_db -c 'SELECT version();' 2>/dev/null | head -n 3; then
        echo -e "${GREEN}✓ Database bağlantısı aktif${NC}"
    else
        echo -e "${RED}✗ Database bağlantısı başarısız${NC}"
    fi
    
    echo -e "\n${BLUE}SSL Certificates:${NC}"
    if command -v certbot &> /dev/null; then
        certbot certificates 2>/dev/null || echo "SSL sertifikası henüz kurulmadı"
    fi
}

show_urls() {
    print_header "Site URL'leri"
    
    echo -e "${GREEN}✓ HTTP:${NC}  http://$DOMAIN"
    echo -e "${GREEN}✓ HTTPS:${NC} https://$DOMAIN"
    echo -e "${GREEN}✓ WWW:${NC}   https://$WWW_DOMAIN"
    echo -e "${GREEN}✓ Admin:${NC} https://$DOMAIN/admin"
}

# Main Menu
show_menu() {
    echo -e "\n${BLUE}============================================${NC}"
    echo -e "${BLUE}Demir Gayrimenkul - Domain Deployment${NC}"
    echo -e "${BLUE}Domain: $DOMAIN${NC}"
    echo -e "${BLUE}============================================${NC}\n"
    
    echo "1) Tam Kurulum (Tüm adımlar)"
    echo "2) DNS Kontrolü"
    echo "3) Bağımlılıkları Kur"
    echo "4) Database Kur"
    echo "5) Proje Build"
    echo "6) PM2 Kur"
    echo "7) Nginx Kur"
    echo "8) SSL Kur"
    echo "9) Firewall Kur"
    echo "10) Durum Göster"
    echo "11) URL'leri Göster"
    echo "0) Çıkış"
    echo
}

# Main execution
main() {
    check_root
    
    if [ $# -eq 0 ]; then
        while true; do
            show_menu
            read -p "Seçiminiz: " choice
            
            case $choice in
                1)
                    check_dns
                    install_dependencies
                    setup_database
                    build_project
                    setup_pm2
                    setup_nginx
                    setup_ssl
                    setup_firewall
                    show_status
                    show_urls
                    print_success "Deployment tamamlandı!"
                    break
                    ;;
                2) check_dns ;;
                3) install_dependencies ;;
                4) setup_database ;;
                5) build_project ;;
                6) setup_pm2 ;;
                7) setup_nginx ;;
                8) setup_ssl ;;
                9) setup_firewall ;;
                10) show_status ;;
                11) show_urls ;;
                0) exit 0 ;;
                *) print_error "Geçersiz seçim" ;;
            esac
        done
    else
        case $1 in
            dns) check_dns ;;
            deps) install_dependencies ;;
            db) setup_database ;;
            build) build_project ;;
            pm2) setup_pm2 ;;
            nginx) setup_nginx ;;
            ssl) setup_ssl ;;
            firewall) setup_firewall ;;
            status) show_status ;;
            urls) show_urls ;;
            full)
                check_dns
                install_dependencies
                setup_database
                build_project
                setup_pm2
                setup_nginx
                setup_ssl
                setup_firewall
                show_status
                show_urls
                ;;
            *)
                echo "Kullanım: $0 [dns|deps|db|build|pm2|nginx|ssl|firewall|status|urls|full]"
                exit 1
                ;;
        esac
    fi
}

main "$@"
