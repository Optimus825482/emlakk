"""
Crawler Hızlı Test
==================
Tek kategori, tek sayfa ile crawler'ı test eder.
"""

import sys
import os

# Script dizinini path'e ekle
sys.path.insert(0, os.path.dirname(__file__))

from sahibinden_uc_batch_supabase import SahibindenSupabaseCrawler, HENDEK_CATEGORIES
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def test_crawler():
    """Crawler hızlı test"""
    logger.info("🚀 Crawler hızlı test başlıyor...")
    
    crawler = SahibindenSupabaseCrawler()
    
    try:
        # Browser başlat
        crawler.start_browser()
        
        # Tek kategori test et (konut_satilik)
        category_key = "konut_satilik"
        category_data = HENDEK_CATEGORIES[category_key]
        
        logger.info(f"📂 Test kategorisi: {category_key}")
        logger.info(f"🌐 URL: {category_data['url']}")
        
        # İlk sayfaya git
        html = crawler.navigate(category_data['url'])
        
        if html:
            logger.info("✅ Sayfa başarıyla yüklendi!")
            
            # İlanları çıkar
            listings = crawler.extract_listings(html)
            logger.info(f"📊 {len(listings)} ilan bulundu")
            
            # İlk 3 ilanı göster
            for i, listing in enumerate(listings[:3], 1):
                logger.info(f"  {i}. {listing.get('baslik', 'N/A')[:50]}... - {listing.get('fiyat', 'N/A')}")
            
            logger.info("✅ Test başarılı!")
            return True
        else:
            logger.error("❌ Sayfa yüklenemedi")
            return False
            
    except Exception as e:
        logger.error(f"❌ Test hatası: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False
        
    finally:
        # Temizlik
        crawler.close_browser()

if __name__ == "__main__":
    success = test_crawler()
    exit(0 if success else 1)
