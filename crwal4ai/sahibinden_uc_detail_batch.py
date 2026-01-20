"""
Sahibinden Detay Crawler - Undetected ChromeDriver
===================================================
hendek_uc_ilanlar.json'daki ilanların detaylarını çeker.
Cloudflare bypass için undetected_chromedriver kullanır.
Checkpoint ile kaldığı yerden devam eder.
Supabase job tracking desteği ile real-time progress.

Kullanım:
   python sahibinden_uc_detail_batch.py
   python sahibinden_uc_detail_batch.py --max-listings 50
   python sahibinden_uc_detail_batch.py --reset
   python sahibinden_uc_detail_batch.py --start-from 100
   python sahibinden_uc_detail_batch.py --job-id <uuid>  # API'den tetikleme için
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
import copy
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
INPUT_FILE = SCRIPT_DIR / "hendek_uc_ilanlar.json"
CHECKPOINT_FILE = SCRIPT_DIR / "uc_detail_checkpoint.json"
OUTPUT_FILE = SCRIPT_DIR / "hendek_detayli_ilanlar.json"

# Ayarlar
DETAIL_DELAY_MIN = 2  # İlanlar arası min bekleme (hızlandırıldı)
DETAIL_DELAY_MAX = 4  # İlanlar arası max bekleme (hızlandırıldı)
MAX_RETRIES = 2       # Sayfa yükleme retry sayısı


class SahibindenDetailCrawler:
    """Undetected ChromeDriver ile Sahibinden detay crawler"""
    
    def __init__(self, job_id: str = None):
        self.driver = None
        self.detailed_listings = []
        self.job_id = job_id
        self.supabase = None
        self.stats = {
            "started_at": None,
            "completed_at": None,
            "total_processed": 0,
            "successful": 0,
            "failed": 0,
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
                    "message": message or f"{current}/{total} detay çekildi"
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
        return {"processed_ids": [], "detailed_listings": []}
    
    def _save_checkpoint(self):
        """Checkpoint kaydet - HER VERİ SONRASI"""
        processed_ids = [d.get("id") for d in self.detailed_listings if d.get("id")]
        checkpoint = {
            "processed_ids": processed_ids,
            "detailed_listings": self.detailed_listings,
            "stats": self.stats,
            "saved_at": datetime.now().isoformat(),
        }
        with open(CHECKPOINT_FILE, 'w', encoding='utf-8') as f:
            json.dump(checkpoint, f, ensure_ascii=False, indent=2)
    
    def _save_single_detail(self, detail: dict):
        """Tek bir detayı anında kaydet"""
        self.detailed_listings.append(detail)
        self._save_checkpoint()
        
        # Output dosyasını da güncelle
        output = {
            "crawled_at": datetime.now().isoformat(),
            "stats": self.stats,
            "total_details": len(self.detailed_listings),
            "listings": self.detailed_listings,
        }
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
    
    def _save_output(self):
        """Final çıktıyı kaydet"""
        output = {
            "crawled_at": datetime.now().isoformat(),
            "stats": self.stats,
            "total_details": len(self.detailed_listings),
            "listings": self.detailed_listings,
        }
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        logger.info(f"💾 Tüm detaylar kaydedildi: {OUTPUT_FILE}")
    
    def _get_chrome_options(self):
        """Chrome ayarları"""
        CHROME_PROFILE.mkdir(exist_ok=True)
        
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
        """Browser'ı başlat"""
        logger.info("🚀 Chrome başlatılıyor...")
        
        options = self._get_chrome_options()
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
            finally:
                self.driver = None
    
    def _human_like_delay(self, min_sec: float = 1.0, max_sec: float = 2.5):
        """İnsan benzeri rastgele bekleme"""
        delay = random.uniform(min_sec, max_sec)
        time.sleep(delay)
    
    def _human_like_scroll(self, scroll_pause: float = 0.3):
        """Hızlı scroll - sadece biraz aşağı in"""
        try:
            # Sadece 2-3 kez scroll yap, hızlıca
            for _ in range(random.randint(2, 3)):
                scroll_amount = random.randint(300, 500)
                self.driver.execute_script(f"window.scrollBy(0, {scroll_amount});")
                time.sleep(random.uniform(0.15, 0.3))
        except:
            pass
    
    def _wait_for_cloudflare(self, timeout: int = 60) -> bool:
        """Cloudflare challenge'ı bekle"""
        start = time.time()
        
        while time.time() - start < timeout:
            try:
                ps = self.driver.page_source.lower()
                
                # Sahibinden detay içeriği var mı?
                if "classifieddetailtitle" in ps or "classifiedinfolist" in ps:
                    return True
                
                # Cloudflare challenge devam ediyor mu?
                if any(m in ps for m in ["cloudflare", "checking your browser", "turnstile"]):
                    time.sleep(2)
                    continue
                
                time.sleep(1)
                
            except Exception as e:
                time.sleep(2)
        
        return False
    
    def _handle_devam_et(self) -> bool:
        """'Devam Et' butonunu tıkla"""
        try:
            ps = self.driver.page_source.lower()
            
            if "devam et" in ps or "btn-continue" in ps:
                logger.info("🔍 'Devam Et' sayfası tespit edildi")
                
                try:
                    btn = WebDriverWait(self.driver, 10).until(
                        EC.element_to_be_clickable((By.ID, "btn-continue"))
                    )
                    
                    actions = ActionChains(self.driver)
                    actions.move_to_element(btn)
                    self._human_like_delay(0.3, 0.8)
                    actions.click()
                    actions.perform()
                    
                    logger.info("✅ 'Devam Et' tıklandı")
                    self._human_like_delay(2, 4)
                    return True
                    
                except:
                    pass
                    
        except:
            pass
        
        return False

    def extract_details(self, html: str, listing: dict) -> dict:
        """HTML'den ilan detaylarını çıkar"""
        soup = BeautifulSoup(html, 'html.parser')
        details = {
            "id": listing.get("id", ""),
            "url": listing.get("link", ""),
            "liste_bilgileri": listing,
        }
        
        try:
            # Başlık
            title_el = soup.select_one(".classifiedDetailTitle h1")
            if title_el:
                details["baslik"] = title_el.get_text(strip=True)
            
            # Fiyat
            price_el = soup.select_one("#favoriteClassifiedPrice")
            if price_el:
                details["fiyat"] = price_el.get("value", "").strip()
            
            # Konum (Breadcrumb)
            breadcrumb = soup.select("h2.classifiedDetailPath a")
            if breadcrumb:
                konum_parts = [a.get_text(strip=True) for a in breadcrumb]
                details["konum"] = " / ".join(konum_parts)
            
            # Özellikler (classifiedInfoList)
            ozellikler = {}
            info_items = soup.select("ul.classifiedInfoList li")
            
            for item in info_items:
                strong = item.select_one("strong")
                span = item.select_one("span")
                
                if strong and span:
                    key = strong.get_text(strip=True).replace("(TL)", "").strip()
                    value = span.get_text(strip=True)
                    
                    if key and value:
                        ozellikler[key] = value
            
            details["ozellikler"] = ozellikler
            
            # İlan No
            if "İlan No" in ozellikler:
                details["ilan_no"] = ozellikler["İlan No"]
            
            # Açıklama
            desc_el = soup.select_one("#classifiedDescription")
            if desc_el:
                details["aciklama"] = desc_el.get_text(strip=True)
                details["aciklama_html"] = str(desc_el)
            
            # Resimler
            resimler = []
            
            # AVIF source'lardan
            avif_sources = soup.select(".classifiedDetailPhotos source.avif-source[srcset]")
            for src in avif_sources:
                srcset = src.get("srcset", "")
                if srcset and "blank" not in srcset:
                    # AVIF'i JPG'ye çevir
                    jpg_url = srcset.replace(".avif", ".jpg")
                    if jpg_url not in resimler:
                        resimler.append(jpg_url)
            
            # Eğer AVIF yoksa img data-src'den
            if not resimler:
                img_els = soup.select(".classifiedDetailPhotos img[data-src]")
                for img in img_els:
                    src = img.get("data-src", "")
                    if src and "blank" not in src and src not in resimler:
                        resimler.append(src)
            
            # Thumbnail'lerden de al
            if not resimler:
                thumb_imgs = soup.select(".classifiedDetailPhotos img[src]")
                for img in thumb_imgs:
                    src = img.get("src", "")
                    if src and "blank" not in src and "lthmb" not in src:
                        # Büyük versiyonu al
                        big_src = src.replace("/lthmb_", "/x5_").replace("/thmb_", "/x5_")
                        if big_src not in resimler:
                            resimler.append(big_src)
            
            details["resimler"] = resimler
            details["resim_sayisi"] = len(resimler)
            
            # Ek Özellikler (classifiedProperties)
            ek_ozellikler = {}
            props_container = soup.select_one("#classifiedProperties")
            if props_container:
                h3_els = props_container.select("h3")
                for h3 in h3_els:
                    category = h3.get_text(strip=True)
                    ul = h3.find_next_sibling("ul")
                    if ul:
                        items = [li.get_text(strip=True) for li in ul.select("li")]
                        if items:
                            ek_ozellikler[category] = items
            
            if ek_ozellikler:
                details["ek_ozellikler"] = ek_ozellikler
            
            # Satıcı Bilgisi
            seller_box = soup.select_one(".classifiedUserBox")
            if seller_box:
                store_name = seller_box.select_one(".store-name, .username")
                if store_name:
                    details["satici"] = store_name.get_text(strip=True)
                
                year_badge = seller_box.select_one(".badge .year")
                if year_badge:
                    details["satici_yil"] = year_badge.get_text(strip=True)
            
            # Harita koordinatları
            map_el = soup.select_one("#gmap")
            if map_el:
                lat = map_el.get("data-lat")
                lng = map_el.get("data-lng")
                if lat and lng:
                    details["koordinatlar"] = {"lat": lat, "lng": lng}
            
            details["crawl_tarihi"] = datetime.now().isoformat()
            details["basarili"] = True
            
        except Exception as e:
            details["hata"] = str(e)
            details["basarili"] = False
        
        return details
    
    def crawl_detail(self, listing: dict) -> Optional[dict]:
        """Tek bir ilanın detayını çek"""
        url = listing.get("link", "")
        ilan_id = listing.get("id", "")
        
        if not url:
            return None
        
        for retry in range(MAX_RETRIES):
            try:
                self.driver.get(url)
                self._human_like_delay(2, 4)
                
                # Cloudflare bekle
                if not self._wait_for_cloudflare(timeout=45):
                    if retry < MAX_RETRIES - 1:
                        logger.warning(f"   ⚠️ Cloudflare timeout, retry {retry + 1}...")
                        continue
                    return {"id": ilan_id, "url": url, "hata": "Cloudflare timeout", "basarili": False}
                
                # Devam Et kontrolü
                self._handle_devam_et()
                
                # Human-like scroll
                self._human_like_scroll(scroll_pause=0.3)
                
                html = self.driver.page_source
                
                # Detayları çıkar
                details = self.extract_details(html, listing)
                
                return details
                
            except Exception as e:
                if retry < MAX_RETRIES - 1:
                    logger.warning(f"   ⚠️ Hata, retry {retry + 1}: {e}")
                    self._human_like_delay(3, 5)
                else:
                    return {"id": ilan_id, "url": url, "hata": str(e), "basarili": False}
        
        return None

    def run(self, max_listings: int = None, start_from: int = 0):
        """Toplu detay taramayı başlat - RASTGELE SIRA"""
        logger.info("=" * 60)
        logger.info("🏠 SAHİBİNDEN UC DETAY CRAWLER")
        logger.info("   Rastgele Sıra + Anında Kayıt")
        logger.info("=" * 60)
        
        # Input dosyasını yükle
        if not INPUT_FILE.exists():
            logger.error(f"❌ Input dosyası bulunamadı: {INPUT_FILE}")
            return
        
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        all_listings = data.get("listings", [])
        logger.info(f"📋 Toplam {len(all_listings)} ilan bulundu")
        
        # Checkpoint'ten devam
        processed_ids = set(self.checkpoint.get("processed_ids", []))
        if self.checkpoint.get("detailed_listings"):
            self.detailed_listings = self.checkpoint["detailed_listings"]
            logger.info(f"📥 Checkpoint'ten {len(self.detailed_listings)} detay yüklendi")
        
        # İşlenecek ilanları filtrele
        listings_to_process = []
        for listing in all_listings:
            ilan_id = listing.get("id", "")
            if ilan_id and ilan_id not in processed_ids:
                listings_to_process.append(listing)
        
        # ⚡ RASTGELE SIRALA - Bot gibi görünmemek için
        random.shuffle(listings_to_process)
        logger.info("🔀 İlanlar rastgele sıralandı!")
        
        # Max listings limiti
        if max_listings:
            listings_to_process = listings_to_process[:max_listings]
        
        total = len(listings_to_process)
        logger.info(f"🎯 İşlenecek ilan sayısı: {total}")
        
        if total == 0:
            logger.info("✅ Tüm ilanlar zaten işlenmiş!")
            return
        
        self.stats["started_at"] = datetime.now().isoformat()
        
        # Browser başlat
        self.start_browser()
        
        try:
            for idx, listing in enumerate(listings_to_process, 1):
                ilan_id = listing.get("id", "")
                baslik = listing.get("baslik", "")[:40]
                
                logger.info(f"\n[{idx}/{total}] 📄 {baslik}...")
                
                # Detayı çek
                details = self.crawl_detail(listing)
                
                if details:
                    self.stats["total_processed"] += 1
                    
                    if details.get("basarili"):
                        self.stats["successful"] += 1
                        ozellik_sayisi = len(details.get("ozellikler", {}))
                        resim_sayisi = details.get("resim_sayisi", 0)
                        logger.info(f"   ✅ {ozellik_sayisi} özellik, {resim_sayisi} resim")
                        
                        # Update job progress
                        self._update_job_progress(
                            current=idx,
                            total=total,
                            message=f"{idx}/{total} detay çekildi"
                        )
                        self._add_log("info", f"Detay çekildi: {baslik}", {
                            "id": ilan_id,
                            "ozellik_sayisi": ozellik_sayisi,
                            "resim_sayisi": resim_sayisi
                        })
                    else:
                        self.stats["failed"] += 1
                        self.stats["errors"].append({
                            "id": ilan_id,
                            "error": details.get("hata", "Unknown")
                        })
                        logger.warning(f"   ❌ Hata: {details.get('hata', 'Unknown')}")
                    
                    # ⚡ ANINDA KAYDET - Her veri sonrası
                    self._save_single_detail(details)
                    logger.info(f"   💾 Kaydedildi ({len(self.detailed_listings)} toplam)")
                
                # Rate limiting - rastgele bekleme
                if idx < total:
                    delay = random.uniform(DETAIL_DELAY_MIN, DETAIL_DELAY_MAX)
                    # Bazen biraz daha uzun bekle (doğal görünsün)
                    if random.random() < 0.15:
                        delay += random.uniform(2, 5)
                    logger.info(f"   ⏳ {delay:.1f}s...")
                    time.sleep(delay)
        
        except KeyboardInterrupt:
            logger.info("\n\n⏸️ Kullanıcı tarafından durduruldu")
        
        except Exception as e:
            logger.error(f"\n❌ Kritik hata: {e}")
            raise
        
        finally:
            self.close_browser()
        
        self.stats["completed_at"] = datetime.now().isoformat()
        
        # Özet
        logger.info("\n" + "=" * 60)
        logger.info("📊 ÖZET")
        logger.info("=" * 60)
        logger.info(f"   Toplam işlenen: {self.stats['total_processed']}")
        logger.info(f"   Başarılı: {self.stats['successful']}")
        logger.info(f"   Başarısız: {self.stats['failed']}")
        logger.info(f"   Toplam detay: {len(self.detailed_listings)}")
        
        return self.detailed_listings


def main():
    parser = argparse.ArgumentParser(description="Sahibinden UC Detay Crawler")
    parser.add_argument("--max-listings", type=int, help="Maksimum ilan sayısı")
    parser.add_argument("--reset", action="store_true", help="Checkpoint sıfırla")
    parser.add_argument("--job-id", type=str, help="Supabase job ID (API'den tetikleme için)")
    args = parser.parse_args()
    
    # Checkpoint sıfırla
    if args.reset and CHECKPOINT_FILE.exists():
        CHECKPOINT_FILE.unlink()
        logger.info("🗑️ Checkpoint sıfırlandı")
    
    crawler = SahibindenDetailCrawler(job_id=args.job_id)
    crawler.run(max_listings=args.max_listings)


if __name__ == "__main__":
    main()
