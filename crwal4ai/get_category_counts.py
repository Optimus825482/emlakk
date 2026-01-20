"""
Sahibinden.com'dan kategori sayılarını çeken lightweight script
API endpoint'inden çağrılır
"""

import undetected_chromedriver as uc
from bs4 import BeautifulSoup
import json
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
CHROME_PROFILE = SCRIPT_DIR / "uc_chrome_profile"


def get_category_counts():
    """Ana emlak sayfasından kategori sayılarını çek"""
    driver = None
    try:
        # Chrome options
        CHROME_PROFILE.mkdir(exist_ok=True)
        
        options = uc.ChromeOptions()
        options.add_argument(f'--user-data-dir={CHROME_PROFILE}')
        options.add_argument('--headless=new')  # Headless mode
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_argument('--window-size=1920,1080')
        
        # Driver başlat
        driver = uc.Chrome(options=options)
        driver.set_page_load_timeout(20)
        
        # Ana sayfaya git
        url = "https://www.sahibinden.com/emlak/sakarya-hendek"
        driver.get(url)
        
        # Sayfanın yüklenmesini bekle - daha uzun süre
        import time
        time.sleep(5)
        
        # Sayfanın yüklendiğini kontrol et
        try:
            from selenium.webdriver.common.by import By
            from selenium.webdriver.support.ui import WebDriverWait
            from selenium.webdriver.support import expected_conditions as EC
            
            # searchCategoryContainer'ın yüklenmesini bekle
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.ID, "searchCategoryContainer"))
            )
        except:
            # Yüklenmediyse biraz daha bekle
            time.sleep(3)
        
        # HTML'i al
        html = driver.page_source
        soup = BeautifulSoup(html, "html.parser")
        
        # Kategori sayılarını parse et
        category_counts = {}
        
        container = soup.select_one("#searchCategoryContainer")
        if not container:
            # Debug için HTML'in bir kısmını logla
            return {
                "success": False,
                "error": "searchCategoryContainer bulunamadı",
                "debug": html[:500] if html else "HTML yok"
            }
        
        items = container.select("li.cl1")
        
        if not items:
            return {
                "success": False,
                "error": "Kategori item'ları bulunamadı",
                "debug": str(container)[:500]
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
                "error": "Hiç kategori sayısı parse edilemedi",
                "items_found": len(items)
            }
        
        return {"success": True, "counts": category_counts}
        
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
