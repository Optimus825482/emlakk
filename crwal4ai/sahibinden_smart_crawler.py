"""
Sahibinden Smart Crawler - Optimized Version
=============================================
Özellikler:
1. Önce toplam ilan sayısını kontrol eder (data-totalmatches)
2. Tarihe göre sıralı çeker (sorting=date_desc)
3. Sadece yeni ilanları (bugün/dün) önceliklendirir
4. Veritabanındaki ID'lerle eşleştirir
5. Gereksiz sayfa taramasını önler

Kullanım:
    python sahibinden_smart_crawler.py --categories konut_satilik
    python sahibinden_smart_crawler.py --categories konut_satilik bina_satilik
    python sahibinden_smart_crawler.py --job-id <uuid>
"""

import undetected_chromedriver as uc
from bs4 import BeautifulSoup
import time
import logging
import argparse
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, List, Dict, Set, Tuple
from supabase import create_client, Client
from selenium.webdriver.common.by import By
from dotenv import load_dotenv
import os
import sys

# Import Decision Engine
from crawl_decision_engine import CrawlDecisionEngine

# Load environment
load_dotenv()

# Logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Paths
SCRIPT_DIR = Path(__file__).parent
CHROME_PROFILE = SCRIPT_DIR / "uc_chrome_profile"

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")

# Kategoriler - SORTING=DATE_DESC ile
HENDEK_CATEGORIES = {
    "konut_satilik": {
        "url": "https://www.sahibinden.com/satilik/sakarya-hendek?sorting=date_desc&pagingSize=50",
        "category": "konut",
        "transaction": "satilik",
    },
    "konut_kiralik": {
        "url": "https://www.sahibinden.com/kiralik/sakarya-hendek?sorting=date_desc&pagingSize=50",
        "category": "konut",
        "transaction": "kiralik",
    },
    "arsa_satilik": {
        "url": "https://www.sahibinden.com/satilik-arsa/sakarya-hendek?sorting=date_desc&pagingSize=50",
        "category": "arsa",
        "transaction": "satilik",
    },
    "isyeri_satilik": {
        "url": "https://www.sahibinden.com/satilik-isyeri/sakarya-hendek?sorting=date_desc&pagingSize=50",
        "category": "isyeri",
        "transaction": "satilik",
    },
    "isyeri_kiralik": {
        "url": "https://www.sahibinden.com/kiralik-isyeri/sakarya-hendek?sorting=date_desc&pagingSize=50",
        "category": "isyeri",
        "transaction": "kiralik",
    },
    "bina_satilik": {
        "url": "https://www.sahibinden.com/satilik-bina/sakarya-hendek?sorting=date_desc&pagingSize=50",
        "category": "bina",
        "transaction": "satilik",
    },
    "bina_kiralik": {
        "url": "https://www.sahibinden.com/kiralik-bina/sakarya-hendek?sorting=date_desc&pagingSize=50",
        "category": "bina",
        "transaction": "kiralik",
    },
}

# Batch size configuration (optimized for performance)
BATCH_SIZE_SMALL = 50    # For categories with < 100 listings
BATCH_SIZE_MEDIUM = 100  # For categories with 100-500 listings  
BATCH_SIZE_LARGE = 200   # For categories with > 500 listings (4x faster DB throughput)



def parse_price(price_str: str) -> int:
    """Fiyat string'ini integer'a çevirir"""
    if not price_str:
        return 0
    try:
        cleaned = ''.join(filter(str.isdigit, str(price_str)))
        return int(cleaned) if cleaned else 0
    except:
        return 0


