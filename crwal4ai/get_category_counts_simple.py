"""
Mevcut crawler profilini kullanarak kategori sayılarını çek
Headless değil, normal mode kullanır (daha güvenilir)
Özel Chromium binary kullanır ve sonuçları Supabase'e kaydeder
"""

import undetected_chromedriver as uc
from bs4 import BeautifulSoup
import json
import sys
from pathlib import Path
import time
import os
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment
load_dotenv()

SCRIPT_DIR = Path(__file__).parent
CHROME_PROFILE = SCRIPT_DIR / "uc_chrome_profile"
CUSTOM_CHROME_PATH = r"C:\Users\erkan\undetected-chromium\chromium\chrome-win\chrome.exe"

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://cxeakfwtrlnjcjzvqdip.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")


def save_to_database(category_counts: dict, db_counts: dict):
    """Kategori istatistiklerini Supabase'e kaydet"""
    if not SUPABASE_KEY:
        print("⚠️ SUPABASE_KEY bulunamadı, veritabanına yazılamıyor", file=sys.stderr)
        return False
    
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        now = datetime.now().isoformat()
        
        for category, sahibinden_count in category_counts.items():
            db_count = db_counts.get(category, 0)
            diff = sahibinden_count - db_count
            
            # Status belirleme
            if diff > 0:
                status = "new"
            elif diff < 0:
                status = "removed"
            else:
                status = "synced"
            
            # Upsert (varsa güncelle, yoksa ekle)
            data = {
                "category": category,
                "sahibinden_count": sahibinden_count,
                "database_count": db_count,
                "diff": diff,
                "status": status,
                "last_checked_at": now,
                "updated_at": now,
            }
            
            supabase.table("category_stats").upsert(
                data, 
                on_conflict="category"
            ).execute()
        
        print(f"✅ {len(category_counts)} kategori veritabanına kaydedildi", file=sys.stderr)
        return True
        
    except Exception as e:
        print(f"❌ Veritabanı kayıt hatası: {e}", file=sys.stderr)
        return False


def get_database_counts():
    """Veritabanından kategori sayılarını al"""
    if not SUPABASE_KEY:
        return {}
    
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        db_counts = {}
        categories = ["konut", "arsa", "isyeri", "bina"]
        
        for category in categories:
            result = supabase.table("sahibinden_liste")\
                .select("*", count="exact")\
                .eq("category", category)\
                .execute()
            
            db_counts[category] = result.count or 0
        
        return db_counts
        
    except Exception as e:
        print(f"⚠️ Veritabanı sayıları alınamadı: {e}", file=sys.stderr)
        return {}


def get_category_counts():
    """Ana emlak sayfasından kategori sayılarını çek"""
    driver = None
    try:
        # Chrome options - HEADLESS DEĞİL
        CHROME_PROFILE.mkdir(exist_ok=True)
        
        options = uc.ChromeOptions()
        options = uc.ChromeOptions()
        
        options.add_argument(f'--user-data-dir={CHROME_PROFILE}')
        # Headless kaldırıldı - normal browser
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_argument('--window-size=1920,1080')
        options.add_argument('--start-minimized')  # Minimize et
        
        # ÖZEL CHROMIUM BINARY
        if Path(CUSTOM_CHROME_PATH).exists():
            options.binary_location = CUSTOM_CHROME_PATH
            print(f"✅ Özel Chromium kullanılıyor: {CUSTOM_CHROME_PATH}", file=sys.stderr)
            # Chromium 146 için driver version
            driver = uc.Chrome(options=options, version_main=146)
        else:
            print(f"⚠️ Özel Chromium bulunamadı, sistem Chrome kullanılacak", file=sys.stderr)
            # Auto-detect system Chrome version
            driver = uc.Chrome(options=options, version_main=None)
        driver.set_page_load_timeout(30)
        
        # Ana sayfaya git
        url = "https://www.sahibinden.com/emlak/sakarya-hendek"
        driver.get(url)
        
        # Sayfanın yüklenmesini bekle
        time.sleep(4)
        
        # Cloudflare/bot detection kontrolü
        page_source = driver.page_source.lower()
        if "tarayıcınızı kontrol ediyoruz" in page_source or "checking your browser" in page_source:
            # Biraz daha bekle
            time.sleep(5)
        
        # HTML'i al
        html = driver.page_source
        soup = BeautifulSoup(html, "html.parser")
        
        # Kategori sayılarını parse et
        category_counts = {}
        
        container = soup.select_one("#searchCategoryContainer")
        if not container:
            return {
                "success": False,
                "error": "searchCategoryContainer bulunamadı - sayfa tam yüklenmemiş olabilir"
            }
        
        items = container.select("li.cl1")
        
        if not items:
            return {
                "success": False,
                "error": "Kategori item'ları bulunamadı"
            }
        
        for item in items:
            link = item.select_one("a")
            span = item.select_one("span")
            
            if not link or not span:
                continue
            
            href = link.get("href", "")
            title = link.get("title", "").lower()
            count_text = span.get_text(strip=True)
            
            # "(838)" veya "(1.286)" formatından sayıyı çıkar
            import re
            match = re.search(r'\(([\d.]+)\)', count_text)
            if match:
                count_str = match.group(1).replace('.', '').replace(',', '')
                count = int(count_str)
                
                # Kategori mapping
                if "konut" in title or "konut" in href:
                    if "kiralik" in href:
                        category_counts["konut_kiralik"] = count
                    else:
                        category_counts["konut"] = count
                elif "arsa" in title or "arsa" in href:
                    category_counts["arsa"] = count
                elif "yeri" in title or "is-yeri" in href:
                    if "kiralik" in href:
                        category_counts["isyeri_kiralik"] = count
                    else:
                        category_counts["isyeri"] = count
                elif "bina" in title or "bina" in href:
                    category_counts["bina"] = count
        
        if not category_counts:
            return {
                "success": False,
                "error": "Hiç kategori sayısı parse edilemedi"
            }
        
        # Veritabanından mevcut sayıları al
        db_counts = get_database_counts()
        
        # Veritabanına kaydet
        save_to_database(category_counts, db_counts)
        
        return {
            "success": True, 
            "counts": category_counts,
            "db_counts": db_counts,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        import traceback
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }
        
    finally:
        if driver:
            try:
                driver.quit()
            except:
                pass


if __name__ == "__main__":
    result = get_category_counts()
    print(json.dumps(result, ensure_ascii=False))
    sys.stdout.flush()
