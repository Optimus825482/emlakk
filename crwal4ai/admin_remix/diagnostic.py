#!/usr/bin/env python3
"""
Crawler Diagnostic Tool
=======================
Sunucuda crawler'ın neden çalışmadığını tespit eder.

Kullanım:
    python diagnostic.py
"""

import sys
import os
import subprocess
import platform
from pathlib import Path

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def check_python():
    """Python versiyonunu kontrol et"""
    print_section("Python Version")
    print(f"Python: {sys.version}")
    print(f"Executable: {sys.executable}")
    print(f"Platform: {platform.platform()}")

def check_chrome():
    """Chrome kurulu mu kontrol et"""
    print_section("Google Chrome")
    
    chrome_paths = [
        "/usr/bin/google-chrome",
        "/usr/bin/google-chrome-stable",
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    ]
    
    chrome_found = False
    for path in chrome_paths:
        if os.path.exists(path):
            print(f"✅ Chrome found: {path}")
            chrome_found = True
            
            # Version check
            try:
                result = subprocess.run(
                    [path, "--version"],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                print(f"   Version: {result.stdout.strip()}")
            except:
                pass
            break
    
    if not chrome_found:
        print("❌ Chrome not found!")
        print("   Install: apt-get install google-chrome-stable")

def check_display():
    """Display (Xvfb) kontrol et"""
    print_section("Display Environment")
    
    display = os.environ.get("DISPLAY")
    if display:
        print(f"✅ DISPLAY set: {display}")
    else:
        print("❌ DISPLAY not set!")
        print("   Set: export DISPLAY=:99")
    
    # Xvfb running?
    try:
        result = subprocess.run(
            ["ps", "aux"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if "Xvfb" in result.stdout:
            print("✅ Xvfb is running")
        else:
            print("❌ Xvfb not running!")
            print("   Start: Xvfb :99 -screen 0 1920x1080x24 &")
    except:
        print("⚠️  Cannot check Xvfb (ps command failed)")

def check_dependencies():
    """Python dependencies kontrol et"""
    print_section("Python Dependencies")
    
    required = [
        "undetected_chromedriver",
        "selenium",
        "beautifulsoup4",
        "psycopg2",
        "flask",
        "python-dotenv"
    ]
    
    for package in required:
        try:
            __import__(package.replace("-", "_"))
            print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package} not installed!")
            print(f"   Install: pip install {package}")

def check_database():
    """Database bağlantısını kontrol et"""
    print_section("Database Connection")
    
    # .env dosyasını yükle
    env_file = Path(__file__).parent / ".env"
    if env_file.exists():
        print(f"✅ .env file found: {env_file}")
        
        # DATABASE_URL'i oku
        with open(env_file) as f:
            for line in f:
                if line.startswith("DATABASE_URL"):
                    db_url = line.split("=", 1)[1].strip()
                    # Password'u gizle
                    if "@" in db_url:
                        parts = db_url.split("@")
                        masked = parts[0].split(":")[0] + ":****@" + parts[1]
                        print(f"   URL: {masked}")
                    break
    else:
        print(f"❌ .env file not found: {env_file}")
        print("   Create .env with DATABASE_URL")
    
    # Database bağlantısını test et
    try:
        from db_manager import db
        result = db.execute_one("SELECT 1 as test")
        if result and result.get("test") == 1:
            print("✅ Database connection successful")
        else:
            print("❌ Database query failed")
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")

def check_permissions():
    """Dosya izinlerini kontrol et"""
    print_section("File Permissions")
    
    script_dir = Path(__file__).parent
    
    # Chrome profile directory
    profile_dir = script_dir / "uc_chrome_profile"
    if profile_dir.exists():
        print(f"✅ Chrome profile exists: {profile_dir}")
        if os.access(profile_dir, os.W_OK):
            print("   ✅ Writable")
        else:
            print("   ❌ Not writable!")
    else:
        print(f"⚠️  Chrome profile will be created: {profile_dir}")
    
    # Log files
    log_file = script_dir / "crawler_debug.log"
    if log_file.exists():
        print(f"✅ Log file exists: {log_file}")
        # Son 10 satırı göster
        try:
            with open(log_file) as f:
                lines = f.readlines()
                if lines:
                    print("   Last 10 lines:")
                    for line in lines[-10:]:
                        print(f"   {line.rstrip()}")
        except:
            pass
    else:
        print(f"⚠️  No log file yet: {log_file}")

def check_crawler_script():
    """Crawler script'ini kontrol et"""
    print_section("Crawler Script")
    
    script_path = Path(__file__).parent / "sahibinden_uc_batch_supabase.py"
    if script_path.exists():
        print(f"✅ Crawler script found: {script_path}")
        
        # Syntax check
        try:
            result = subprocess.run(
                [sys.executable, "-m", "py_compile", str(script_path)],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                print("   ✅ Syntax OK")
            else:
                print(f"   ❌ Syntax error: {result.stderr}")
        except Exception as e:
            print(f"   ⚠️  Cannot check syntax: {str(e)}")
    else:
        print(f"❌ Crawler script not found: {script_path}")

def main():
    print("\n" + "="*60)
    print("  CRAWLER DIAGNOSTIC TOOL")
    print("="*60)
    
    check_python()
    check_chrome()
    check_display()
    check_dependencies()
    check_database()
    check_permissions()
    check_crawler_script()
    
    print("\n" + "="*60)
    print("  DIAGNOSTIC COMPLETE")
    print("="*60 + "\n")
    
    print("📋 Summary:")
    print("   - Check all ❌ items above")
    print("   - Fix issues before running crawler")
    print("   - Run: python sahibinden_uc_batch_supabase.py --help")
    print()

if __name__ == "__main__":
    main()
