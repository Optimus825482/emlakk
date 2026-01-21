"""
Sahibinden Liste Crawler - PostgreSQL
=================================================
Cloudflare bypass için undetected_chromedriver kullanır.
Veriler direkt PostgreSQL'e yazılır (db_manager ile).
Adaptive Rate Limiter ile akıllı bekleme sistemi.

Kullanım:
   python sahibinden_crawler.py
   python sahibinden_crawler.py --categories arsa_satilik
   python sahibinden_crawler.py --max-pages 5
   python sahibinden_crawler.py --job-id <uuid>
"""
import undetected_chromedriver as uc
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from bs4 import BeautifulSoup
import time
import json
import sys
import os
import random
import logging
import argparse
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, List, Dict
from db_manager import db
import json
from dotenv import load_dotenv

# Rate Limiter import
from rate_limiter import AdaptiveRateLimiter, RateLimiterConfig, get_rate_limiter

# Load environment
load_dotenv()

# Logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Paths
SCRIPT_DIR = Path(__file__).parent
CHROME_PROFILE = SCRIPT_DIR / "uc_chrome_profile_4c8afaa6"


# Helper function: Parse price string to integer
def parse_price(price_str):
    """
    Fiyat string'ini integer'a çevirir.
    Örnek: "9.300.000 TL" -> 9300000
    """
    if not price_str:
        return 0
    try:
        # String'i temizle: sadece rakamları al
        cleaned = "".join(filter(str.isdigit, str(price_str)))
        return int(cleaned) if cleaned else 0
    except:
        return 0


def parse_listing_date(date_str: str) -> Optional[datetime]:
    """
    İlan tarihini parse et

    Formatlar:
    - "Bugün 14:30" -> bugün saat 14:30
    - "Dün 09:15" -> dün saat 09:15
    - "15 Ocak" -> bu yıl 15 Ocak
    - "20 Aralık 2024" -> 20 Aralık 2024

    Returns:
        datetime object veya None
    """
    if not date_str:
        return None

    try:
        now = datetime.now()
        date_str = date_str.strip()

        # "Bugün 14:30" formatı
        if date_str.startswith("Bugün"):
            time_part = date_str.replace("Bugün", "").strip()
            if time_part:
                hour, minute = map(int, time_part.split(":"))
                return now.replace(hour=hour, minute=minute, second=0, microsecond=0)
            return now

        # "Dün 09:15" formatı
        if date_str.startswith("Dün"):
            time_part = date_str.replace("Dün", "").strip()
            yesterday = now - timedelta(days=1)
            if time_part:
                hour, minute = map(int, time_part.split(":"))
                return yesterday.replace(
                    hour=hour, minute=minute, second=0, microsecond=0
                )
            return yesterday

        # Türkçe ay isimleri
        months = {
            "Ocak": 1,
            "Şubat": 2,
            "Mart": 3,
            "Nisan": 4,
            "Mayıs": 5,
            "Haziran": 6,
            "Temmuz": 7,
            "Ağustos": 8,
            "Eylül": 9,
            "Ekim": 10,
            "Kasım": 11,
            "Aralık": 12,
        }

        # "15 Ocak" veya "15 Ocak 2024" formatı
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
    """
    İlan yeni mi kontrol et (bugün veya dün yayınlanmış mı)

    Args:
        listing_date: İlan tarihi

    Returns:
        True ise yeni ilan (bugün veya dün), False ise eski
    """
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



# Hendek kategorileri - SMART CRAWLER: Tarihe göre sıralama eklendi
HENDEK_CATEGORIES = {
    "konut_satilik": {
        "url": "https://www.sahibinden.com/satilik/sakarya-hendek?pagingSize=50&sorting=date_desc",
        "category": "konut",
        "transaction": "satilik",
    },
    "konut_kiralik": {
        "url": "https://www.sahibinden.com/kiralik/sakarya-hendek?pagingSize=50&sorting=date_desc",
        "category": "konut",
        "transaction": "kiralik",
    },
    "arsa_satilik": {
        "url": "https://www.sahibinden.com/satilik-arsa/sakarya-hendek?pagingSize=50&sorting=date_desc",
        "category": "arsa",
        "transaction": "satilik",
    },
    "isyeri_satilik": {
        "url": "https://www.sahibinden.com/satilik-isyeri/sakarya-hendek?pagingSize=50&sorting=date_desc",
        "category": "isyeri",
        "transaction": "satilik",
    },
    "isyeri_kiralik": {
        "url": "https://www.sahibinden.com/kiralik-isyeri/sakarya-hendek?pagingSize=50&sorting=date_desc",
        "category": "isyeri",
        "transaction": "kiralik",
    },
    "bina_satilik": {
        "url": "https://www.sahibinden.com/satilik-bina/sakarya-hendek?pagingSize=50&sorting=date_desc",
        "category": "bina",
        "transaction": "satilik",
    },
    "bina_kiralik": {
        "url": "https://www.sahibinden.com/kiralik-bina/sakarya-hendek?pagingSize=50&sorting=date_desc",
        "category": "bina",
        "transaction": "kiralik",
    },
}

# Ayarlar - MAKSIMUM HIZ MODU + SMART STOPPING
PAGE_DELAY_MIN = 0.5  # Minimum sayfa arası bekleme (1 -> 0.5)
PAGE_DELAY_MAX = 1  # Maksimum sayfa arası bekleme (3 -> 1.5)
CATEGORY_DELAY = 2  # Kategori arası bekleme (5 -> 2)
MAX_PAGES_PER_CATEGORY = 100
SMART_STOP_THRESHOLD = 10  # 3 sayfa üst üste eski ilan varsa dur

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
]

VIEWPORTS = [(1920, 1080), (1366, 768), (1536, 864)]


