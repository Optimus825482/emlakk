"""
ChromeDriver İndirme Script'i
==============================
Chromium için uyumlu ChromeDriver'ı indirir.
"""

import requests
import zipfile
import os
from pathlib import Path

def get_available_versions():
    """Mevcut ChromeDriver versiyonlarını listele"""
    url = "https://googlechromelabs.github.io/chrome-for-testing/known-good-versions-with-downloads.json"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
        versions = data.get("versions", [])
        print(f"📋 Toplam {len(versions)} versiyon bulundu")
        
        # Son 10 versiyonu göster
        print("\n🔍 Son 10 versiyon:")
        for v in versions[-10:]:
            version = v.get("version")
            print(f"   - {version}")
        
        return versions
        
    except Exception as e:
        print(f"❌ Versiyon listesi alınamadı: {e}")
        return []

def download_chromedriver(version="131.0.6778.204"):
    """ChromeDriver'ı indir"""
    
    url = f"https://storage.googleapis.com/chrome-for-testing-public/{version}/win64/chromedriver-win64.zip"
    
    # İndirme dizini
    download_dir = Path(__file__).parent / "chromedriver_custom"
    download_dir.mkdir(exist_ok=True)
    
    zip_path = download_dir / "chromedriver.zip"
    
    print(f"\n📥 ChromeDriver {version} indiriliyor...")
    print(f"URL: {url}")
    
    try:
        # İndir
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        with open(zip_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        print(f"✅ İndirildi: {zip_path}")
        
        # Zip'i aç
        print("📦 Zip açılıyor...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(download_dir)
        
        # chromedriver.exe yolunu bul
        chromedriver_exe = download_dir / "chromedriver-win64" / "chromedriver.exe"
        
        if chromedriver_exe.exists():
            print(f"✅ ChromeDriver hazır: {chromedriver_exe}")
            print(f"\n📍 Kullanım:")
            print(f"driver_executable_path=r'{chromedriver_exe}'")
            return str(chromedriver_exe)
        else:
            print(f"❌ chromedriver.exe bulunamadı: {chromedriver_exe}")
            return None
            
    except Exception as e:
        print(f"❌ Hata: {e}")
        return None

if __name__ == "__main__":
    # Mevcut versiyonları listele
    versions = get_available_versions()
    
    # Stable versiyon indir (131.x)
    print("\n" + "="*60)
    download_chromedriver("131.0.6778.204")

