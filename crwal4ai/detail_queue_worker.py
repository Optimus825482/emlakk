"""
Detail Queue Worker - Kuyruktan ilan detaylarını çeker
========================================================
Veritabanındaki listing_detail_queue tablosundan pending ilanları alır,
detaylarını çeker ve collected_listings tablosunu günceller.

Kullanım:
    python detail_queue_worker.py
    python detail_queue_worker.py --limit 10
    python detail_queue_worker.py --continuous
"""

import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from bs4 import BeautifulSoup
import psycopg2
import time
import json
import random
import logging
import argparse
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, List

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Dosya yolları
SCRIPT_DIR = Path(__file__).parent
CHROME_PROFILE = SCRIPT_DIR / "uc_detail_profile"

# Supabase bağlantı
DB_URL = "postgres://postgres.cxeakfwtrlnjcjzvqdip:G8gDkqRVkzX8mEs8@aws-1-us-east-1.pooler.supabase.com:6543/postgres"

# Ayarlar
DELAY_MIN = 3
DELAY_MAX = 6

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
]


class DetailQueueWorker:
    """Kuyruktan detay çeken worker"""
    
    def __init__(self):
        self.driver = None
        self.conn = None
        self.stats = {
            "processed": 0,
            "success": 0,
            "failed": 0,
        }
    
    def connect_db(self):
        """Veritabanına bağlan"""
        self.conn = psycopg2.connect(DB_URL)
        logger.info("✅ Veritabanına bağlandı")
    
    def close_db(self):
        """Veritabanı bağlantısını kapat"""
        if self.conn:
            self.conn.close()
    
    def start_browser(self):
        """Browser'ı başlat"""
        logger.info("🚀 Chrome başlatılıyor...")
        
        CHROME_PROFILE.mkdir(exist_ok=True)
        
        options = uc.ChromeOptions()
        options.add_argument(f'user-agent={random.choice(USER_AGENTS)}')
        options.add_argument(f"--window-size=1920,1080")
        options.add_argument(f'--user-data-dir={CHROME_PROFILE}')
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument('--no-sandbox')
        options.add_argument('--lang=tr-TR')
        
        self.driver = uc.Chrome(options=options)
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
    
    def get_pending_items(self, limit: int = 10) -> List[Dict]:
        """Kuyruktan pending itemları al"""
        cur = self.conn.cursor()
        cur.execute("""
            SELECT id, listing_id, source_id, source_url, attempts
            FROM listing_detail_queue
            WHERE status = 'pending' AND attempts < max_attempts
            ORDER BY RANDOM()
            LIMIT %s
        """, (limit,))
        
        items = []
        for row in cur.fetchall():
            items.append({
                "queue_id": row[0],
                "listing_id": row[1],
                "source_id": row[2],
                "source_url": row[3],
                "attempts": row[4],
            })
        
        cur.close()
        return items
    
    def mark_processing(self, queue_id: str):
        """Item'ı processing olarak işaretle"""
        cur = self.conn.cursor()
        cur.execute("""
            UPDATE listing_detail_queue
            SET status = 'processing', started_at = NOW(), attempts = attempts + 1
            WHERE id = %s
        """, (queue_id,))
        self.conn.commit()
        cur.close()
    
    def mark_completed(self, queue_id: str):
        """Item'ı completed olarak işaretle"""
        cur = self.conn.cursor()
        cur.execute("""
            UPDATE listing_detail_queue
            SET status = 'completed', completed_at = NOW()
            WHERE id = %s
        """, (queue_id,))
        self.conn.commit()
        cur.close()
    
    def mark_failed(self, queue_id: str, error: str):
        """Item'ı failed olarak işaretle"""
        cur = self.conn.cursor()
        cur.execute("""
            UPDATE listing_detail_queue
            SET status = CASE WHEN attempts >= max_attempts THEN 'failed' ELSE 'pending' END,
                error_message = %s
            WHERE id = %s
        """, (error, queue_id))
        self.conn.commit()
        cur.close()
    
    def update_listing(self, listing_id: str, details: Dict):
        """Listing'i detaylarla güncelle"""
        cur = self.conn.cursor()
        cur.execute("""
            UPDATE collected_listings
            SET description = %s,
                features = %s,
                images = %s,
                area = %s,
                processed_at = NOW()
            WHERE id = %s
        """, (
            details.get("description"),
            json.dumps(details.get("features", {}), ensure_ascii=False),
            json.dumps(details.get("images", []), ensure_ascii=False),
            details.get("area"),
            listing_id
        ))
        self.conn.commit()
        cur.close()
    
    def _human_delay(self, min_s: float = 1, max_s: float = 3):
        """İnsan benzeri bekleme"""
        time.sleep(random.uniform(min_s, max_s))
    
    def _wait_for_cloudflare(self, timeout: int = 60) -> bool:
        """Cloudflare bekle"""
        start = time.time()
        while time.time() - start < timeout:
            try:
                ps = self.driver.page_source.lower()
                if "classifieddetail" in ps or "classified-detail" in ps:
                    return True
                time.sleep(2)
            except:
                time.sleep(2)
        return False
    
    def extract_detail(self, url: str) -> Optional[Dict]:
        """Detay sayfasından bilgileri çıkar"""
        try:
            self.driver.get(url)
            self._human_delay(2, 4)
            
            if not self._wait_for_cloudflare():
                return None
            
            # Scroll
            self.driver.execute_script("window.scrollTo(0, 500);")
            self._human_delay(1, 2)
            
            html = self.driver.page_source
            soup = BeautifulSoup(html, 'html.parser')
            
            detail = {}
            
            # Açıklama
            desc_el = soup.select_one("#classifiedDescription")
            if desc_el:
                detail["description"] = desc_el.get_text(strip=True)
            
            # Özellikler
            features = {}
            info_list = soup.select("ul.classifiedInfoList li")
            for li in info_list:
                label = li.select_one("strong")
                value = li.select_one("span")
                if label and value:
                    key = label.get_text(strip=True).replace(":", "")
                    val = value.get_text(strip=True)
                    features[key] = val
                    
                    # Alan bilgisi
                    if "m²" in key.lower() or "brüt" in key.lower() or "net" in key.lower():
                        try:
                            area_val = int(''.join(filter(str.isdigit, val)))
                            if area_val > 0:
                                detail["area"] = area_val
                        except:
                            pass
            
            detail["features"] = features
            
            # Resimler
            images = []
            img_els = soup.select(".classifiedDetailMainPhoto img, .classifiedDetailPhotos img")
            for img in img_els:
                src = img.get("src") or img.get("data-src")
                if src and "shbdn.com" in src:
                    # Büyük resim URL'i
                    big_src = src.replace("/lthmb_", "/x5_").replace("/thmb_", "/x5_")
                    if big_src not in images:
                        images.append(big_src)
            
            detail["images"] = images[:20]  # Max 20 resim
            
            logger.info(f"✅ Detay çekildi: {len(detail.get('description', ''))} char, {len(features)} özellik, {len(images)} resim")
            
            return detail
            
        except Exception as e:
            logger.error(f"❌ Detay çekme hatası: {e}")
            return None
    
    def process_item(self, item: Dict) -> bool:
        """Tek bir item'ı işle"""
        queue_id = item["queue_id"]
        listing_id = item["listing_id"]
        source_id = item["source_id"]
        url = item["source_url"]
        
        logger.info(f"\n📄 İşleniyor: {source_id}")
        logger.info(f"   URL: {url[:60]}...")
        
        self.mark_processing(queue_id)
        
        try:
            details = self.extract_detail(url)
            
            if details:
                self.update_listing(listing_id, details)
                self.mark_completed(queue_id)
                self.stats["success"] += 1
                return True
            else:
                self.mark_failed(queue_id, "Detail extraction failed")
                self.stats["failed"] += 1
                return False
                
        except Exception as e:
            self.mark_failed(queue_id, str(e))
            self.stats["failed"] += 1
            return False
        
        finally:
            self.stats["processed"] += 1
    
    def run(self, limit: int = 10, continuous: bool = False):
        """Worker'ı çalıştır"""
        logger.info("=" * 60)
        logger.info("🔄 DETAIL QUEUE WORKER")
        logger.info("=" * 60)
        
        self.connect_db()
        self.start_browser()
        
        try:
            while True:
                items = self.get_pending_items(limit)
                
                if not items:
                    if continuous:
                        logger.info("⏳ Kuyruk boş, 60 saniye bekleniyor...")
                        time.sleep(60)
                        continue
                    else:
                        logger.info("✅ Kuyruk boş, çıkılıyor")
                        break
                
                logger.info(f"\n📋 {len(items)} item işlenecek")
                
                for item in items:
                    self.process_item(item)
                    
                    # İlanlar arası bekleme
                    delay = random.uniform(DELAY_MIN, DELAY_MAX)
                    logger.info(f"⏳ {delay:.1f} saniye bekleniyor...")
                    time.sleep(delay)
                
                if not continuous:
                    break
        
        except KeyboardInterrupt:
            logger.info("\n⏸️ Kullanıcı tarafından durduruldu")
        
        finally:
            self.close_browser()
            self.close_db()
        
        # Özet
        logger.info("\n" + "=" * 60)
        logger.info("📊 ÖZET")
        logger.info("=" * 60)
        logger.info(f"   İşlenen: {self.stats['processed']}")
        logger.info(f"   Başarılı: {self.stats['success']}")
        logger.info(f"   Başarısız: {self.stats['failed']}")


def main():
    parser = argparse.ArgumentParser(description="Detail Queue Worker")
    parser.add_argument("--limit", type=int, default=10, help="Her seferde işlenecek item sayısı")
    parser.add_argument("--continuous", action="store_true", help="Sürekli çalış")
    args = parser.parse_args()
    
    worker = DetailQueueWorker()
    worker.run(limit=args.limit, continuous=args.continuous)


if __name__ == "__main__":
    main()
