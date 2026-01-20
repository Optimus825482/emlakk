"""
ChromeDriver Cache Temizleme ve Güncelleme
==========================================
Undetected ChromeDriver'ın cache'ini temizler ve yeni driver indirir.
"""

import undetected_chromedriver as uc
import shutil
from pathlib import Path
import sys

def clear_uc_cache():
    """UC ChromeDriver cache'ini temizle"""
    try:
        # UC cache klasörü
        cache_dir = Path.home() / ".undetected_chromedriver"
        
        if cache_dir.exists():
            print(f"🗑️ Cache temizleniyor: {cache_dir}")
            shutil.rmtree(cache_dir)
            print("✅ Cache temizlendi")
        else:
            print("ℹ️ Cache klasörü bulunamadı")
        
        # Yeni driver indir
        print("\n📥 Yeni ChromeDriver indiriliyor...")
        options = uc.ChromeOptions()
        options.add_argument("--headless=new")
        
        driver = uc.Chrome(options=options, version_main=None)  # Auto-detect Chrome version
        print(f"✅ ChromeDriver başarıyla indirildi!")
        print(f"   Chrome version: {driver.capabilities['browserVersion']}")
        print(f"   ChromeDriver version: {driver.capabilities['chrome']['chromedriverVersion'].split()[0]}")
        
        driver.quit()
        print("\n✅ Tamamlandı! Artık crawler çalışabilir.")
        
    except Exception as e:
        print(f"❌ Hata: {e}")
        sys.exit(1)

if __name__ == "__main__":
    clear_uc_cache()
