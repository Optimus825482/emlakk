# Chrome Başlatma Sorunu - Çözüm

## Sorun

- Chromium 146 kullanılıyor
- undetected_chromedriver otomatik olarak Chrome 143 driver'ını indiriyor
- Version mismatch: "This version of ChromeDriver only supports Chrome version 143"

## Çözüm Seçenekleri

### Seçenek 1: Chromium 131 Kullan (ÖNERİLEN) ✅

```
Chromium 131 stable versiyonu kullan
undetected_chromedriver otomatik olarak uyumlu driver'ı indirir
```

**Adımlar:**

1. Chromium 131 indir: https://commondatastorage.googleapis.com/chromium-browser-snapshots/index.html?prefix=Win_x64/
2. Binary yolunu güncelle: `C:\Users\erkan\undetected-chromium\chromium-131\chrome-win\chrome.exe`

### Seçenek 2: Manuel ChromeDriver İndir

```python
# ChromeDriver 146 manuel indir (eğer varsa)
# https://googlechromelabs.github.io/chrome-for-testing/
```

### Seçenek 3: Selenium + Stealth Plugin

```python
from selenium import webdriver
from selenium_stealth import stealth

# Normal selenium + stealth
options = webdriver.ChromeOptions()
options.binary_location = chromium_path
driver = webdriver.Chrome(options=options)

stealth(driver,
    languages=["tr-TR", "tr"],
    vendor="Google Inc.",
    platform="Win32",
    webgl_vendor="Intel Inc.",
    renderer="Intel Iris OpenGL Engine",
    fix_hairline=True,
)
```

## Geçici Çözüm (Şu An)

```python
# version_main=None kullan (otomatik tespit)
# Ama yine de version mismatch oluyor
```

## Kalıcı Çözüm

**Chromium 131 stable kullan** - En stabil ve uyumlu seçenek
