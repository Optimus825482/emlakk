"""
Selenium + Stealth Test
========================
Normal selenium + stealth plugin ile Cloudflare bypass test
"""

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import time
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def test_selenium_stealth():
    """Selenium + Stealth test"""
    chromium_path = r"C:\Users\erkan\undetected-chromium\chromium\chrome-win\chrome.exe"
    
    logger.info("🚀 Selenium + Stealth test başlıyor...")
    logger.info(f"📍 Chromium yolu: {chromium_path}")
    
    try:
        # Chrome options
        options = Options()
        options.binary_location = chromium_path
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        
        # WebDriver Manager ile otomatik driver yönetimi
        logger.info("⏳ ChromeDriver indiriliyor/güncelleniyor...")
        service = Service(ChromeDriverManager().install())
        
        logger.info("⏳ Chrome başlatılıyor...")
        driver = webdriver.Chrome(service=service, options=options)
        
        # WebDriver özelliğini gizle
        driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
            'source': '''
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                });
            '''
        })
        
        logger.info("✅ Chrome başarıyla başlatıldı!")
        
        # Test: Sahibinden'e git
        logger.info("🌐 Sahibinden test ediliyor...")
        driver.get("https://www.sahibinden.com/emlak/sakarya-hendek")
        time.sleep(3)
        
        logger.info(f"📄 Sayfa başlığı: {driver.title}")
        
        # Cloudflare kontrolü
        if "cloudflare" in driver.page_source.lower():
            logger.warning("⚠️ Cloudflare challenge tespit edildi")
        else:
            logger.info("✅ Cloudflare bypass başarılı!")
        
        # Temizlik
        logger.info("🔒 Chrome kapatılıyor...")
        driver.quit()
        logger.info("✅ Test başarılı!")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Test başarısız: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

if __name__ == "__main__":
    success = test_selenium_stealth()
    exit(0 if success else 1)