def parse_listing_date(date_str: str) -> Optional[datetime]:
    """İlan tarihini parse et"""
    if not date_str:
        return None
    
    try:
        now = datetime.now()
        date_str = date_str.strip()
        
        # "Bugün 14:30"
        if date_str.startswith("Bugün"):
            time_part = date_str.replace("Bugün", "").strip()
            if time_part and ":" in time_part:
                hour, minute = map(int, time_part.split(":"))
                return now.replace(hour=hour, minute=minute, second=0, microsecond=0)
            return now
        
        # "Dün 09:15"
        if date_str.startswith("Dün"):
            time_part = date_str.replace("Dün", "").strip()
            yesterday = now - timedelta(days=1)
            if time_part and ":" in time_part:
                hour, minute = map(int, time_part.split(":"))
                return yesterday.replace(hour=hour, minute=minute, second=0, microsecond=0)
            return yesterday
        
        # Türkçe ay isimleri
        months = {
            "Ocak": 1, "Şubat": 2, "Mart": 3, "Nisan": 4,
            "Mayıs": 5, "Haziran": 6, "Temmuz": 7, "Ağustos": 8,
            "Eylül": 9, "Ekim": 10, "Kasım": 11, "Aralık": 12
        }
        
        # "15 Ocak" veya "15 Ocak 2024"
        parts = date_str.split()
        if len(parts) >= 2:
            day = int(parts[0])
            month_name = parts[1]
            year = int(parts[2]) if len(parts) >= 3 else now.year
            
            if month_name in months:
                month = months[month_name]
                return datetime(year, month, day)
        
        return None
        
    except Exception as e:
        logger.debug(f"Tarih parse hatası: {date_str} -> {e}")
        return None


def is_new_listing(listing_date: Optional[datetime]) -> bool:
    """İlan yeni mi? (Bugün veya dün)"""
    if not listing_date:
        return False
    
    now = datetime.now()
    
    # Bugün mü?
    if listing_date.date() == now.date():
        return True
    
    # Dün mü?
    yesterday = now - timedelta(days=1)
    if listing_date.date() == yesterday.date():
        return True
    
    return False