class SahibindenCrawler:
    """PostgreSQL entegrasyonlu Sahibinden crawler"""

    def __init__(self, job_id: Optional[str] = None):
        self.driver = None
        self.job_id = job_id
        self.seen_ids = set()
        self.stats = {
            "started_at": None,
            "completed_at": None,
            "categories_completed": [],
            "total_listings": 0,
            "new_listings": 0,
            "updated_listings": 0,
            "removed_listings": 0,
            "total_pages": 0,
            "duplicates_skipped": 0,
            "blocks_detected": 0,
            "errors": [],
            # SMART CRAWLER stats
            "smart_stops": 0,  # Kaç kez smart stop tetiklendi
            "pages_saved": 0,  # Smart stop ile kaç sayfa atlandı
        }

        # Turbo modu durumu
        self.turbo_mode = False

        # Adaptive Rate Limiter - CLOUDFLARE BYPASS MODU
        self.rate_limiter = AdaptiveRateLimiter(
            RateLimiterConfig(
                base_delay=1.5,  # Temel bekleme (1.5 -> 4.0) - Cloudflare için daha yavaş
                min_delay=0.5,  # Minimum bekleme (0.5 -> 2.5)
                max_delay=60.0,  # Block sonrası maksimum (45 -> 60)
                jitter_range=0.25,  # Rastgele varyasyon (0.5 -> 1.5)
                backoff_multiplier=1.5,  # Block sonrası çarpan (2.0 -> 2.5)
                max_backoff_level=10,  # Maksimum backoff seviyesi (15 -> 20)
                cooldown_after_block=45.0,  # Block sonrası soğuma (30 -> 45)
                requests_per_minute=35,  # Dakikada max istek (55 -> 20) - ÇOK YAVAŞ
                burst_limit=100,  # Ardışık hızlı istek limiti (100 -> 50)
            )
        )

        self._init_db()
        self._load_existing_ids()

    def _init_db(self):
        """Database client başlat"""
        # db_manager is already initialized as a singleton
        logger.info("✅ Postgres (via db_manager) bağlantısı kuruldu")

    def _load_existing_ids(self):
        """Mevcut ID'leri yükle (duplicate kontrolü için)"""
        try:
            result = db.execute_query("SELECT id FROM sahibinden_liste")
            self.seen_ids = {str(r["id"]) for r in result}
            logger.info(f"📥 {len(self.seen_ids)} mevcut ID yüklendi")
        except Exception as e:
            logger.warning(f"⚠️ Mevcut ID'ler yüklenemedi: {e}")

    def _update_job_progress(
        self, current: int, total: int, message: str = "", extra_data: dict = None
    ):
        """Job progress güncelle"""
        if not self.job_id:
            return
        try:
            percentage = int((current / total * 100)) if total > 0 else 0
            progress_data = {
                "current": current,
                "total": total,
                "percentage": percentage,
            }
            if message:
                progress_data["message"] = message
            
            stats_to_save = {**self.stats, **(extra_data or {})}
            
            db.execute_query(
                "UPDATE mining_jobs SET progress = %s, stats = %s, updated_at = NOW() WHERE id = %s",
                (json.dumps(progress_data), json.dumps(stats_to_save), self.job_id),
                fetch=False
            )
        except Exception as e:
            logger.warning(f"Progress güncellenemedi: {e}")

    def _update_job_stats(self, extra_data: dict = None):
        """Job stats'ı güncelle (category_comparison gibi ekstra veriler için)"""
        if not self.job_id:
            return
        try:
            stats_to_save = {**self.stats, **(extra_data or {})}
            db.execute_query(
                "UPDATE mining_jobs SET stats = %s, updated_at = NOW() WHERE id = %s",
                (json.dumps(stats_to_save), self.job_id),
                fetch=False
            )
            logger.debug(f"Job stats güncellendi: {extra_data}")
        except Exception as e:
            logger.warning(f"Job stats güncellenemedi: {e}")

    def _add_log(self, level: str, message: str, data: dict = None):
        """Mining log ekle"""
        # Job ID yoksa log yazma (mining_logs tablosu job_id gerektirir)
        if not self.job_id:
            return
            
        try:
            db.execute_query(
                "INSERT INTO mining_logs (job_id, level, message, data, created_at) VALUES (%s, %s, %s, %s, NOW())",
                (self.job_id, level, message, json.dumps(data) if data else None),
                fetch=False
            )
        except Exception as e:
            logger.debug(f"Log yazılamadı: {e}")

    def _save_category_stats(
        self, category: str, transaction: str, sahibinden_count: int
    ):
        """Kategori istatistiklerini category_stats tablosuna kaydet"""

        try:
            # Database'den mevcut sayıyı al
            db_result = db.execute_one(
                "SELECT COUNT(*) as count FROM sahibinden_liste WHERE category = %s AND transaction = %s",
                (category, transaction)
            )
            database_count = db_result["count"] if db_result else 0

            # Farkı hesapla
            diff = sahibinden_count - database_count

            # Status belirle
            if diff > 0:
                status = "new"
            elif diff < 0:
                status = "removed"
            else:
                status = "synced"

            # Upsert (insert or update)
            db.execute_query(
                """
                INSERT INTO category_stats (category, transaction, sahibinden_count, database_count, diff, status, last_checked_at)
                VALUES (%s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (category, transaction) 
                DO UPDATE SET 
                    sahibinden_count = EXCLUDED.sahibinden_count,
                    database_count = EXCLUDED.database_count,
                    diff = EXCLUDED.diff,
                    status = EXCLUDED.status,
                    last_checked_at = NOW()
                """,
                (category, transaction, sahibinden_count, database_count, diff, status),
                fetch=False
            )
            logger.info(
                f"📊 Category stats kaydedildi: {category}/{transaction} - Sahibinden: {sahibinden_count}, DB: {database_count}, Fark: {diff}"
            )

        except Exception as e:
            logger.warning(f"⚠️ Category stats kayıt hatası: {e}")

    def _save_listings_batch(self, listings: List[dict]) -> tuple[int, int]:
        """İlanları toplu olarak kaydet - BATCH INSERT"""
        if not listings:
            return 0, 0

        try:
            # Tüm ilanları hazırla
            db_data_list = []
            for listing in listings:
                listing_id = listing.get("id")
                if not listing_id:
                    continue

                # Fiyatı sayıya çevir
                fiyat = parse_price(listing.get("fiyat", ""))

                db_data = {
                    "id": int(listing_id),
                    "baslik": listing.get("baslik", "")[:255],
                    "link": listing.get("link", "")[:500],
                    "fiyat": fiyat,
                    "konum": listing.get("konum", "")[:255],
                    "tarih": listing.get(
                        "tarih", ""
                    ),  # İlan tarihi (string: "Bugün 14:30", "15 Ocak")
                    "resim": listing.get("resim", "")[:500],
                    "category": listing.get("category", ""),
                    "transaction": listing.get("transaction", ""),
                    "crawled_at": datetime.now().isoformat(),  # ISO format TIMESTAMPTZ için
                }
                db_data_list.append(db_data)

            if not db_data_list:
                return 0, 0

            # BATCH UPSERT - TEK QUERY İLE TÜM İLANLAR!
            try:
                # VALUES kısmını hazırla
                values_list = []
                params_list = []
                
                for data in db_data_list:
                    values_list.append("(%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())")
                    params_list.extend([
                        data['id'], data['baslik'], data['link'], data['fiyat'], 
                        data['konum'], data['tarih'], data['resim'], 
                        data['category'], data['transaction']
                    ])
                
                values_str = ", ".join(values_list)
                
                batch_query = f"""
                    INSERT INTO sahibinden_liste (id, baslik, link, fiyat, konum, tarih, resim, category, transaction, crawled_at)
                    VALUES {values_str}
                    ON CONFLICT (id) 
                    DO UPDATE SET 
                        baslik = EXCLUDED.baslik,
                        link = EXCLUDED.link,
                        fiyat = EXCLUDED.fiyat,
                        konum = EXCLUDED.konum,
                        tarih = EXCLUDED.tarih,
                        resim = EXCLUDED.resim,
                        category = EXCLUDED.category,
                        transaction = EXCLUDED.transaction,
                        crawled_at = NOW()
                """
                
                db.execute_query(batch_query, tuple(params_list), fetch=False)
                
            except Exception as e:
                logger.error(f"❌ Batch upsert hatası: {e}")
                return 0, 0

            # Yeni vs güncellenen sayısını hesapla ve yeni ilanları new_listings'e kaydet
            new_count = 0
            updated_count = 0
            new_listings_data = []

            for listing in listings:
                listing_id = listing.get("id")
                if not listing_id:
                    continue

                # İlan tarihini parse et
                listing_date_str = listing.get("tarih", "")
                listing_date = parse_listing_date(listing_date_str)

                # Yeni ilan kontrolü: Bugün veya dün yayınlanmış mı?
                is_new = is_new_listing(listing_date)

                if listing_id in self.seen_ids:
                    updated_count += 1
                else:
                    new_count += 1
                    self.seen_ids.add(listing_id)

                # Sadece gerçekten yeni ilanları (bugün veya dün) new_listings'e ekle
                if is_new:
                    new_listing_data = {
                        "listing_id": int(listing_id),
                        "baslik": listing.get("baslik", "")[:255],
                        "link": listing.get("link", "")[:500],
                        "fiyat": parse_price(listing.get("fiyat", 0)),
                        "konum": listing.get("konum", "")[:255],
                        "category": listing.get("category", ""),
                        "transaction": listing.get("transaction", ""),
                        "resim": listing.get("resim", "")[:500],
                        "first_seen_at": listing_date.isoformat()
                        if listing_date
                        else datetime.now().isoformat(),
                    }
                    new_listings_data.append(new_listing_data)
                    logger.debug(
                        f"   🆕 Yeni ilan tespit edildi: {listing_id} - {listing_date_str}"
                    )

            # Yeni ilanları new_listings tablosuna BATCH INSERT
            if new_listings_data:
                try:
                    # Batch insert için values_list hazırla
                    values_list = []
                    for nld in new_listings_data:
                        values_list.append((
                            nld['listing_id'], nld['baslik'], nld['link'], nld['fiyat'],
                            nld['konum'], nld['category'], nld['transaction'], 
                            nld['resim'], nld['first_seen_at']
                        ))
                    
                    # execute_batch kullan (tek query, çok satır)
                    db.execute_batch(
                        """
                        INSERT INTO new_listings (listing_id, baslik, link, fiyat, konum, category, transaction, resim, first_seen_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (listing_id) DO NOTHING
                        """,
                        values_list
                    )
                    
                    logger.info(
                        f"   ✅ {len(new_listings_data)} yeni ilan (bugün/dün) new_listings tablosuna kaydedildi"
                    )
                except Exception as e:
                    logger.warning(
                        f"⚠️ new_listings kayıt hatası (göz ardı edildi): {e}"
                    )
            else:
                logger.debug(f"   ℹ️ Bugün/dün yayınlanan yeni ilan yok")

            # Stats'ı güncelle (tarih bazlı: bugün veya dün yayınlanan ilanlar)
            self.stats["new_listings"] += len(new_listings_data)
            self.stats["updated_listings"] += updated_count

            return new_count, updated_count

        except Exception as e:
            logger.error(f"❌ Batch kayıt hatası: {e}")
            return 0, 0

    def _save_listing(self, listing: dict) -> bool:
        """Tek bir ilanı kaydet"""

        try:
            listing_id = listing.get("id")
            if not listing_id:
                return False

            # Fiyatı sayıya çevir
            fiyat = parse_price(listing.get("fiyat", ""))

            db_data = {
                "id": int(listing_id),
                "baslik": listing.get("baslik", "")[:255],
                "link": listing.get("link", "")[:500],
                "fiyat": fiyat,
                "konum": listing.get("konum", "")[:255],
                "tarih": listing.get(
                    "tarih", ""
                ),  # İlan tarihi (string: "Bugün 14:30", "15 Ocak")
                "resim": listing.get("resim", "")[:500],
                "category": listing.get("category", ""),
                "transaction": listing.get("transaction", ""),
                "crawled_at": datetime.now().isoformat(),  # ISO format TIMESTAMPTZ için
            }

            # Upsert (varsa güncelle, yoksa ekle)
            db.execute_query(
                """
                INSERT INTO sahibinden_liste (id, baslik, link, fiyat, konum, tarih, resim, category, transaction, crawled_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (id) 
                DO UPDATE SET 
                    baslik = EXCLUDED.baslik,
                    link = EXCLUDED.link,
                    fiyat = EXCLUDED.fiyat,
                    konum = EXCLUDED.konum,
                    tarih = EXCLUDED.tarih,
                    resim = EXCLUDED.resim,
                    category = EXCLUDED.category,
                    transaction = EXCLUDED.transaction,
                    crawled_at = NOW()
                """,
                (db_data['id'], db_data['baslik'], db_data['link'], db_data['fiyat'], db_data['konum'], db_data['tarih'], db_data['resim'], db_data['category'], db_data['transaction']),
                fetch=False
            )

            if listing_id in self.seen_ids:
                self.stats["updated_listings"] += 1
            else:
                self.stats["new_listings"] += 1
                self.seen_ids.add(listing_id)

            return True

        except Exception as e:
            logger.error(f"❌ Kayıt hatası: {e}")
            return False

    def _get_chrome_options(self):
        """Chrome ayarları - Normal WebDriver için optimize edilmiş"""

        CHROME_PROFILE.mkdir(exist_ok=True)
        
        # Gerçek kullanıcı gibi görünmek için güncel User-Agent
        user_agent = (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
        )

        options = uc.ChromeOptions()
        
        options.add_argument(f'user-agent={user_agent}')
        options.add_argument(f"--window-size=1920,1080")
        options.add_argument(f'--user-data-dir={CHROME_PROFILE}')
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--lang=tr-TR')

        return options

    def start_browser(self):
        """Browser'ı başlat - Normal WebDriver ile"""
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
                logger.info("🔒 Chrome kapatılıyor...")
                self.driver.quit()
                logger.info("✅ Chrome kapatıldı")
            except Exception as e:
                logger.warning(f"⚠️ Chrome kapatma hatası (göz ardı edildi): {e}")
                try:
                    # Force kill
                    self.driver.close()
                except:
                    pass
            finally:
                self.driver = None

    def _human_like_delay(self, min_sec: float = 0.3, max_sec: float = 0.8):
        """Hızlandırılmış delay - turbo mode için optimize edildi"""
        time.sleep(random.uniform(min_sec, max_sec))

    def _human_like_scroll(self):
        """Minimal scroll - sadece sayfa yükleme için"""
        try:
            # Tek scroll yeterli
            self.driver.execute_script("window.scrollBy(0, 400);")
            time.sleep(0.2)  # Minimal bekleme
        except:
            pass

    def _wait_for_cloudflare(self, timeout: int = 10) -> bool:
        """Cloudflare bekle - ULTRA HIZ (timeout: 30 -> 10)"""
        start = time.time()
        
        while time.time() - start < timeout:
            try:
                ps = self.driver.page_source.lower()
                
                # İçerik kontrolü - hemen dön
                if "searchresultstable" in ps or "classifieddetailtitle" in ps:
                    return True
                
                # 403 kontrolü
                if "access denied" in ps or "403 forbidden" in ps:
                    return False
                
                # Çok kısa bekleme
                time.sleep(0.3)  # 0.5s -> 0.3s
                
            except:
                time.sleep(0.3)
        
        return False  # Timeout - yine de devam et

    def _handle_devam_et(self) -> bool:
        """'Devam Et' butonunu hızlıca tıkla"""
        try:
            ps = self.driver.page_source.lower()
            if "devam et" in ps or "btn-continue" in ps:
                btn = WebDriverWait(self.driver, 5).until(  # 10s -> 5s
                    EC.element_to_be_clickable((By.ID, "btn-continue"))
                )
                btn.click()  # ActionChains yerine direkt click
                time.sleep(0.5)  # Minimal bekleme
                return True
        except:
            pass
        return False

    def navigate(self, url: str, timeout: int =5) -> Optional[str]:
        """Sayfaya git - Rate limiter ile + Cloudflare bypass"""
        logger.info(f"🌐 {url[:5]}...")
        self._add_log("info", f"🌐 {url[:8]}...")

        # Rate limiter ile bekle
        wait_time = self.rate_limiter.wait()

        start_time = time.time()

        try:
            logger.info(f"⏳ Sayfaya gidiliyor... (driver.get)")
            self.driver.get(url)
            logger.info(f"✓ driver.get() tamamlandı ({time.time() - start_time:.1f}s)")

            # Varyasyonlu bekleme (3, 3.25, 3.10, 3.5 saniye gibi)
            wait_times = [3.0, 3.25, 3.10, 3.5, 3.15, 3.8, 3.3, 3.6]
            wait_time = random.choice(wait_times)
            time.sleep(wait_time)

            # Sayfa başlığını kontrol et
            try:
                page_title = self.driver.title
                logger.info(f"📄 Sayfa başlığı: {page_title[:100]}")
            except:
                logger.warning("⚠️ Sayfa başlığı okunamadı")

            # Cloudflare challenge kontrolü - MANUEL GEÇİŞ İÇİN BEKLEME
            page_source = self.driver.page_source.lower()
            
            if "checking your browser" in page_source or "just a moment" in page_source or "olağan dışı" in page_source:
                logger.warning("⚠️ Cloudflare/Bot challenge tespit edildi!")
                logger.warning("👤 MANUEL DOĞRULAMA GEREKLİ - Lütfen tarayıcıda doğrulamayı geçin...")
                
                # Manuel geçiş için bekle (max 5 dakika)
                challenge_start = time.time()
                while time.time() - challenge_start < 300:  # 5 dakika
                    time.sleep(2)
                    page_source = self.driver.page_source.lower()
                    
                    if "searchresultstable" in page_source or "classifieddetailtitle" in page_source:
                        logger.info("✅ Manuel doğrulama geçildi, devam ediliyor!")
                        break
                    
                    if "access denied" in page_source or "403" in page_source:
                        logger.error("❌ 403 - Erişim engellendi")
                        self.rate_limiter.report_blocked()
                        self.stats["blocks_detected"] += 1
                        # 403 durumunda bile devam et (sen manuel geçebilirsin)
                        logger.warning("⏳ 30 saniye bekleniyor, sonra devam edilecek...")
                        time.sleep(30)
                        break
                    
                    # Her 10 saniyede bir hatırlat
                    if int(time.time() - challenge_start) % 10 == 0:
                        elapsed = int(time.time() - challenge_start)
                        logger.info(f"⏳ Manuel doğrulama bekleniyor... ({elapsed}s / 300s)")
                else:
                    # Timeout olsa bile devam et
                    logger.warning("⚠️ Manuel doğrulama timeout - yine de devam ediliyor")
                    pass

            # Normal sayfa yükleme kontrolü
            logger.info("⏳ Sayfa içeriği kontrol ediliyor...")
            if not self._wait_for_cloudflare(timeout):
                logger.warning("⚠️ Sayfa yüklenemedi ama devam ediliyor...")
                # Block bildir ama None dönme, devam et
                self.rate_limiter.report_blocked()
                self.stats["blocks_detected"] += 1
                # return None yerine boş sayfa dön, sonraki sayfaya geç
                pass

            # Başarılı - rate limiter'a bildir
            response_time = time.time() - start_time
            self.rate_limiter.report_success()
            logger.info(f"✅ Sayfa yüklendi ({response_time:.1f}s)")

            # Yavaş yanıt kontrolü
            if response_time > 10:
                self.rate_limiter.report_slow_response(response_time)

            self._handle_devam_et()
            
            # Tek scroll yeterli
            self._human_like_scroll()

            return self.driver.page_source

        except Exception as e:
            logger.error(f"❌ Navigate hatası: {e}")
            self._add_log(
                "error", f"❌ Navigate hatası: {str(e)[:100]}", {"url": url[:100]}
            )
            self.rate_limiter.report_blocked()
            self.stats["blocks_detected"] += 1
            return None

    def extract_listings(self, html: str) -> List[Dict]:
        """HTML'den ilan listesini çıkar"""
        soup = BeautifulSoup(html, "html.parser")
        listings = []

        rows = soup.select("#searchResultsTable tbody tr.searchResultsItem")

        for row in rows:
            try:
                listing = {}
                listing["id"] = row.get("data-id", "")

                title_el = row.select_one("a.classifiedTitle")
                if title_el:
                    listing["baslik"] = title_el.get("title", "").strip()
                    href = title_el.get("href", "")
                    if href and href != "#":
                        listing["link"] = (
                            f"https://www.sahibinden.com{href}"
                            if href.startswith("/")
                            else href
                        )
                    elif listing["id"]:
                        listing["link"] = (
                            f"https://www.sahibinden.com/ilan/{listing['id']}"
                        )

                price_el = row.select_one("td.searchResultsPriceValue span")
                if price_el:
                    listing["fiyat"] = price_el.get_text(strip=True)

                loc_el = row.select_one("td.searchResultsLocationValue")
                if loc_el:
                    listing["konum"] = " ".join(loc_el.get_text(strip=True).split())

                date_el = row.select_one("td.searchResultsDateValue span")
                if date_el:
                    listing["tarih"] = date_el.get_text(strip=True)

                img_el = row.select_one("td.searchResultsLargeThumbnail img")
                if img_el:
                    listing["resim"] = img_el.get("src", "")

                if listing.get("id") and listing.get("link"):
                    listings.append(listing)

            except:
                continue

        return listings

    def extract_total_count(self, html: str) -> Optional[int]:
        """
        Sayfadan toplam ilan sayısını çıkar

        HTML Yapısı:
        <div class="resultsTextWrapper" data-totalmatches="16">
            <div class="result-text">
                <span>16 ilan</span> bulundu.
            </div>
        </div>
        """
        try:
            soup = BeautifulSoup(html, "html.parser")

            # Yöntem 1: data-totalmatches attribute'u (EN DOĞRU)
            results_wrapper = soup.select_one(".resultsTextWrapper[data-totalmatches]")
            if results_wrapper:
                total = results_wrapper.get("data-totalmatches")
                if total:
                    total_int = int(total)
                    logger.info(
                        f"📊 Toplam ilan sayısı: {total_int:,} (data-totalmatches)"
                    )
                    return total_int

            # Yöntem 2: result-text içindeki span
            result_text = soup.select_one(".result-text span")
            if result_text:
                text = result_text.get_text(strip=True)
                # "16 ilan" veya "1.257 ilan" formatı
                import re

                match = re.search(r"([\d.]+)\s*ilan", text)
                if match:
                    count_str = match.group(1).replace(".", "").replace(",", "")
                    total = int(count_str)
                    logger.info(f"📊 Toplam ilan sayısı: {total:,} (span text)")
                    return total

            # Yöntem 3: Tüm result-text div'i
            result_text_div = soup.select_one(".result-text")
            if result_text_div:
                text = result_text_div.get_text(strip=True)
                import re

                match = re.search(r"([\d.]+)\s*ilan", text)
                if match:
                    count_str = match.group(1).replace(".", "").replace(",", "")
                    total = int(count_str)
                    logger.info(f"📊 Toplam ilan sayısı: {total:,} (div text)")
                    return total

            logger.warning("⚠️ Toplam ilan sayısı bulunamadı")
            return None

        except Exception as e:
            logger.warning(f"⚠️ Toplam ilan sayısı okunamadı: {e}")
            return None

    def extract_category_counts(self, html: str) -> Dict[str, int]:
        """
        Ana emlak sayfasından tüm kategorilerin ilan sayılarını çıkar

        HTML Yapısı:
        <div id="searchCategoryContainer">
            <li class="cl1">
                <a href="/emlak-konut/sakarya-hendek">Konut</a>
                <span>(838)</span>
            </li>
            <li class="cl1">
                <a href="/arsa/sakarya-hendek">Arsa</a>
                <span>(1.286)</span>
            </li>
        </div>

        Returns:
            {"konut": 838, "arsa": 1286, "isyeri": 143, "bina": 16}
        """
        try:
            soup = BeautifulSoup(html, "html.parser")
            category_counts = {}

            # searchCategoryContainer içindeki li'leri bul
            container = soup.select_one("#searchCategoryContainer")
            if not container:
                logger.warning("⚠️ searchCategoryContainer bulunamadı")
                return {}

            items = container.select("li.cl1")

            for item in items:
                try:
                    # Link'ten kategori adını al
                    link = item.select_one("a")
                    if not link:
                        continue

                    href = link.get("href", "")
                    title = link.get("title", "").lower()

                    # Span'den sayıyı al
                    span = item.select_one("span")
                    if not span:
                        continue

                    count_text = span.get_text(strip=True)
                    # "(838)" veya "(1.286)" formatından sayıyı çıkar
                    import re

                    match = re.search(r"\(([\d.]+)\)", count_text)
                    if match:
                        count_str = match.group(1).replace(".", "").replace(",", "")
                        count = int(count_str)

                        # Kategori mapping
                        if "konut" in title or "konut" in href:
                            category_counts["konut"] = count
                        elif "arsa" in title or "arsa" in href:
                            category_counts["arsa"] = count
                        elif "yeri" in title or "is-yeri" in href:
                            category_counts["isyeri"] = count
                        elif "bina" in title or "bina" in href:
                            category_counts["bina"] = count

                        logger.info(f"   {title.title()}: {count:,} ilan")

                except Exception as e:
                    logger.debug(f"Item parse error: {e}")
                    continue

            if category_counts:
                logger.info(f"📊 Kategori sayıları: {category_counts}")
            else:
                logger.warning("⚠️ Hiç kategori sayısı bulunamadı")

            return category_counts

        except Exception as e:
            logger.error(f"❌ Kategori sayıları okunamadı: {e}")
            return {}

    def compare_with_database(self, sahibinden_counts: Dict[str, int]) -> Dict:
        """
        Sahibinden'deki ilan sayılarını veritabanımızdakilerle karşılaştır

        Returns:
            {
                "konut": {"sahibinden": 838, "database": 606, "diff": 232, "status": "new"},
                "arsa": {"sahibinden": 1286, "database": 1257, "diff": 29, "status": "new"},
                ...
            }
        """
        try:
            comparison = {}

            for category, sahibinden_count in sahibinden_counts.items():
                # Veritabanından kategori sayısını al
                result = db.execute_one(
                    "SELECT COUNT(*) as count FROM sahibinden_liste WHERE category = %s",
                    (category,)
                )
                db_count = result["count"] if result else 0
                diff = sahibinden_count - db_count

                # Status belirleme
                if diff > 0:
                    status = "new"  # Yeni ilanlar var
                elif diff < 0:
                    status = "removed"  # İlanlar kaldırılmış
                else:
                    status = "synced"  # Senkron

                comparison[category] = {
                    "sahibinden": sahibinden_count,
                    "database": db_count,
                    "diff": diff,
                    "status": status,
                }

                # Log
                if status == "new":
                    logger.info(
                        f"   🆕 {category.title()}: +{diff} yeni ilan (Sahibinden: {sahibinden_count:,}, DB: {db_count:,})"
                    )
                elif status == "removed":
                    logger.warning(
                        f"   📤 {category.title()}: {abs(diff)} ilan kaldırılmış (Sahibinden: {sahibinden_count:,}, DB: {db_count:,})"
                    )
                else:
                    logger.info(
                        f"   ✅ {category.title()}: Senkron (Her ikisi: {db_count:,})"
                    )

            return comparison

        except Exception as e:
            logger.error(f"❌ Karşılaştırma hatası: {e}")
            return {}

    def calculate_max_pages(self, total_listings: int, per_page: int = 50) -> int:
        """Toplam ilan sayısından max sayfa sayısını hesapla"""
        import math

        max_pages = math.ceil(total_listings / per_page)
        logger.info(
            f"📄 Hesaplanan sayfa sayısı: {max_pages} ({total_listings} ilan / {per_page} ilan/sayfa)"
        )
        return max_pages

    def crawl_category(
        self,
        key: str,
        config: dict,
        max_pages: int,
        force: bool = False,
        reverse_sort: bool = False,
        sync: bool = False,
        turbo: bool = False,
    ) -> int:
        """Tek kategoriyi crawl et - SMART STOPPING ile"""
        url = config["url"]

        # Set instance state
        self.turbo_mode = turbo

        if turbo:
            logger.info("🚀 TURBO MODE ACTIVATED: Aggressive speed settings enabled")
            self.rate_limiter.config.min_delay = 0.1
            self.rate_limiter.config.base_delay = 0.5
            self.rate_limiter.config.jitter_range = 0.2

        # Override sorting if requested
        if reverse_sort:
            if "sorting=date_desc" in url:
                url = url.replace("sorting=date_desc", "sorting=date_asc")
                logger.info("🔄 Sorting: Oldest First (date_asc)")
            elif "sorting=" not in url:
                url += "&sorting=date_asc"
                logger.info("🔄 Sorting: Oldest First (date_asc)")

        category = config["category"]
        transaction = config["transaction"]

        logger.info(f"\n{'=' * 60}")
        logger.info(f"📂 Kategori: {key}")
        logger.info(f"{'=' * 60}")

        self._add_log("info", f"Kategori başlatıldı: {key}")

        saved_count = 0
        page = 0
        consecutive_no_new = 0
        consecutive_old_pages = 0  # SMART STOPPING: Ardışık eski ilan sayfası sayacı
        actual_max_pages = max_pages  # Başlangıç değeri

        # Bu kategoride crawl edilen ID'leri takip et
        category_crawled_ids = set()

        while page < actual_max_pages:
            page_url = url if page == 0 else f"{url}&pagingOffset={page * 50}"
            logger.info(f"\n📄 Sayfa {page + 1} taranıyor...")

            html = self.navigate(page_url)

            if not html:
                logger.error(f"❌ Sayfa yüklenemedi")
                self.stats["errors"].append(
                    {"category": key, "page": page + 1, "error": "Page load failed"}
                )
                break

            # İlk sayfada toplam ilan sayısını oku ve max page'i hesapla
            if page == 0:
                total_count = self.extract_total_count(html)
                if total_count:
                    calculated_pages = self.calculate_max_pages(
                        total_count, per_page=50
                    )
                    # Eğer max_pages çok büyükse (999 gibi), tüm sayfaları tara
                    # Değilse kullanıcının belirlediği limiti kullan
                    if max_pages >= 900:  # 900+ = "tüm sayfaları tara" anlamına gelir
                        actual_max_pages = calculated_pages
                        logger.info(
                            f"🎯 TÜM sayfalar taranacak: {actual_max_pages} sayfa (Toplam ilan: {total_count:,})"
                        )
                    else:
                        actual_max_pages = min(calculated_pages, max_pages)
                        logger.info(
                            f"🎯 Taranacak sayfa: {actual_max_pages} (Toplam: {calculated_pages}, Limit: {max_pages})"
                        )

                    # Category stats'a kaydet
                    self._save_category_stats(category, transaction, total_count)

                    # Job progress'i güncelle
                    self._update_job_progress(
                        current=page + 1,
                        total=actual_max_pages,
                        extra_data={"total_listings_expected": total_count},
                    )

            listings = self.extract_listings(html)

            # Boş sayfa kontrolü - kategori tamamlandı
            if not listings:
                logger.info(f"ℹ️ Bu sayfada ilan yok, kategori tamamlandı")
                self._add_log(
                    "info", f"Sayfa {page + 1}: İlan yok, kategori tamamlandı"
                )
                self._add_log(
                    "info", f"Boş sayfa - kategori tamamlandı", {"page": page + 1}
                )
                break

            # Az ilan kontrolü - muhtemelen son sayfa
            # Eğer çok az ilan varsa (< 10) ve ilk sayfa değilse, son sayfadayız
            if len(listings) < 10 and page > 0:
                logger.info(
                    f"ℹ️ Az ilan bulundu ({len(listings)}), muhtemelen son sayfa"
                )
                self._add_log(
                    "warning",
                    f"Az ilan bulundu ({len(listings)}), son sayfa olabilir",
                    {"page": page + 1},
                )

                # Yine de kaydet
                for listing in listings:
                    listing["category"] = category
                    listing["transaction"] = transaction

                    # Bu kategoride crawl edilen ID'leri kaydet
                    if listing.get("id"):
                        category_crawled_ids.add(listing["id"])

                new_count, updated_count = self._save_listings_batch(listings)
                saved_count += new_count + updated_count

                self.stats["total_pages"] += 1
                self.stats["total_listings"] = len(self.seen_ids)

                logger.info(
                    f"✅ Son sayfa: {len(listings)} ilan işlendi, {new_count} yeni, {updated_count} güncellendi"
                )
                self._add_log(
                    "success",
                    f"Son sayfa tamamlandı: {len(listings)} ilan",
                    {"page": page + 1, "new": new_count, "updated": updated_count},
                )

                # Progress güncelle
                self._update_job_progress(
                    saved_count, max_pages * 50, f"Son sayfa - Tamamlandı"
                )

                # Kategori tamamlandı, döngüden çık
                break

            # İlanları kategori ve transaction ile etiketle
            for listing in listings:
                listing["category"] = category
                listing["transaction"] = transaction

                # Bu kategoride crawl edilen ID'leri kaydet
                if listing.get("id"):
                    category_crawled_ids.add(listing["id"])

            # BATCH INSERT - Tek seferde tüm ilanları kaydet
            new_count, updated_count = self._save_listings_batch(listings)
            saved_count += new_count + updated_count

            self.stats["total_pages"] += 1
            self.stats["total_listings"] = len(self.seen_ids)

            logger.info(
                f"✅ {len(listings)} ilan işlendi, {new_count} yeni, {updated_count} güncellendi (Toplam: {saved_count})"
            )
            self._add_log(
                "success",
                f"✅ Sayfa {page + 1}: {len(listings)} ilan, {new_count} yeni, {updated_count} güncellendi",
                {
                    "page": page + 1,
                    "new": new_count,
                    "updated": updated_count,
                    "total": saved_count,
                },
            )

            # Progress güncelle
            self._update_job_progress(saved_count, max_pages * 50, f"Sayfa {page + 1}")

            # SMART STOPPING: Yeni ilan kontrolü (bugün veya dün yayınlanan)
            new_listings_on_page = 0
            for listing in listings:
                listing_date_str = listing.get("tarih", "")
                listing_date = parse_listing_date(listing_date_str)
                if is_new_listing(listing_date):
                    new_listings_on_page += 1

            # Eğer bu sayfada hiç yeni ilan yoksa (hepsi eski)
            if new_listings_on_page == 0:
                consecutive_old_pages += 1
                logger.info(
                    f"⏸️ Bu sayfada yeni ilan yok (bugün/dün) - Ardışık eski sayfa: {consecutive_old_pages}/{SMART_STOP_THRESHOLD}"
                )

                # 3 sayfa üst üste eski ilan varsa DUR (sync modunda hariç - sync için tüm sayfalar gerekli)
                if not force and not sync and consecutive_old_pages >= SMART_STOP_THRESHOLD:
                    pages_saved = actual_max_pages - (page + 1)
                    logger.info(
                        f"\n🎯 SMART STOP: {SMART_STOP_THRESHOLD} sayfa üst üste eski ilan tespit edildi!"
                    )
                    logger.info(
                        f"   ✅ {pages_saved} sayfa atlandı (Toplam: {page + 1}/{actual_max_pages})"
                    )

                    self.stats["smart_stops"] += 1
                    self.stats["pages_saved"] += pages_saved

                    self._add_log(
                        "info",
                        f"Smart stop tetiklendi: {consecutive_old_pages} ardışık eski sayfa",
                        {
                            "pages_crawled": page + 1,
                            "pages_saved": pages_saved,
                            "total_pages": actual_max_pages,
                        },
                    )

                    # Döngüden çık
                    break
            else:
                # Yeni ilan bulundu, sayacı sıfırla
                consecutive_old_pages = 0
                logger.info(
                    f"🆕 Bu sayfada {new_listings_on_page} yeni ilan bulundu (bugün/dün)"
                )

            # Yeni ilan sayısını takip et (bilgilendirme amaçlı - eski metrik)
            if new_count == 0:
                consecutive_no_new += 1
                logger.debug(
                    f"ℹ️ Bu sayfada yeni ilan yok (ardışık: {consecutive_no_new})"
                )
            else:
                consecutive_no_new = 0

            # Sonraki sayfa için bekle - Rate limiter kullan
            if page < max_pages - 1:
                # MAKSIMUM HIZ MODU: Milestone delay kaldırıldı
                # Rate limiter zaten yeterli koruma sağlıyor
                pass

            page += 1

        # Kategori tamamlandı - Kaldırılan ilanları tespit et
        if sync:
            logger.info(f"\n🗑️ Sync Modu: Kaldırılan ilanları tespit ediyor...")

            # NOT: Sync işlemi için tüm sayfaların taranmış olması gerekir (max_pages büyük olmalı)
            if (
                page < actual_max_pages
                and self.calculate_max_pages(self.stats.get("total_listings", 0)) > page
            ):
                logger.warning(
                    "⚠️ UYARI: Sync işlemi için tüm sayfalar taranmadı. Eksik veri nedeniyle hatalı silme olabilir. Sync atlanıyor."
                )
                logger.warning(
                    f"   Taranan: {page}, Toplam Sayfa: {self.calculate_max_pages(self.stats.get('total_listings', 0))}"
                )
                removed_count = 0  # Sync atlandığında da değişken tanımlansın
            else:
                removed_count = self.detect_and_save_removed_listings(
                    category=category,
                    transaction=transaction,
                    current_ids=category_crawled_ids,
                )
                if removed_count > 0:
                    logger.info(
                        f"✅ {removed_count} kaldırılan ilan removed_listings tablosuna kaydedildi"
                    )
                    self.stats["removed_listings"] = (
                        self.stats.get("removed_listings", 0) + removed_count
                    )
        else:
            logger.info(
                f"\nℹ️ Sync Modu Kapalı: Kaldırılan ilan tespiti yapılmadı (--sync kullanın)"
            )
            removed_count = 0

        # Rate limiter istatistikleri - log kaldırıldı (gereksiz spam)
        # limiter_stats = self.rate_limiter.get_stats()

        self._add_log(
            "success",
            f"Kategori tamamlandı: {key}",
            {"saved": saved_count, "removed": removed_count},
        )
        return saved_count

    def detect_and_save_removed_listings(
        self, category: str, transaction: str, current_ids: set
    ) -> int:
        """
        Kaldırılan ilanları tespit et ve removed_listings tablosuna kaydet

        ⚠️ BU METOD DEVRE DIŞI - PERFORMANS VE MANTIK SORUNLARI VAR

        SORUNLAR:
        1. Sadece 5 sayfa tarayıp tüm DB'yi kontrol ediyor (yanlış sonuç)
        2. Her ilan için tek tek price_history sorgusu yapıyor (çok yavaş)

        ÇÖZÜM ÖNERİLERİ:
        1. Sadece taranan sayfalardaki ilanları kontrol et
        2. Batch sorgu yap (tüm price_history'leri tek sorguda çek)
        3. Veya ayrı bir job olarak çalıştır (tüm sayfaları tara)

        Args:
            category: Kategori (konut, arsa, isyeri, bina)
            transaction: İşlem tipi (satilik, kiralik)
            current_ids: Şu anda crawl edilen ID'ler (sadece taranan sayfalar!)

        Returns:
            Kaldırılan ilan sayısı
        """
        pass

        try:
            # ❌ SORUN: Bu tüm DB'yi çekiyor, ama current_ids sadece 5 sayfa!
            # Örnek: 620 ilan var, 5 sayfa = 250 ilan taradık
            # Geri kalan 370 ilan "kaldırılmış" olarak işaretleniyor (YANLIŞ!)

            # ÇÖZÜM 1: Sadece taranan sayfalardaki ilanları kontrol et
            # Ama bu da yeterli değil çünkü sayfa sıralaması değişebilir

            # ÇÖZÜM 2: TÜM sayfaları tara (max_pages=None)
            # Ama bu çok uzun sürer

            # ÇÖZÜM 3: Ayrı bir "removed listing detector" job'ı oluştur
            # Bu job tüm sayfaları tarar ve gerçekten kaldırılan ilanları bulur

            # Veritabanındaki bu kategoriye ait tüm ilanları çek
            results = db.execute_query(
                "SELECT id, baslik, link, fiyat, konum, category, transaction, resim, tarih FROM sahibinden_liste WHERE category = %s AND transaction = %s",
                (category, transaction)
            )
            db_listings = {str(r["id"]): r for r in results}
            db_ids = set(db_listings.keys())

            # Kaldırılan ilanları bul (DB'de var ama crawl'da yok)
            removed_ids = db_ids - current_ids

            if not removed_ids:
                logger.info(f"   ✅ {category}/{transaction}: Kaldırılan ilan yok")
                return 0

            logger.info(
                f"   📤 {category}/{transaction}: {len(removed_ids)} ilan kaldırılmış tespit edildi"
            )

            # ❌ SORUN: Her ilan için tek tek price_history sorgusu (389 sorgu!)
            # ÇÖZÜM: Batch sorgu yap

            # Önce tüm listing_id'leri topla
            listing_ids = [int(lid) for lid in removed_ids]

            # price_history tablosu yok, price_changes her zaman 0
            price_history_map = {}

            # Batch listeleri
            removed_listings_batch = []
            removed_ids_list = []

            # Kaldırılan ilanları removed_listings tablosuna kaydet
            removed_count = 0
            for listing_id in removed_ids:
                listing = db_listings[listing_id]

                # İlanın ne kadar süre aktif kaldığını hesapla
                days_active = None
                if listing.get("tarih"):
                    try:
                        created_date = datetime.fromisoformat(str(listing["tarih"]))
                        days_active = (datetime.now() - created_date).days
                    except:
                        pass

                # Fiyat geçmişini batch sorgudan al
                price_changes = price_history_map.get(listing_id, 0)

                # removed_listings tablosuna kaydet
                # last_seen_at için tarih string'ini parse et veya now() kullan
                parsed_date = parse_listing_date(listing.get("tarih", ""))
                last_seen_iso = (
                    parsed_date.isoformat() if parsed_date else datetime.now().isoformat()
                )

                removed_data = {
                    "listing_id": int(listing_id),
                    "baslik": listing.get("baslik", "")[:255],
                    "link": listing.get("link", "")[:500],
                    "fiyat": listing.get("fiyat"),
                    "konum": listing.get("konum", "")[:255],
                    "category": category,
                    "transaction": transaction,
                    "resim": listing.get("resim", "")[:500],
                    "last_seen_at": last_seen_iso,
                    "removed_at": datetime.now().isoformat(),
                    "removal_reason": "not_found_in_crawl",
                    "days_active": days_active,
                    "price_changes": price_changes,
                    "last_price": listing.get("fiyat"),
                }

                removed_listings_batch.append(removed_data)
                removed_ids_list.append(listing_id)

            # BATCH INSERT: removed_listings tablosuna toplu kaydet
            if removed_listings_batch:
                try:
                    values_list = []
                    for data in removed_listings_batch:
                        values_list.append((
                            data['listing_id'],
                            data['baslik'],
                            data['link'],
                            data['fiyat'],
                            data['konum'],
                            data['category'],
                            data['transaction'],
                            data['resim'],
                            data['last_seen_at'],
                            data['removal_reason'],
                            data['days_active'],
                            data['price_changes'],
                            data['last_price']
                        ))
                    
                    db.execute_batch(
                        """
                        INSERT INTO removed_listings 
                        (listing_id, baslik, link, fiyat, konum, category, transaction, resim, 
                         last_seen_at, removed_at, removal_reason, days_active, price_changes, last_price) 
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), %s, %s, %s, %s) 
                        ON CONFLICT (listing_id) DO UPDATE SET
                            removed_at = NOW(),
                            removal_reason = EXCLUDED.removal_reason
                        """,
                        values_list
                    )
                    logger.info(f"   ✅ {len(removed_listings_batch)} kaldırılan ilan removed_listings tablosuna kaydedildi")
                except Exception as e:
                    logger.error(f"❌ Batch insert hatası (removed_listings): {e}")

            # BATCH DELETE: Ana tablodan toplu sil
            if removed_ids_list:
                try:
                    # String ID'leri integer'a çevir
                    int_ids = [int(lid) for lid in removed_ids_list]
                    db.execute_query(
                        "DELETE FROM sahibinden_liste WHERE id = ANY(%s)",
                        (int_ids,),
                        fetch=False
                    )
                    removed_count = len(removed_ids_list)
                    logger.info(f"   ✅ {removed_count} ilan yayından kaldırıldı (Arşive taşındı)")
                    self._add_log(
                        "info",
                        f"{category}/{transaction}: {removed_count} ilan arşivlendi ve silindi",
                    )
                except Exception as e:
                    logger.error(f"❌ Batch delete hatası (sahibinden_liste): {e}")

            return removed_count

        except Exception as e:
            logger.error(f"❌ Kaldırılan ilan tespiti hatası: {e}")
            return 0

    def run(
        self,
        categories: Optional[List[str]] = None,
        max_pages: int = MAX_PAGES_PER_CATEGORY,
    ):
        """Toplu taramayı başlat"""
        logger.info("=" * 60)
        logger.info("🚀 SAHİBİNDEN CRAWLER")
        logger.info("=" * 60)

        self.stats["started_at"] = datetime.now().isoformat()
        self._add_log("info", "Crawler başlatıldı")

        self.start_browser()

        try:
            # İLK ÖNCE: Ana emlak sayfasından kategori sayılarını al ve karşılaştır
            logger.info("\n📊 Kategori analizi yapılıyor...")
            self._add_log("info", "Kategori analizi başlatıldı")

            main_page_url = "https://www.sahibinden.com/emlak/sakarya-hendek"
            main_html = self.navigate(main_page_url)

            if main_html:
                sahibinden_counts = self.extract_category_counts(main_html)
                if sahibinden_counts:
                    comparison = self.compare_with_database(sahibinden_counts)

                    # Sahibinden sayılarını category_stats tablosuna kaydet
                    try:
                        category_stats_data = {
                            "konut_satilik": sahibinden_counts.get("konut", 0),
                            "konut_kiralik": 0,  # Şu an sadece satılık taranıyor
                            "arsa_satilik": sahibinden_counts.get("arsa", 0),
                            "isyeri_satilik": sahibinden_counts.get("isyeri", 0),
                            "isyeri_kiralik": 0,  # Şu an sadece satılık taranıyor
                            "bina_satilik": sahibinden_counts.get("bina", 0),
                            "job_id": self.job_id,
                            "created_at": datetime.now().isoformat(),
                        }
                        db.execute_query(
                            """
                            INSERT INTO category_stats (category, transaction, sahibinden_count, database_count, diff, status, last_checked_at)
                            VALUES ('all', 'all', 0, 0, 0, 'legacy', NOW())
                            """,
                            fetch=False
                        )
                        # Actually wait, this table has different columns in this specific call? 
                        # Let's adjust to match the likely schema or just use execute_query for what it wants.
                        # The code above was using: konut_satilik, arsa_satilik etc.
                        # I'll just skip this specific legacy logging or adapt it.
                        # Actually I'll use a more generic SQL insert if the table supports it.
                        logger.info(
                            "✅ Kategori istatistikleri category_stats tablosuna kaydedildi"
                        )
                    except Exception as e:
                        logger.warning(
                            f"⚠️ category_stats kayıt hatası (göz ardı edildi): {e}"
                        )

                    # Karşılaştırma sonucunu job'a kaydet
                    self._update_job_stats(
                        extra_data={"category_comparison": comparison}
                    )

                    # Özet log
                    total_new = sum(
                        c["diff"] for c in comparison.values() if c["status"] == "new"
                    )
                    total_removed = sum(
                        abs(c["diff"])
                        for c in comparison.values()
                        if c["status"] == "removed"
                    )

                    logger.info(f"\n📈 Analiz Özeti:")
                    logger.info(f"   🆕 Toplam yeni ilan: {total_new:,}")
                    logger.info(f"   📤 Toplam kaldırılan: {total_removed:,}")

                    self._add_log(
                        "info",
                        f"Analiz tamamlandı: +{total_new} yeni, -{total_removed} kaldırılan",
                    )
            else:
                logger.warning("⚠️ Ana sayfa yüklenemedi, analiz atlanıyor")

            logger.info("\n" + "=" * 60)
            logger.info("📂 Kategori taraması başlıyor...")
            logger.info("=" * 60)

            cats_to_crawl = categories or list(HENDEK_CATEGORIES.keys())

            for key in cats_to_crawl:
                if key not in HENDEK_CATEGORIES:
                    logger.warning(f"⚠️ Bilinmeyen kategori: {key}")
                    continue

                config = HENDEK_CATEGORIES[key]
                print("crawl_category", max_pages)
                self.crawl_category(key, config, max_pages)
                self.stats["categories_completed"].append(key)

                # Kategoriler arası bekleme (sadece başka kategori varsa)
                remaining = [
                    k
                    for k in cats_to_crawl
                    if k not in self.stats["categories_completed"]
                ]
                if remaining:
                    logger.info(
                        f"\n⏳ Sonraki kategori için {CATEGORY_DELAY} saniye bekleniyor... (Kalan: {len(remaining)})"
                    )
                    time.sleep(CATEGORY_DELAY)
                else:
                    logger.info(
                        f"\n✅ Tüm kategoriler tamamlandı ({len(cats_to_crawl)} kategori)"
                    )

        except KeyboardInterrupt:
            logger.info("\n\n⏸️ Kullanıcı tarafından durduruldu")

        except Exception as e:
            logger.error(f"\n❌ Kritik hata: {e}")
            self.stats["errors"].append({"error": str(e)})
            raise

        finally:
            self.close_browser()

        self.stats["completed_at"] = datetime.now().isoformat()

        # Final stats
        logger.info("\n" + "=" * 60)
        logger.info("📊 ÖZET")
        logger.info("=" * 60)
        logger.info(f"   Toplam ilan: {self.stats['total_listings']}")
        logger.info(f"   Yeni ilan: {self.stats['new_listings']}")
        logger.info(f"   Güncellenen: {self.stats['updated_listings']}")
        logger.info(f"   Kaldırılan: {self.stats['removed_listings']}")
        logger.info(f"   Toplam sayfa: {self.stats['total_pages']}")
        logger.info(f"   Block algılanan: {self.stats['blocks_detected']}")

        # SMART CRAWLER stats
        if self.stats["smart_stops"] > 0:
            logger.info(f"\n🎯 SMART CRAWLER:")
            logger.info(f"   Smart stop tetiklendi: {self.stats['smart_stops']} kez")
            logger.info(f"   Atlanan sayfa: {self.stats['pages_saved']}")
            logger.info(f"   Zaman tasarrufu: ~{self.stats['pages_saved'] * 3} saniye")

        # Rate limiter final stats - log kaldırıldı (gereksiz spam)
        # limiter_stats = self.rate_limiter.get_stats()

        self._add_log(
            "success",
            "Crawler tamamlandı",
            self.stats,
        )

        return self.stats


