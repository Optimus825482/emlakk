"""
Sahibinden Detay Crawler - Supabase Entegrasyonlu
=================================================
sahibinden_liste tablosundaki ilanların detaylarını çeker.
Cloudflare bypass için undetected_chromedriver kullanır.
Veriler direkt Supabase'e yazılır.

Kullanım:
   python sahibinden_uc_detail_supabase.py
   python sahibinden_uc_detail_supabase.py --max-listings 50
   python sahibinden_uc_detail_supabase.py --job-id <uuid>
   python sahibinden_uc_detail_supabase.py --reset
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
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment
load_dotenv()

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Paths
SCRIPT_DIR = Path(__file__).parent
CHROME_PROFILE = SCRIPT_DIR / "uc_chrome_profile"

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://cxeakfwtrlnjcjzvqdip.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")

# Ayarlar
DETAIL_DELAY_MIN = 0.5
DETAIL_DELAY_MAX = 1.5
MAX_RETRIES = 2
MAX_SESSION_RESTARTS = 3


class SahibindenDetailSupabaseCrawler:
    """Supabase entegrasyonlu Sahibinden detay crawler"""
    
    def __init__(self, job_id: Optional[str] = None):
        self.driver = None
        self.job_id = job_id
        self.supabase: Optional[Client] = None
        self.session_restart_count = 0  # Browser restart sayacı
        self.stats = {
            "started_at": None,
            "completed_at": None,
            "total_processed": 0,
            "successful": 0,
            "failed": 0,
            "skipped": 0,
            "errors": [],
        }
        self._init_supabase()
    
    def _init_supabase(self):
        """Supabase client başlat"""
        if not SUPABASE_KEY:
            logger.error("❌ SUPABASE_KEY bulunamadı!")
            return
        self.supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("✅ Supabase bağlantısı kuruldu")
    
    def _get_pending_listings(self, limit: int = None) -> List[Dict]:
        """Detayı çekilmemiş ilanları getir"""
        if not self.supabase:
            return []
        
        try:
            # detay_cekildi = false veya null olan ilanları al
            # VEYA koordinatları eksik olanları al
            query = self.supabase.table("sahibinden_liste")\
                .select("id, baslik, link, detay_cekildi, koordinatlar")\
                .or_("detay_cekildi.is.null,detay_cekildi.eq.false")\
                .order("id", desc=True)
            
            if limit:
                query = query.limit(limit)
            
            result = query.execute()
            data = result.data or []
            
            # Client-side validation to be sure
            filtered = [
                d for d in data 
                if not d.get("detay_cekildi") or not d.get("koordinatlar")
            ]
            return filtered
        except Exception as e:
            logger.error(f"❌ Pending listings alınamadı: {e}")
            return []
    
    def _update_job_progress(self, current: int, total: int, message: str = ""):
        """Job progress güncelle"""
        if not self.job_id or not self.supabase:
            return
        try:
            percentage = int((current / total * 100)) if total > 0 else 0
            self.supabase.table("mining_jobs").update({
                "progress": {"current": current, "total": total, "percentage": percentage},
                "stats": self.stats,
                "updated_at": datetime.now().isoformat()
            }).eq("id", self.job_id).execute()
        except Exception as e:
            logger.warning(f"Progress güncellenemedi: {e}")
    
    def _add_log(self, level: str, message: str, data: dict = None):
        """Mining log ekle"""
        if not self.supabase:
            return
        try:
            log_data = {
                "job_id": self.job_id,
                "level": level,
                "message": message,
                "data": data
            }
            # job_id yoksa bile genel log olarak kaydet
            if not self.job_id:
                log_data["job_id"] = None
            self.supabase.table("mining_logs").insert(log_data).execute()
        except Exception as e:
            logger.debug(f"Log yazılamadı: {e}")
    
    def _save_detail(self, listing_id: int, details: dict) -> bool:
        """Detayı Supabase'e kaydet"""
        if not self.supabase:
            return False
        
        try:
            # Ana tabloya detay bilgilerini ekle
            update_data = {
                "detay_cekildi": True,
                "detay_tarihi": datetime.now().isoformat(),
                "aciklama": details.get("aciklama", "")[:5000] if details.get("aciklama") else None,
                "ozellikler": details.get("ozellikler"),
                "ek_ozellikler": details.get("ek_ozellikler"),
                "resimler": details.get("resimler"),
                "resim_sayisi": details.get("resim_sayisi", 0),
                "koordinatlar": details.get("koordinatlar"),
                "satici": details.get("satici"),
                "ilan_no": details.get("ilan_no"),
            }
            
            # m2 fiyatı hesapla
            if details.get("ozellikler"):
                ozellikler = details["ozellikler"]
                m2_brut = ozellikler.get("m² (Brüt)", "").replace(".", "").replace(",", "")
                m2_net = ozellikler.get("m² (Net)", "").replace(".", "").replace(",", "")
                
                try:
                    m2 = int(m2_net) if m2_net.isdigit() else (int(m2_brut) if m2_brut.isdigit() else 0)
                    if m2 > 0:
                        update_data["m2"] = m2
                except:
                    pass
            
            self.supabase.table("sahibinden_liste")\
                .update(update_data)\
                .eq("id", listing_id)\
                .execute()
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Detay kayıt hatası: {e}")
            return False
    
    def _mark_failed(self, listing_id: int, error: str):
        """Başarısız ilanı işaretle"""
        if not self.supabase:
            return
        try:
            self.supabase.table("sahibinden_liste")\
                .update({
                    "detay_cekildi": True,
                    "detay_hatasi": error[:500],
                    "detay_tarihi": datetime.now().isoformat()
                })\
                .eq("id", listing_id)\
                .execute()
        except:
            pass
    
    def _get_chrome_options(self):
        """Chrome ayarları"""
        CHROME_PROFILE.mkdir(exist_ok=True)
        
        user_agent = (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
        )
        
        # Avoid profile lock issues by using a unique directory per session if possible
        # Or just verify it's not locked. For now, let's look at the defined CHROME_PROFILE.
        # Ideally, we should import uuid and use it.
        import uuid
        session_profile = f"{CHROME_PROFILE}_{uuid.uuid4().hex[:8]}"
        CHROME_PROFILE.parent.mkdir(parents=True, exist_ok=True)
        
        options = uc.ChromeOptions()
        options.add_argument(f'user-agent={user_agent}')
        options.add_argument(f"--window-size=1920,1080")
        options.add_argument(f'--user-data-dir={session_profile}')
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--lang=tr-TR')
        
        return options
    
    def start_browser(self):
        """Browser'ı başlat"""
        logger.info("🚀 Chrome başlatılıyor...")
        
        # Hardcoded paths from working test environment
        chromium_path = r"C:\Users\erkan\undetected-chromium\chromium\chrome-win\chrome.exe"
        chromedriver_path = r"C:\Users\erkan\chromedriver\win64-146.0.7643.0\chromedriver-win64\chromedriver.exe"
        
        options = self._get_chrome_options()
        
        # Use custom chromium if exists
        use_custom = os.path.exists(chromium_path) and os.path.exists(chromedriver_path)
        
        if use_custom:
            logger.info(f"📍 Özel Chromium kullanılıyor: {chromium_path}")
            options.binary_location = chromium_path
            
            self.driver = uc.Chrome(
                options=options,
                driver_executable_path=chromedriver_path,
                use_subprocess=False
            )
        else:
            logger.warning("⚠️ Özel Chromium bulunamadı, standart Chrome deneniyor...")
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
    
    def _human_like_delay(self, min_sec: float = 0.5, max_sec: float = 1.0):
        time.sleep(random.uniform(min_sec, max_sec))
    
    def _human_like_scroll(self):
        try:
            # Sadece bir kere hızlı scroll yap, harita yüklensin diye
            self.driver.execute_script("window.scrollTo(0, 400);")
            time.sleep(0.5)
        except:
            pass
    
    def _wait_for_cloudflare(self, timeout: int = 30) -> bool:
        """Cloudflare bekle"""
        start = time.time()
        while time.time() - start < timeout:
            try:
                ps = self.driver.page_source.lower()
                if "classifieddetailtitle" in ps or "classifiedinfolist" in ps:
                    return True
                if any(m in ps for m in ["cloudflare", "checking your browser", "turnstile"]):
                    time.sleep(1)
                    continue
                time.sleep(0.5)
            except:
                time.sleep(1)
        return False
    
    def _handle_devam_et(self) -> bool:
        """'Devam Et' butonunu tıkla - Hızlı"""
        try:
            ps = self.driver.page_source.lower()
            if "devam et" in ps or "btn-continue" in ps:
                # Direkt JS ile tıkla, action chain ile uğraşma
                self.driver.execute_script("document.getElementById('btn-continue')?.click();")
                time.sleep(1)
                return True
        except:
            pass
        return False

    def extract_details(self, html: str, listing: dict) -> dict:
        """HTML'den ilan detaylarını çıkar"""
        soup = BeautifulSoup(html, 'html.parser')
        details = {
            "id": listing.get("id"),
            "url": listing.get("link", ""),
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
            
            # Resimler
            resimler = []
            
            # AVIF source'lardan
            avif_sources = soup.select(".classifiedDetailPhotos source.avif-source[srcset]")
            for src in avif_sources:
                srcset = src.get("srcset", "")
                if srcset and "blank" not in srcset:
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
            
            # Harita koordinatları
            map_el = soup.select_one("#gmap")
            if map_el:
                lat = map_el.get("data-lat")
                lng = map_el.get("data-lng")
                if lat and lng:
                    details["koordinatlar"] = {"lat": lat, "lng": lng}
            
            details["basarili"] = True
            
        except Exception as e:
            details["hata"] = str(e)
            details["basarili"] = False
        
        return details
    
    def _is_session_valid(self) -> bool:
        """Browser session'ının geçerli olup olmadığını kontrol et"""
        if not self.driver:
            return False
        try:
            # Basit bir komut çalıştırarak session'ı test et
            _ = self.driver.current_url
            return True
        except Exception:
            return False
    
    def _restart_browser(self):
        """Browser'ı yeniden başlat"""
        self.session_restart_count += 1
        
        if self.session_restart_count > MAX_SESSION_RESTARTS:
            logger.error(f"❌ Maksimum browser restart sayısına ulaşıldı ({MAX_SESSION_RESTARTS})")
            self._add_log("error", f"❌ Maksimum browser restart sayısına ulaşıldı")
            raise Exception(f"Browser {MAX_SESSION_RESTARTS} kez yeniden başlatıldı, crawler durduruluyor")
        
        logger.info(f"🔄 Browser yeniden başlatılıyor... (restart #{self.session_restart_count})")
        self._add_log("warning", f"🔄 Browser session kapandı, yeniden başlatılıyor (#{self.session_restart_count})...")
        self.close_browser()
        time.sleep(3)
        self.start_browser()
        time.sleep(3)
        logger.info("✅ Browser yeniden başlatıldı")
    
    def crawl_detail(self, listing: dict) -> Optional[dict]:
        """Tek bir ilanın detayını çek"""
        url = listing.get("link", "")
        ilan_id = listing.get("id")
        baslik = listing.get("baslik", "")[:50]
        
        if not url:
            return None
        
        for retry in range(MAX_RETRIES):
            try:
                # Session kontrolü - geçersizse yeniden başlat
                if not self._is_session_valid():
                    self._restart_browser()
                
                self._add_log("info", f"🌐 Sayfa yükleniyor: {baslik}", {"url": url, "retry": retry})
                self.driver.get(url)
                self._human_like_delay(2, 4)
                
                if not self._wait_for_cloudflare(timeout=45):
                    if retry < MAX_RETRIES - 1:
                        self._add_log("warning", f"⚠️ Cloudflare timeout, retry {retry + 1}", {"url": url})
                        logger.warning(f"   ⚠️ Cloudflare timeout, retry {retry + 1}...")
                        continue
                    self._add_log("error", f"❌ Cloudflare bypass başarısız", {"url": url})
                    return {"id": ilan_id, "url": url, "hata": "Cloudflare timeout", "basarili": False}
                
                self._handle_devam_et()
                self._human_like_scroll()
                
                html = self.driver.page_source
                details = self.extract_details(html, listing)
                
                return details
                
            except Exception as e:
                error_str = str(e).lower()
                
                # Session hatası - browser'ı yeniden başlat
                if "invalid session" in error_str or "session" in error_str:
                    logger.warning(f"   ⚠️ Session hatası, browser yeniden başlatılıyor...")
                    self._restart_browser()
                    # Retry sayısını artırma, tekrar dene
                    continue
                
                if retry < MAX_RETRIES - 1:
                    self._add_log("warning", f"⚠️ Hata, retry {retry + 1}: {str(e)[:100]}", {"url": url})
                    logger.warning(f"   ⚠️ Hata, retry {retry + 1}: {e}")
                    self._human_like_delay(3, 5)
                else:
                    self._add_log("error", f"❌ Sayfa yüklenemedi: {str(e)[:100]}", {"url": url})
                    return {"id": ilan_id, "url": url, "hata": str(e), "basarili": False}
        
        return None

    def run(self, max_listings: int = None):
        """Toplu detay taramayı başlat"""
        logger.info("=" * 60)
        logger.info("🏠 SAHİBİNDEN DETAY SUPABASE CRAWLER")
        logger.info("=" * 60)
        
        self.stats["started_at"] = datetime.now().isoformat()
        self._add_log("info", "Detay crawler başlatıldı")
        
        # Bekleyen ilanları al
        pending = self._get_pending_listings(limit=max_listings)
        
        if not pending:
            logger.info("✅ Detayı çekilecek ilan yok!")
            return self.stats
        
        # Rastgele sırala (bot gibi görünmemek için)
        random.shuffle(pending)
        
        total = len(pending)
        logger.info(f"🎯 İşlenecek ilan sayısı: {total}")
        
        self.start_browser()
        
        try:
            for idx, listing in enumerate(pending, 1):
                ilan_id = listing.get("id")
                baslik = listing.get("baslik", "")[:40]
                
                logger.info(f"\n[{idx}/{total}] 📄 {baslik}...")
                self._add_log("info", f"[{idx}/{total}] 📄 İşleniyor: {baslik}", {"ilan_id": ilan_id})
                
                details = self.crawl_detail(listing)
                
                if details:
                    self.stats["total_processed"] += 1
                    
                    if details.get("basarili"):
                        if self._save_detail(ilan_id, details):
                            self.stats["successful"] += 1
                            ozellik_sayisi = len(details.get("ozellikler", {}))
                            resim_sayisi = details.get("resim_sayisi", 0)
                            logger.info(f"   ✅ {ozellik_sayisi} özellik, {resim_sayisi} resim")
                            self._add_log("success", f"✅ Detay kaydedildi: {ozellik_sayisi} özellik, {resim_sayisi} resim", {"ilan_id": ilan_id})
                        else:
                            self.stats["failed"] += 1
                            logger.warning(f"   ❌ Kayıt başarısız")
                            self._add_log("error", f"❌ Detay kaydedilemedi", {"ilan_id": ilan_id})
                    else:
                        self.stats["failed"] += 1
                        error = details.get("hata", "Unknown")
                        self._mark_failed(ilan_id, error)
                        self.stats["errors"].append({"id": ilan_id, "error": error})
                        logger.warning(f"   ❌ Hata: {error}")
                        self._add_log("error", f"❌ Detay çekilemedi: {error[:100]}", {"ilan_id": ilan_id})
                
                # Progress güncelle
                self._update_job_progress(idx, total, f"İşlenen: {idx}/{total}")
                
                # Rate limiting
                if idx < total:
                    delay = random.uniform(DETAIL_DELAY_MIN, DETAIL_DELAY_MAX)
                    if random.random() < 0.15:
                        delay += random.uniform(2, 5)
                    logger.info(f"   ⏳ {delay:.1f}s...")
                    time.sleep(delay)
        
        except KeyboardInterrupt:
            logger.info("\n\n⏸️ Kullanıcı tarafından durduruldu")
        
        except Exception as e:
            logger.error(f"\n❌ Kritik hata: {e}")
            self.stats["errors"].append({"error": str(e)})
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
        
        self._add_log("success", "Detay crawler tamamlandı", self.stats)
        
        return self.stats


def main():
    parser = argparse.ArgumentParser(description="Sahibinden Detay Supabase Crawler")
    parser.add_argument("--max-listings", type=int, help="Maksimum ilan sayısı")
    parser.add_argument("--job-id", type=str, help="Mining job ID")
    parser.add_argument("--reset", action="store_true", help="Tüm detay_cekildi flaglarını sıfırla")
    args = parser.parse_args()
    
    crawler = SahibindenDetailSupabaseCrawler(job_id=args.job_id)
    
    # Reset işlemi
    if args.reset and crawler.supabase:
        logger.info("🗑️ Detay flagları sıfırlanıyor...")
        crawler.supabase.table("sahibinden_liste")\
            .update({"detay_cekildi": False, "detay_hatasi": None})\
            .neq("id", 0)\
            .execute()
        logger.info("✅ Sıfırlama tamamlandı")
    
    crawler.run(max_listings=args.max_listings)


if __name__ == "__main__":
    main()