class SmartSahibindenCrawler:
    """Akıllı Sahibinden Crawler - Optimized"""
    
    def __init__(self, job_id: Optional[str] = None):
        self.driver = None
        self.job_id = job_id
        self.supabase: Optional[Client] = None
        self.db_listing_ids: Set[int] = set()
        
        self.stats = {
            "started_at": None,
            "completed_at": None,
            "categories_completed": [],
            "categories_skipped": 0,  # NEW: Track skipped categories
            "total_listings": 0,
            "new_listings": 0,
            "updated_listings": 0,
            "skipped_old_listings": 0,
            "total_pages": 0,
            "category_comparison": {},
        }
        
        self._init_supabase()
        self._load_db_listing_ids()
        
        # NEW: Initialize Decision Engine for smart crawling
        self.decision_engine = CrawlDecisionEngine(self.supabase)
    
    
    def _init_supabase(self):
        """Supabase client başlat"""
        if not SUPABASE_KEY:
            logger.error("❌ SUPABASE_KEY bulunamadı!")
            sys.exit(1)
        self.supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("✅ Supabase bağlantısı kuruldu")
    
    def _load_db_listing_ids(self):
        """Veritabanındaki tüm ilan ID'lerini yükle"""
        try:
            result = self.supabase.table("sahibinden_liste").select("id").execute()
            self.db_listing_ids = {int(r["id"]) for r in result.data}
            logger.info(f"📥 {len(self.db_listing_ids)} mevcut ilan ID'si yüklendi")
        except Exception as e:
            logger.error(f"❌ DB ID'leri yüklenemedi: {e}")
            self.db_listing_ids = set()

    def _update_category_stats(self, category: str, transaction: str, sahibinden_count: int):
        """category_stats tablosunu güncelle"""
        try:
            # Önce veritabanındaki (sahibinden_liste) gerçek sayıyı al
            db_res = self.supabase.table("sahibinden_liste")\
                .select("id", count="exact")\
                .eq("category", category)\
                .eq("transaction", transaction)\
                .limit(1).execute()
            
            db_count = db_res.count or 0
            diff = sahibinden_count - db_count
            
            status = "synced"
            if diff > 0: status = "new"
            elif diff < 0: status = "removed"

            stats_data = {
                "category": category,
                "transaction": transaction,
                "sahibinden_count": sahibinden_count,
                "database_count": db_count,
                "diff": diff,
                "status": status,
                "last_checked_at": datetime.now().isoformat()
            }
            
            # Upsert (category ve transaction'a göre unique constraint olmalı)
            # Eğer unique constraint yoksa, önce mevcut kaydı bulup update edebiliriz
            # Bu projede genellikle category+transaction unique'dir
            self.supabase.table("category_stats").upsert(
                stats_data, on_conflict="category,transaction"
            ).execute()
            
            logger.info(f"📊 category_stats güncellendi: {category}/{transaction} -> Sah: {sahibinden_count}, DB: {db_count}")
            
        except Exception as e:
            logger.error(f"❌ category_stats güncelleme hatası: {e}")
    
    def _goto_next_page_fast(self) -> bool:
        """Navigate to next page using JavaScript (faster than HTTP request)"""
        try:
            # Method 1: Click next button via JavaScript
            next_button = self.driver.find_element(By.CSS_SELECTOR, 'a.prevNextBut:not(.prev)')
            if next_button and next_button.is_displayed():
                self.driver.execute_script("arguments[0].click();", next_button)
                time.sleep(1)  # Reduced from 3s - DOM already loaded
                return True
            return False
        except Exception as e:
            logger.debug(f"JS navigation failed: {e}, falling back to HTTP")
            return False
    
    def _init_driver(self):
        """Chrome driver başlat"""
        try:
            options = uc.ChromeOptions()
            options.add_argument('--headless=new')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            options.add_argument('--disable-blink-features=AutomationControlled')
            options.add_argument('--window-size=1920,1080')
            
            self.driver = uc.Chrome(options=options, use_subprocess=True)
            logger.info("✅ Chrome driver başlatıldı")
            
        except Exception as e:
            logger.error(f"❌ Driver başlatılamadı: {e}")
            raise
    
    def _get_total_listings_count(self, html: str) -> int:
        """Sayfadan toplam ilan sayısını çek (data-totalmatches)"""
        try:
            soup = BeautifulSoup(html, 'html.parser')
            
            # Method 1: data-totalmatches attribute
            results_wrapper = soup.find('div', {'class': 'resultsTextWrapper'})
            if results_wrapper and results_wrapper.get('data-totalmatches'):
                count = int(results_wrapper['data-totalmatches'])
                logger.info(f"📊 Toplam ilan sayısı (data-totalmatches): {count}")
                return count
            
            # Method 2: result-text içindeki span
            result_text = soup.find('div', {'class': 'result-text'})
            if result_text:
                span = result_text.find('span')
                if span:
                    text = span.get_text(strip=True)
                    # "16 ilan" -> 16
                    count_str = ''.join(filter(str.isdigit, text))
                    if count_str:
                        count = int(count_str)
                        logger.info(f"📊 Toplam ilan sayısı (result-text): {count}")
                        return count
            
            logger.warning("⚠️ Toplam ilan sayısı bulunamadı")
            return 0
            
        except Exception as e:
            logger.error(f"❌ Toplam ilan sayısı parse hatası: {e}")
            return 0
    
    def _get_optimal_batch_size(self, total_listings: int) -> int:
        """Calculate optimal batch size based on category volume"""
        if total_listings < 100:
            return BATCH_SIZE_SMALL
        elif total_listings < 500:
            return BATCH_SIZE_MEDIUM
        else:
            return BATCH_SIZE_LARGE
    
    def _get_early_exit_threshold(self, total_listings: int) -> int:
        """Calculate optimal early exit threshold for old pages"""
        if total_listings < 50:
            return 1  # Small category: exit after 1 old page
        elif total_listings < 200:
            return 2  # Medium: exit after 2 old pages
        else:
            return 3  # Large: exit after 3 old pages
    
    def _parse_listings_from_page(self, html: str, category: str, transaction: str) -> List[Dict]:
        """Sayfadan ilanları parse et"""
        listings = []
        
        try:
            soup = BeautifulSoup(html, 'html.parser')
            
            # İlan kartlarını bul
            listing_cards = soup.find_all('tr', {'class': 'searchResultsItem'})
            
            for card in listing_cards:
                try:
                    # ID
                    listing_id = card.get('data-id')
                    if not listing_id:
                        continue
                    
                    listing_id = int(listing_id)
                    
                    # Başlık ve link
                    title_elem = card.find('a', {'class': 'classifiedTitle'})
                    if not title_elem:
                        continue
                    
                    baslik = title_elem.get_text(strip=True)
                    link = "https://www.sahibinden.com" + title_elem['href']
                    
                    # Fiyat
                    price_elem = card.find('td', {'class': 'searchResultsPriceValue'})
                    fiyat_str = price_elem.get_text(strip=True) if price_elem else ""
                    fiyat = parse_price(fiyat_str)
                    
                    # Konum
                    location_elem = card.find('td', {'class': 'searchResultsLocationValue'})
                    konum = location_elem.get_text(strip=True) if location_elem else ""
                    
                    # Tarih
                    date_elem = card.find('td', {'class': 'searchResultsDateValue'})
                    tarih_str = date_elem.get_text(strip=True) if date_elem else ""
                    
                    # Resim
                    img_elem = card.find('img')
                    resim = img_elem.get('data-src') or img_elem.get('src', '') if img_elem else ""
                    
                    listing = {
                        "id": listing_id,
                        "baslik": baslik,
                        "link": link,
                        "fiyat": fiyat,
                        "konum": konum,
                        "tarih": tarih_str,
                        "resim": resim,
                        "category": category,
                        "transaction": transaction,
                    }
                    
                    listings.append(listing)
                    
                except Exception as e:
                    logger.debug(f"İlan parse hatası: {e}")
                    continue
            
        except Exception as e:
            logger.error(f"❌ Sayfa parse hatası: {e}")
        
        return listings
    
    def _save_listings_batch(self, listings: List[Dict]) -> Tuple[int, int]:
        """İlanları toplu kaydet"""
        if not listings:
            return 0, 0
        
        try:
            db_data_list = []
            for listing in listings:
                db_data = {
                    "id": listing["id"],
                    "baslik": listing["baslik"][:255],
                    "link": listing["link"][:500],
                    "fiyat": listing["fiyat"],
                    "konum": listing["konum"][:255],
                    "tarih": listing["tarih"],
                    "resim": listing["resim"][:500],
                    "category": listing["category"],
                    "transaction": listing["transaction"],
                    "crawled_at": datetime.now().isoformat(),
                }
                db_data_list.append(db_data)
            
            # Batch upsert
            self.supabase.table("sahibinden_liste").upsert(
                db_data_list, on_conflict="id"
            ).execute()
            
            # Yeni vs güncellenen
            new_count = sum(1 for l in listings if l["id"] not in self.db_listing_ids)
            updated_count = len(listings) - new_count
            
            # Yeni ilanları new_listings'e kaydet
            if new_count > 0:
                new_listings_data = []
                for listing in listings:
                    if listing["id"] not in self.db_listing_ids:
                        new_listings_data.append({
                            "listing_id": listing["id"],
                            "baslik": listing["baslik"][:255],
                            "fiyat": listing["fiyat"],
                            "konum": listing["konum"][:255],
                            "category": listing["category"],
                            "transaction": listing["transaction"],
                            "link": listing["link"][:500],
                            "resim": listing["resim"][:500],
                            "first_seen_at": datetime.now().isoformat(),
                        })
                
                if new_listings_data:
                    self.supabase.table("new_listings").upsert(
                        new_listings_data, on_conflict="listing_id"
                    ).execute()
            
            # ID'leri güncelle
            for listing in listings:
                self.db_listing_ids.add(listing["id"])
            
            return new_count, updated_count
            
        except Exception as e:
            logger.error(f"❌ Batch kayıt hatası: {e}")
            return 0, 0
    
    def _crawl_category(self, category_key: str, max_pages: int = 100, force: bool = False) -> Dict:
        """Bir kategoriyi akıllıca crawl et"""
        cat_info = HENDEK_CATEGORIES[category_key]
        base_url = cat_info["url"]
        category = cat_info["category"]
        transaction = cat_info["transaction"]
        
        logger.info(f"\n{'='*60}")
        logger.info(f"📂 Kategori: {category}/{transaction}")
        logger.info(f"{'='*60}")
        
        cat_stats = {
            "category": category,
            "transaction": transaction,
            "total_on_sahibinden": 0,
            "total_in_db_before": 0,
            "total_in_db_after": 0,
            "new_listings": 0,
            "updated_listings": 0,
            "pages_crawled": 0,
            "stopped_reason": "",
        }
        
        try:
            # 1. İlk sayfayı aç ve toplam sayıyı öğren
            logger.info(f"🌐 İlk sayfa açılıyor...")
            self.driver.get(base_url)
            time.sleep(3)
            
            html = self.driver.page_source
            total_listings = self._get_total_listings_count(html)
            if not total_listings:
                 logger.warning("⚠️ Toplam ilan sayısı bulunamadı, ancak crawl devam edecek...")
                 total_listings = 0
            
            cat_stats["total_on_sahibinden"] = total_listings
            
            # category_stats tablosunu hedeften gelen rakam ile güncelle
            self._update_category_stats(category, transaction, total_listings)
            
            # DB'deki mevcut sayı
            db_result = self.supabase.table("sahibinden_liste").select("id", count="exact").eq("category", category).eq("transaction", transaction).execute()
            db_count_before = db_result.count or 0
            cat_stats["total_in_db_before"] = db_count_before
            
            logger.info(f"📊 Sahibinden: {total_listings} ilan")
            logger.info(f"📊 Veritabanı: {db_count_before} ilan")
            logger.info(f"📊 Fark: {total_listings - db_count_before} ilan")
            
            # 2. Sayfa sayfa crawl et (tarihe göre sıralı)
            page = 1
            consecutive_old_pages = 0
            MAX_CONSECUTIVE_OLD_PAGES = 3  # 3 sayfa üst üste eski ilan varsa dur
            
            while page <= max_pages:
                logger.info(f"\n📄 Sayfa {page}/{max_pages}")
                
                if page > 1:
                    # Try fast JS navigation first, fallback to HTTP
                    if not self._goto_next_page_fast():
                        # Fallback: traditional HTTP request
                        page_url = f"{base_url}&pagingOffset={(page-1)*50}"
                        self.driver.get(page_url)
                        time.sleep(2)
                    html = self.driver.page_source
                
                # İlanları parse et
                listings = self._parse_listings_from_page(html, category, transaction)
                
                if not listings:
                    logger.info("⚠️ İlan bulunamadı, durduruluyor")
                    cat_stats["stopped_reason"] = "no_listings"
                    break
                
                logger.info(f"   Bulunan ilan: {len(listings)}")
                
                # Yeni ilanları kontrol et
                new_listings_on_page = []
                old_listings_on_page = []
                
                for listing in listings:
                    listing_date = parse_listing_date(listing["tarih"])
                    if is_new_listing(listing_date):
                        new_listings_on_page.append(listing)
                    else:
                        old_listings_on_page.append(listing)
                
                logger.info(f"   🆕 Yeni (bugün/dün): {len(new_listings_on_page)}")
                logger.info(f"   📅 Eski: {len(old_listings_on_page)}")
                
                # Tüm ilanları kaydet
                new_count, updated_count = self._save_listings_batch(listings)
                cat_stats["new_listings"] += new_count
                cat_stats["updated_listings"] += updated_count
                cat_stats["pages_crawled"] += 1
                
                # Eğer sayfada hiç yeni ilan yoksa, sayacı artır
                if len(new_listings_on_page) == 0:
                    consecutive_old_pages += 1
                    logger.info(f"   ⏭️ Eski ilan sayfası ({consecutive_old_pages}/{MAX_CONSECUTIVE_OLD_PAGES})")
                    
                    if not force and consecutive_old_pages >= MAX_CONSECUTIVE_OLD_PAGES:
                        logger.info(f"✅ {MAX_CONSECUTIVE_OLD_PAGES} sayfa üst üste eski ilan, durduruluyor")
                        cat_stats["stopped_reason"] = "consecutive_old_pages"
                        break
                else:
                    consecutive_old_pages = 0
                
                page += 1
            
            # Son DB sayısı
            db_result_after = self.supabase.table("sahibinden_liste").select("id", count="exact").eq("category", category).eq("transaction", transaction).execute()
            cat_stats["total_in_db_after"] = db_result_after.count or 0
            
            logger.info(f"\n✅ Kategori tamamlandı:")
            logger.info(f"   Sayfa: {cat_stats['pages_crawled']}")
            logger.info(f"   Yeni: {cat_stats['new_listings']}")
            logger.info(f"   Güncellenen: {cat_stats['updated_listings']}")
            logger.info(f"   DB (önce): {cat_stats['total_in_db_before']}")
            logger.info(f"   DB (sonra): {cat_stats['total_in_db_after']}")
            
        except Exception as e:
            logger.error(f"❌ Kategori crawl hatası: {e}")
            cat_stats["stopped_reason"] = f"error: {str(e)}"
        
        return cat_stats
    
    def crawl(self, categories: List[str], max_pages: int = 100, force: bool = False):
        """Enhanced crawl with smart decision engine"""
        self.stats["started_at"] = datetime.now().isoformat()
        
        try:
            self._init_driver()
            
            # Build crawl plan using Decision Engine
            crawl_plan = []
            
            logger.info(f"\n{'='*60}")
            logger.info(f"🧠 DECISION ENGINE ANALYSIS")
            logger.info(f"{'='*60}")
            
            for cat_key in categories:
                if cat_key not in HENDEK_CATEGORIES:
                    logger.warning(f"⚠️ Bilinmeyen kategori: {cat_key}")
                    continue
                
                cat_info = HENDEK_CATEGORIES[cat_key]
                category = cat_info["category"]
                transaction = cat_info["transaction"]
                
                if force:
                    should_crawl, pages, reason = True, max_pages, "forced"
                else:
                    should_crawl, pages, reason = self.decision_engine.should_crawl_category(
                        category, transaction
                    )
                
                if should_crawl:
                    crawl_plan.append({
                        "key": cat_key,
                        "category": category,
                        "transaction": transaction,
                        "max_pages": pages,
                        "reason": reason
                    })
                    logger.info(f"✅ {cat_key}: CRAWL ({reason}, max {pages} pages)")
                else:
                    logger.info(f"⏭️  {cat_key}: SKIP ({reason})")
                    self.stats["categories_skipped"] += 1
            
            logger.info(f"\n📋 CRAWL PLAN: {len(crawl_plan)}/{len(categories)} categories")
            
            for plan_item in crawl_plan:
                cat_stats = self._crawl_category(plan_item["key"], max_pages=plan_item["max_pages"], force=force)
                
                self.stats["categories_completed"].append(plan_item["key"])
                self.stats["total_listings"] += cat_stats["new_listings"] + cat_stats["updated_listings"]
                self.stats["new_listings"] += cat_stats["new_listings"]
                self.stats["updated_listings"] += cat_stats["updated_listings"]
                self.stats["total_pages"] += cat_stats["pages_crawled"]
                self.stats["category_comparison"][plan_item["key"]] = cat_stats
                
                # Kategori arası bekleme
                if plan_item != crawl_plan[-1]:
                    logger.info(f"\n⏳ Kategori arası bekleme (3 saniye)...")
                    time.sleep(3)
            
            self.stats["completed_at"] = datetime.now().isoformat()
            
            # Final özet
            logger.info(f"\n{'='*60}")
            logger.info(f"🎉 CRAWLER TAMAMLANDI")
            logger.info(f"{'='*60}")
            logger.info(f"Crawl edilen: {len(self.stats['categories_completed'])}")
            logger.info(f"Atlanan: {self.stats['categories_skipped']}")
            logger.info(f"Toplam sayfa: {self.stats['total_pages']}")
            logger.info(f"Yeni: {self.stats['new_listings']}, Güncellenen: {self.stats['updated_listings']}")
            
        except Exception as e:
            logger.error(f"❌ Crawler hatası: {e}")
            raise
        
        finally:
            if self.driver:
                self.driver.quit()
                logger.info("✅ Driver kapatıldı")


def main():
    parser = argparse.ArgumentParser(description="Smart Sahibinden Crawler")
    parser.add_argument(
        "--categories",
        nargs="+",
        default=["konut_satilik"],
        choices=list(HENDEK_CATEGORIES.keys()),
        help="Crawl edilecek kategoriler"
    )
    parser.add_argument(
        "--max-pages",
        type=int,
        default=100,
        help="Kategori başına maksimum sayfa sayısı"
    )
    parser.add_argument(
        "--job-id",
        type=str,
        help="Mining job ID (opsiyonel)"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force full crawl, bypass decision engine"
    )
    
    args = parser.parse_args()
    
    logger.info("🚀 Smart Sahibinden Crawler başlatılıyor...")
    logger.info(f"Kategoriler: {', '.join(args.categories)}")
    logger.info(f"Max sayfa: {args.max_pages}")
    if args.force:
        logger.info(f"⚡ FORCE MODE: Decision Engine bypass edildi")
    
    crawler = SmartSahibindenCrawler(job_id=args.job_id)
    crawler.crawl(args.categories, args.max_pages, force=args.force)


if __name__ == "__main__":
    main()