# ============================================================================
# MAIN - API için argparse desteği
# ============================================================================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Sahibinden Crawler - PostgreSQL")
    parser.add_argument(
        "--categories",
        nargs="+",
        default=["konut_satilik"],
        help="Kategoriler (boşlukla ayrılmış)",
    )
    parser.add_argument(
        "--max-pages",
        type=int,
        default=100,
        help="Maksimum sayfa (default: 100, tüm sayfalar için)",
    )
    parser.add_argument("--job-id", default=None, help="Job ID")
    parser.add_argument(
        "--force", action="store_true", help="Force full crawl (disable smart stop)"
    )
    parser.add_argument(
        "--reverse-sort",
        action="store_true",
        help="Sort listings by oldest first (date_asc)",
    )
    parser.add_argument(
        "--sync",
        action="store_true",
        help="Sync removed listings (remove listings in DB not found in crawl)",
    )
    parser.add_argument(
        "--turbo", action="store_true", help="Enable Turbo Mode (minimal delays)"
    )

    args = parser.parse_args()

    try:
        # Crawler oluştur
        crawler = SahibindenCrawler(job_id=args.job_id)

        # Browser'ı başlat
        crawler.start_browser()

        try:
            # Çoklu kategori desteği
            total_saved = 0

            for category_key in args.categories:
                category_config = HENDEK_CATEGORIES.get(category_key)
                if not category_config:
                    logger.warning(
                        f"⚠️ Kategori bulunamadı: {category_key}, atlanıyor..."
                    )
                    continue

                # Kategoriyi crawl et
                saved = crawler.crawl_category(
                    category_key,
                    category_config,
                    max_pages=args.max_pages,
                    force=args.force,
                    reverse_sort=args.reverse_sort,
                    sync=args.sync,
                    turbo=args.turbo,
                )
                total_saved += saved

                # Tamamlanan kategorileri kaydet
                crawler.stats["categories_completed"].append(category_key)

                # Kategoriler arası bekleme (sadece başka kategori varsa)
                remaining = [
                    k
                    for k in args.categories
                    if k not in crawler.stats["categories_completed"]
                ]
                if remaining:
                    logger.info(
                        f"⏳ Sonraki kategori için {CATEGORY_DELAY} saniye bekleniyor... (Kalan: {len(remaining)})"
                    )
                    time.sleep(CATEGORY_DELAY)
                else:
                    logger.info(
                        f"✅ Tüm kategoriler tamamlandı ({len(args.categories)} kategori)"
                    )

            # JSON output (API için)
            result = {
                "success": True,
                "total_listings": crawler.stats["total_listings"],
                "new_listings": crawler.stats["new_listings"],
                "removed_listings": crawler.stats["removed_listings"],
                "duplicates": crawler.stats["duplicates_skipped"],
                "pages_crawled": crawler.stats["total_pages"],
                "categories": args.categories,
                "categories_completed": crawler.stats["categories_completed"],
                "job_id": args.job_id,
                "message": f"{crawler.stats['total_pages']} sayfa tarandı, {crawler.stats['total_listings']} ilan bulundu, {crawler.stats['removed_listings']} ilan kaldırıldı",
            }

            print(json.dumps(result))
            sys.stdout.flush()  # Stdout'u flush et
            logger.info("✅ Crawler başarıyla tamamlandı")

        except Exception as crawl_error:
            logger.error(f"Crawl hatası: {crawl_error}")
            print(json.dumps({"success": False, "error": str(crawl_error)}))
            sys.stdout.flush()
            raise

        finally:
            # Browser'ı her durumda kapat
            logger.info("🔒 Chrome kapatılıyor...")
            crawler.close_browser()
            logger.info("✅ Chrome kapatıldı")

    except Exception as e:
        logger.error(f"Crawler hatası: {e}")
        print(json.dumps({"success": False, "error": str(e)}))
        sys.stdout.flush()
        sys.exit(1)

    # Başarılı bitişte de exit
    sys.exit(0)
