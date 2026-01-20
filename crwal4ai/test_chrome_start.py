"""
Chrome Başlatma Test Scripti
=============================
undetected_chromedriver'ın doğru çalışıp çalışmadığını test eder.
"""

import undetected_chromedriver as uc
import time
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def test_chrome_start():
    """Chrome başlatma testi"""
    chromium_path = r"C:\Users\erkan\undetected-chromium\chromium\chrome-win\chrome.exe"
    chromedriver_path = r"C:\Users\erkan\chromedriver\win64-146.0.7643.0\chromedriver-win64\chromedriver.exe"
    
    logger.info("🚀 Chrome başlatma testi başlıyor...")
    logger.info(f"📍 Chromium yolu: {chromium_path}")
    logger.info(f"📍 ChromeDriver yolu: {chromedriver_path}")
    
    try:
        # Minimal options
        options = uc.ChromeOptions()
        options.binary_location = chromium_path
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-gpu')
        options.add_argument('--remote-debugging-port=0')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_argument('--window-size=1920,1080')
        
        logger.info("⏳ Chrome başlatılıyor (use_subprocess=False, manual driver)...")
        
        # use_subprocess=False ile başlat + manuel driver
        driver = uc.Chrome(
            options=options,
            driver_executable_path=chromedriver_path,  # Manuel ChromeDriver 146
            use_subprocess=False,  # Subprocess KAPALI
            log_level=3  # Sadece kritik loglar
        )
        
        logger.info("✅ Chrome başarıyla başlatıldı!")
        
        # Test: Basit bir sayfaya git
        logger.info("🌐 Test sayfasına gidiliyor...")
        driver.get("https://www.google.com")
        time.sleep(2)
        
        logger.info(f"📄 Sayfa başlığı: {driver.title}")
        
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
    success = test_chrome_start()
    exit(0 if success else 1)
