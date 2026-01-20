"""
Sahibinden Toplu Crawler - Undetected ChromeDriver
===================================================
Cloudflare bypass için undetected_chromedriver kullanır.
Chrome profile ile oturum kalıcılığı sağlar.
Supabase job tracking desteği ile real-time progress.

Kullanım:
   python sahibinden_uc_batch.py
   python sahibinden_uc_batch.py --categories konut_satilik arsa_satilik
   python sahibinden_uc_batch.py --reset
   python sahibinden_uc_batch.py --max-pages 5
   python sahibinden_uc_batch.py --job-id <uuid>  # API'den tetikleme için
"""

import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from bs4 import BeautifulSoup
import time
import json
import os
import random
import logging
import argparse
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict
from dotenv import load_dotenv

# Load environment
load_dotenv()

# Supabase (optional - for job tracking)
try:
    from supabase import create_client, Client
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    HAS_SUPABASE = bool(SUPABASE_URL and SUPABASE_KEY)
except ImportError:
    HAS_SUPABASE = False
    SUPABASE_URL = None
    SUPABASE_KEY = None

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Dosya yolları
SCRIPT_DIR = Path(__file__).parent
CHROME_PROFILE = SCRIPT_DIR / "uc_chrome_profile"
CHECKPOINT_FILE = SCRIPT_DIR / "uc_batch_checkpoint.json"
OUTPUT_FILE = SCRIPT_DIR / "hendek_uc_ilanlar.json"

# Hendek kategorileri
HENDEK_CATEGORIES = {
    
    "arsa_satilik": {
        "url": "https://www.sahibinden.com/satilik-arsa/sakarya-hendek?pagingSize=50",
        "category": "arsa",
        "transaction": "satilik",
    }
}

# Ayarlar
PAGE_DELAY_MIN = 2  # Sayfalar arası min bekleme
PAGE_DELAY_MAX = 4  # Sayfalar arası max bekleme
CATEGORY_DELAY = 7  # Kategoriler arası bekleme (daha uzun)
MAX_PAGES_PER_CATEGORY = 100  # Kategori başına max sayfa

# User Agent listesi - rastgele seçilecek
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
]

# Viewport boyutları - rastgele seçilecek
VIEWPORTS = [
    (1920, 1080),
    (1366, 768),
    (1536, 864),
    (1440, 900),
    (1280, 720),
]


class SahibindenUCCrawler:
    """Undetected ChromeDriver ile Sahibinden crawler"""
    
    def __init__(self, job_id: str = None):
        self.driver = None
        self.all_listings = []
        self.seen_ids = set()  # Duplicate kontrolü için
        self.job_id = job_id
        self.supabase = None
        self.stats = {
            "started_at": None,
            "completed_at": None,
            "categories_completed": [],
            "total_listings": 0,
            "total_pages": 0,
            "duplicates_skipped": 0,  # Atlanan duplicate sayısı
            "errors": [],
        }
        self.checkpoint = self._load_checkpoint()
        
        # Initialize Supabase if job_id provided
        if self.job_id and HAS_SUPABASE:
            try:
                self.supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
                logger.info(f"📡 Supabase bağlantısı kuruldu (Job: {self.job_id[:8]}...)")
            except Exception as e:
                logger.warning(f"⚠️ Supabase bağlantısı kurulamadı: {e}")
    
    def _update_job_progress(self, current: int, total: int, message: str = None):
        """Update job progress in Supabase"""
        if not self.supabase or not self.job_id:
            return
        
        try:
            percentage = int((current / total * 100)) if total > 0 else 0
            update_data = {
                "progress": {
                    "current": current,
                    "total": total,
                    "percentage": percentage,
                    "message": message or f"{current}/{total} işlendi"
                },
                "stats": self.stats,
                "updated_at": datetime.now().isoformat()
            }
            self.supabase.table("mining_jobs").update(update_data).eq("id", self.job_id).execute()
        except Exception as e:
            logger.warning(f"Progress update failed: {e}")
    
    def _add_log(self, level: str, message: str, data: dict = None):
        """Add log entry to Supabase"""
        if not self.supabase or not self.job_id:
            return
        
        try:
            log_data = {
                "job_id": self.job_id,
                "level": level,
                "message": message,
                "data": data
            }
            self.supabase.table("mining_logs").insert(log_data).execute()
        except Exception as e:
            logger.warning(f"Log insert failed: {e}")
    
    def _load_checkpoint(self) -> dict:
        """Checkpoint yükle"""
        if CHECKPOINT_FILE.exists():
            try:
                with open(CHECKPOINT_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                pass
        return {"completed_categories": [], "listings": []}
    
    def _save_checkpoint(self):
        """Checkpoint kaydet"""
        checkpoint = {
            "completed_categories": self.stats["categories_completed"],
            "listings": self.all_listings,
            "stats": self.stats,
            "saved_at": datetime.now().isoformat(),
        }
        with open(CHECKPOINT_FILE, 'w', encoding='utf-8') as f:
            json.dump(checkpoint, f, ensure_ascii=False, indent=2)
        logger.info(f"💾 Checkpoint kaydedildi ({len(self.all_listings)} ilan)")
    
    def _save_output(self):
        """Final çıktıyı kaydet"""
        output = {
            "crawled_at": datetime.now().isoformat(),
            "stats": self.stats,
            "total_listings": len(self.all_listings),
            "listings": self.all_listings,
        }
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        logger.info(f"💾 Tüm ilanlar kaydedildi: {OUTPUT_FILE}")
    
    def _get_chrome_options(self):
        """Chrome ayarları - human-like davranış için"""
        CHROME_PROFILE.mkdir(exist_ok=True)
        
        # Rastgele user agent ve viewport seç
        self.current_ua = random.choice(USER_AGENTS)
        self.current_viewport = random.choice(VIEWPORTS)
        
        options = uc.ChromeOptions()
        options.add_argument(f'user-agent={self.current_ua}')
        options.add_argument(f"--window-size={self.current_viewport[0]},{self.current_viewport[1]}")
        options.add_argument(f'--user-data-dir={CHROME_PROFILE}')
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--lang=tr-TR')
        
        # Ek gizlilik ayarları
        options.add_argument('--disable-infobars')
        options.add_argument('--disable-extensions')
        
        logger.info(f"🎭 UA: {self.current_ua[:50]}...")
        logger.info(f"📐 Viewport: {self.current_viewport}")
        
        return options
    
    def start_browser(self):
        """Browser'ı başlat"""
        logger.info("🚀 Chrome başlatılıyor...")
        
        options = self._get_chrome_options()
        self.driver = uc.Chrome(options=options)
        
        # WebDriver özelliğini gizle
        self.driver.execute_script(
            "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
        )
        
        logger.info("✅ Chrome hazır!")
    
    def close_browser(self):
        """Browser'ı kapat"""
        if self.driver:
            try:
                self.driver.quit()
            except:
                pass
            finally:
                self.driver = None
    
    def _human_like_delay(self, min_sec: float = 1.2, max_sec: float = 3.0):
        """İnsan benzeri rastgele bekleme"""
        delay = random.uniform(min_sec, max_sec)
        time.sleep(delay)
    
    def _human_like_scroll(self):
        """İnsan benzeri scroll"""
        try:
            # Rastgele scroll miktarı
            scroll_amount = random.randint(300, 700)
            self.driver.execute_script(f"window.scrollBy(0, {scroll_amount});")
            self._human_like_delay(0.65, 1.5)
            
            # Bazen yukarı scroll
            if random.random() < 0.3:
                self.driver.execute_script(f"window.scrollBy(0, -{random.randint(100, 200)});")
                self._human_like_delay(0.3, 0.8)
        except:
            pass
    
    def _wait_for_cloudflare(self, timeout: int = 60) -> bool:
        """Cloudflare challenge'ı bekle"""
        logger.info("⏳ Cloudflare kontrolü...")
        start = time.time()
        
        while time.time() - start < timeout:
            try:
                ps = self.driver.page_source.lower()
                
                # Cloudflare markers
                markers = [
                    "cloudflare",
                    "checking your browser",
                    "just a moment",
                    "cf-challenge",
                    "turnstile",
                    "insan olduğunuz doğrulanıyor",
                    "bir dakika lütfen",
                    "tarayıcınızı kontrol"
                ]
                
               
                
                # Sahibinden içeriği var mı?
                if "searchresultstable" in ps or "classifieddetailtitle" in ps:
                    logger.info("✅ Cloudflare geçildi!")
                    return True
                
                # Challenge yok, içerik de yok - biraz daha bekle
                time.sleep(2)
                
            except Exception as e:
                logger.warning(f"⚠️ Cloudflare beklerken hata: {e}")
                time.sleep(2)
        
        logger.error("❌ Cloudflare timeout")
        return False
    
    def _handle_devam_et(self) -> bool:
        """'Devam Et' butonunu tıkla"""
        try:
            ps = self.driver.page_source.lower()
            
            if "devam et" in ps or "btn-continue" in ps:
                logger.info("🔍 'Devam Et' sayfası tespit edildi")
                
                # Butonu bul ve tıkla
                try:
                    btn = WebDriverWait(self.driver, 10).until(
                        EC.element_to_be_clickable((By.ID, "btn-continue"))
                    )
                    
                    # Human-like tıklama
                    actions = ActionChains(self.driver)
                    actions.move_to_element(btn)
                    self._human_like_delay(0.3, 0.8)
                    actions.click()
                    actions.perform()
                    
                    logger.info("✅ 'Devam Et' tıklandı")
                    self._human_like_delay(2, 4)
                    return True
                    
                except Exception as e:
                    logger.warning(f"⚠️ Devam Et butonu tıklanamadı: {e}")
                    
        except:
            pass
        
        return False
    
    def navigate(self, url: str, timeout: int = 60, referrer: str = None) -> Optional[str]:
        """Sayfaya git ve HTML'i al"""
        logger.info(f"🌐 {url[:60]}...")
        
        try:
            # Referrer ayarla - daha doğal görünüm için
            if referrer:
                self.driver.execute_cdp_cmd('Network.setExtraHTTPHeaders', {
                    'headers': {'Referer': referrer}
                })
            
            self.driver.get(url)
            self._human_like_delay(2, 4)
            
            # Cloudflare bekle
            if not self._wait_for_cloudflare(timeout):
                return None
            
            # Devam Et kontrolü
            self._handle_devam_et()
            
            # Human-like scroll
            self._human_like_scroll()
            self._human_like_scroll()
            
            # Rastgele mouse hareketi
            if random.random() < 0.3:
                self._random_mouse_move()
            
            html = self.driver.page_source
            logger.info(f"✅ Sayfa yüklendi ({len(html):,} bytes)")
            
            return html
            
        except Exception as e:
            logger.error(f"❌ Navigate hatası: {e}")
            return None
    
    def _random_mouse_move(self):
        """Rastgele mouse hareketi - bot olmadığımızı göstermek için"""
        try:
            actions = ActionChains(self.driver)
            # Rastgele bir noktaya hareket et
            x_offset = random.randint(100, 800)
            y_offset = random.randint(100, 500)
            actions.move_by_offset(x_offset, y_offset)
            actions.perform()
            self._human_like_delay(0.2, 0.5)
            # Geri dön
            actions.move_by_offset(-x_offset, -y_offset)
            actions.perform()
        except:
            pass
    
    def extract_listings(self, html: str) -> List[Dict]:
        """HTML'den ilan listesini çıkar"""
        soup = BeautifulSoup(html, 'html.parser')
        listings = []
        
        rows = soup.select('#searchResultsTable tbody tr.searchResultsItem')
        
        for row in rows:
            try:
                listing = {}
                
                # ID
                listing["id"] = row.get("data-id", "")
                
                # Başlık ve link
                title_el = row.select_one("a.classifiedTitle")
                if title_el:
                    listing["baslik"] = title_el.get("title", "").strip()
                    href = title_el.get("href", "")
                    if href and href != "#":
                        listing["link"] = f"https://www.sahibinden.com{href}" if href.startswith("/") else href
                    elif listing["id"]:
                        listing["link"] = f"https://www.sahibinden.com/ilan/{listing['id']}"
                
                # Fiyat
                price_el = row.select_one("td.searchResultsPriceValue span")
                if price_el:
                    listing["fiyat"] = price_el.get_text(strip=True)
                
                # Konum
                loc_el = row.select_one("td.searchResultsLocationValue")
                if loc_el:
                    listing["konum"] = " ".join(loc_el.get_text(strip=True).split())
                
                # Tarih
                date_el = row.select_one("td.searchResultsDateValue span")
                if date_el:
                    listing["tarih"] = date_el.get_text(strip=True)
                
                # Resim
                img_el = row.select_one("td.searchResultsLargeThumbnail img")
                if img_el:
                    listing["resim"] = img_el.get("src", "")
                
                if listing.get("id") and listing.get("link"):
                    listings.append(listing)
                    
            except Exception as e:
                continue
        
        return listings
    
    def crawl_category(self, key: str, config: dict, max_pages: int) -> List[Dict]:
        """Tek kategoriyi crawl et"""
        url = config["url"]
        category = config["category"]
        transaction = config["transaction"]
        
        logger.info(f"\n{'='*60}")
        logger.info(f"📂 Kategori: {key}")
        logger.info(f"   URL: {url}")
        logger.info(f"   Tip: {category} / {transaction}")
        logger.info(f"{'='*60}")
        
        category_listings = []
        page = 0
        consecutive_no_new = 0  # Ardışık yeni ilan olmayan sayfa sayısı
        last_url = "https://www.google.com/search?q=sahibinden+hendek"  # İlk referrer
        
        while page < max_pages:
            page_url = url if page == 0 else f"{url}&pagingOffset={page * 50}"
            logger.info(f"\n📄 Sayfa {page + 1} taranıyor...")
            
            # Referrer olarak önceki sayfayı kullan
            html = self.navigate(page_url, referrer=last_url)
            last_url = page_url  # Sonraki sayfa için referrer
            
            if not html:
                logger.error(f"❌ Sayfa yüklenemedi")
                self.stats["errors"].append({
                    "category": key,
                    "page": page + 1,
                    "error": "Page load failed"
                })
                break
            
            listings = self.extract_listings(html)
            
            if not listings:
                logger.info(f"ℹ️ Bu sayfada ilan yok, kategori tamamlandı")
                break
            
            # DUPLICATE KONTROLÜ - Sadece yeni ilanları ekle
            new_listings = []
            duplicates_in_page = 0
            
            for listing in listings:
                listing_id = listing.get("id")
                if listing_id and listing_id not in self.seen_ids:
                    # Yeni ilan - kategori bilgisi ekle
                    listing["category"] = category
                    listing["transaction"] = transaction
                    listing["crawled_at"] = datetime.now().isoformat()
                    
                    new_listings.append(listing)
                    self.seen_ids.add(listing_id)
                else:
                    duplicates_in_page += 1
                    self.stats["duplicates_skipped"] += 1
            
            category_listings.extend(new_listings)
            self.stats["total_pages"] += 1
            
            logger.info(f"✅ {len(new_listings)} yeni ilan bulundu (Sayfa: {len(listings)}, Duplicate: {duplicates_in_page}, Kategori toplam: {len(category_listings)})")
            
            # Update job progress
            self._update_job_progress(
                current=self.stats["total_pages"] + len(category_listings),
                total=max_pages * 50,  # Approximate
                message=f"{key}: Sayfa {page + 1}, {len(category_listings)} ilan"
            )
            self._add_log("info", f"Sayfa {page + 1}: {len(new_listings)} yeni ilan", {
                "category": key,
                "page": page + 1,
                "new_count": len(new_listings),
                "duplicate_count": duplicates_in_page
            })
            
            # Eğer sayfadaki tüm ilanlar duplicate ise, muhtemelen döngüye girdik
            if len(new_listings) == 0:
                consecutive_no_new += 1
                if consecutive_no_new >= 2:
                    logger.info(f"⚠️ Ardışık {consecutive_no_new} sayfada yeni ilan yok, kategori tamamlandı")
                    break
            else:
                consecutive_no_new = 0
            
            # Sonraki sayfa için bekle
            if page < max_pages - 1 and new_listings:
                delay = random.uniform(PAGE_DELAY_MIN, PAGE_DELAY_MAX)
                
                # Her 5 sayfada bir uzun mola ver (bot olmadığımızı göster)
                if (page + 1) % 5 == 0:
                    delay += random.uniform(10, 20)
                    logger.info(f"☕ Mola veriliyor... {delay:.1f} saniye")
                else:
                    logger.info(f"⏳ {delay:.1f} saniye bekleniyor...")
                
                time.sleep(delay)
            
            page += 1
        
        return category_listings
    
    def run(self, categories: Optional[List[str]] = None, max_pages: int = MAX_PAGES_PER_CATEGORY):
        """Toplu taramayı başlat"""
        logger.info("=" * 60)
        logger.info("🚀 SAHİBİNDEN UC CRAWLER")
        logger.info("   Undetected ChromeDriver ile Hendek İlanları")
        logger.info("=" * 60)
        
        self.stats["started_at"] = datetime.now().isoformat()
        
        # Checkpoint'ten devam
        if self.checkpoint.get("listings"):
            self.all_listings = self.checkpoint["listings"]
            # Mevcut ID'leri seen_ids'e ekle
            for listing in self.all_listings:
                if listing.get("id"):
                    self.seen_ids.add(listing["id"])
            logger.info(f"📥 Checkpoint'ten {len(self.all_listings)} ilan yüklendi ({len(self.seen_ids)} unique ID)")
        
        # Browser başlat
        self.start_browser()
        
        try:
            # Kategorileri belirle
            cats_to_crawl = categories or list(HENDEK_CATEGORIES.keys())
            completed = self.checkpoint.get("completed_categories", [])
            
            for key in cats_to_crawl:
                if key in completed:
                    logger.info(f"\n⏭️ {key} zaten tamamlanmış, atlanıyor...")
                    continue
                
                if key not in HENDEK_CATEGORIES:
                    logger.warning(f"\n⚠️ Bilinmeyen kategori: {key}")
                    continue
                
                config = HENDEK_CATEGORIES[key]
                listings = self.crawl_category(key, config, max_pages)
                
                self.all_listings.extend(listings)
                self.stats["categories_completed"].append(key)
                self.stats["total_listings"] = len(self.all_listings)
                
                # Checkpoint kaydet
                self._save_checkpoint()
                
                # Kategoriler arası bekleme
                remaining = [k for k in cats_to_crawl if k not in self.stats["categories_completed"]]
                if remaining:
                    logger.info(f"\n⏳ Sonraki kategori için {CATEGORY_DELAY} saniye bekleniyor...")
                    time.sleep(CATEGORY_DELAY)
        
        except KeyboardInterrupt:
            logger.info("\n\n⏸️ Kullanıcı tarafından durduruldu")
            self._save_checkpoint()
        
        except Exception as e:
            logger.error(f"\n❌ Kritik hata: {e}")
            self._save_checkpoint()
            raise
        
        finally:
            self.close_browser()
        
        self.stats["completed_at"] = datetime.now().isoformat()
        self._save_output()
        
        # Özet
        logger.info("\n" + "=" * 60)
        logger.info("📊 ÖZET")
        logger.info("=" * 60)
        logger.info(f"   Toplam unique ilan: {len(self.all_listings)}")
        logger.info(f"   Toplam sayfa: {self.stats['total_pages']}")
        logger.info(f"   Atlanan duplicate: {self.stats['duplicates_skipped']}")
        logger.info(f"   Tamamlanan kategoriler: {len(self.stats['categories_completed'])}")
        logger.info(f"   Hatalar: {len(self.stats['errors'])}")
        
        # Kategori dağılımı
        logger.info("\n📂 Kategori Dağılımı:")
        category_counts = {}
        for listing in self.all_listings:
            key = f"{listing.get('category', 'bilinmeyen')}_{listing.get('transaction', 'bilinmeyen')}"
            category_counts[key] = category_counts.get(key, 0) + 1
        
        for cat, count in sorted(category_counts.items()):
            logger.info(f"   {cat}: {count}")
        
        return self.all_listings


def main():
    parser = argparse.ArgumentParser(description="Sahibinden UC Crawler")
    parser.add_argument("--categories", nargs="+", help="Sadece belirli kategoriler")
    parser.add_argument("--reset", action="store_true", help="Checkpoint sıfırla")
    parser.add_argument("--max-pages", type=int, default=MAX_PAGES_PER_CATEGORY, help="Kategori başına max sayfa")
    parser.add_argument("--job-id", type=str, help="Supabase job ID (API'den tetikleme için)")
    args = parser.parse_args()
    
    # Checkpoint sıfırla
    if args.reset and CHECKPOINT_FILE.exists():
        CHECKPOINT_FILE.unlink()
        logger.info("🗑️ Checkpoint sıfırlandı")
    
    crawler = SahibindenUCCrawler(job_id=args.job_id)
    crawler.run(categories=args.categories, max_pages=args.max_pages)


if __name__ == "__main__":
    main()
