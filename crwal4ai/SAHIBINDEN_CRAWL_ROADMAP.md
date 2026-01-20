# 🏠 Sahibinden.com Emlak İlanları Crawl4AI Yol Haritası

## 📋 Proje Özeti

**Hedef:** https://www.sahibinden.com/emlak/sakarya-hendek sayfasındaki emlak ilanlarını crawl etmek

## 🚧 Ana Zorluk: Cloudflare Turnstile Koruması

Sahibinden.com, Cloudflare Turnstile bot koruması kullanıyor. Bu, standart crawling yöntemlerini engelliyor.

---

## 🛠️ Çözüm Stratejileri (Öncelik Sırasına Göre)

### Strateji 1: Identity-Based Crawling (ÖNERİLEN) ⭐

**En güvenilir ve sürdürülebilir yöntem**

```python
# 1. Önce profil oluştur (bir kez yapılır)
# Terminal'de:
# crawl4ai-setup profile

# 2. Açılan tarayıcıda sahibinden.com'a git
# 3. Cloudflare doğrulamasını manuel geç
# 4. İstersen giriş yap
# 5. Terminal'de 'q' bas - profil kaydedilir
```

**Avantajları:**

- Gerçek kullanıcı kimliği
- Cookie ve session korunur
- Cloudflare sizi tanır
- En stabil çözüm

### Strateji 2: Undetected Browser + Stealth Mode

```python
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig
from crawl4ai import UndetectedAdapter
from crawl4ai.async_crawler_strategy import AsyncPlaywrightCrawlerStrategy

browser_config = BrowserConfig(
    headless=False,  # Headless=False daha iyi çalışır
    enable_stealth=True,  # Stealth mode aktif
    verbose=True,
)

undetected_adapter = UndetectedAdapter()
crawler_strategy = AsyncPlaywrightCrawlerStrategy(
    browser_config=browser_config,
    browser_adapter=undetected_adapter
)
```

### Strateji 3: Magic Mode (Basit Durumlar İçin)

```python
run_config = CrawlerRunConfig(
    magic=True,  # Otomatik popup/consent yönetimi
    simulate_user=True,  # Kullanıcı simülasyonu
    override_navigator=True,  # Navigator override
)
```

### Strateji 4: CapSolver Entegrasyonu (Ücretli)

Cloudflare Turnstile token'ı almak için CapSolver API kullanılabilir.

---

## 📐 Sahibinden.com HTML Yapısı (Tahmini Schema)

```python
# İlan listesi için CSS Schema
schema = {
    "name": "Sahibinden Emlak İlanları",
    "baseSelector": "tr.searchResultsItem",  # veya div.classified-list-item
    "fields": [
        {
            "name": "ilan_id",
            "selector": "a.classifiedTitle",
            "type": "attribute",
            "attribute": "href"
        },
        {
            "name": "baslik",
            "selector": "a.classifiedTitle",
            "type": "text"
        },
        {
            "name": "fiyat",
            "selector": "td.searchResultsPriceValue span, .classified-price-container",
            "type": "text"
        },
        {
            "name": "konum",
            "selector": "td.searchResultsLocationValue, .classified-location",
            "type": "text"
        },
        {
            "name": "tarih",
            "selector": "td.searchResultsDateValue, .classified-date",
            "type": "text"
        },
        {
            "name": "oda_sayisi",
            "selector": "td.searchResultsAttributeValue:nth-child(4)",
            "type": "text"
        },
        {
            "name": "metrekare",
            "selector": "td.searchResultsAttributeValue:nth-child(5)",
            "type": "text"
        },
        {
            "name": "resim",
            "selector": "img.searchResultsImg",
            "type": "attribute",
            "attribute": "src"
        }
    ]
}
```

---

## 🚀 Uygulama Planı

### Faz 1: Ortam Hazırlığı

```bash
# 1. Crawl4AI kurulumu
pip install crawl4ai

# 2. Playwright tarayıcıları kur
crawl4ai-setup

# 3. Profil oluştur (Cloudflare bypass için)
crawl4ai-setup profile
```

### Faz 2: Temel Crawler Geliştirme

```
crwal4ai/
├── sahibinden_crawler.py    # Ana crawler
├── schemas/
│   └── emlak_schema.py      # CSS extraction schema
├── config/
│   └── browser_config.py    # Browser ayarları
├── utils/
│   └── cloudflare_handler.py # CF bypass yardımcıları
└── output/
    └── listings.json        # Çıktı dosyası
```

### Faz 3: Veri Çıkarma Stratejisi

1. **JsonCssExtractionStrategy** - Hızlı, LLM gerektirmez
2. Sayfa yapısı değişirse **LLMExtractionStrategy** backup olarak

### Faz 4: Pagination Yönetimi

```python
# Sayfalama için URL pattern
base_url = "https://www.sahibinden.com/emlak/sakarya-hendek"
# ?pagingOffset=20, ?pagingOffset=40, ...
```

---

## 📝 Örnek Kod Yapısı

```python
import asyncio
import json
from crawl4ai import (
    AsyncWebCrawler,
    BrowserConfig,
    CrawlerRunConfig,
    CacheMode
)
from crawl4ai import JsonCssExtractionStrategy

async def crawl_sahibinden():
    # Browser Config - Identity Based
    browser_config = BrowserConfig(
        headless=False,
        verbose=True,
        user_data_dir="~/.crawl4ai/profiles/sahibinden_profile",
        use_persistent_context=True,
        java_script_enabled=True,
        viewport_width=1920,
        viewport_height=1080,
    )

    # Extraction Schema
    schema = {
        "name": "Sahibinden Emlak",
        "baseSelector": "tr.searchResultsItem",
        "fields": [
            {"name": "baslik", "selector": "a.classifiedTitle", "type": "text"},
            {"name": "fiyat", "selector": "td.searchResultsPriceValue span", "type": "text"},
            {"name": "konum", "selector": "td.searchResultsLocationValue", "type": "text"},
            {"name": "link", "selector": "a.classifiedTitle", "type": "attribute", "attribute": "href"},
        ]
    }

    # Run Config
    run_config = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        extraction_strategy=JsonCssExtractionStrategy(schema),
        wait_for="css:tr.searchResultsItem",
        page_timeout=60000,
        delay_before_return_html=2.0,  # Cloudflare için bekle
    )

    async with AsyncWebCrawler(config=browser_config) as crawler:
        result = await crawler.arun(
            url="https://www.sahibinden.com/emlak/sakarya-hendek",
            config=run_config
        )

        if result.success:
            data = json.loads(result.extracted_content)
            print(f"✅ {len(data)} ilan bulundu!")
            return data
        else:
            print(f"❌ Hata: {result.error_message}")
            return None

if __name__ == "__main__":
    asyncio.run(crawl_sahibinden())
```

---

## ⚠️ Önemli Notlar

### Cloudflare Bypass İçin:

1. **headless=False** kullan (detection daha zor)
2. **Gerçekçi viewport** boyutları kullan
3. **Delay** ekle (delay_before_return_html)
4. **User profile** kullan (en etkili)

### Rate Limiting:

- İstekler arası **2-5 saniye** bekle
- Günlük **maksimum istek sayısı** belirle
- **IP rotasyonu** düşün (proxy)

### Legal Uyarı:

- robots.txt'e uy
- Aşırı yük bindirme
- Kişisel veri işleme kurallarına dikkat

---

## 🔄 Sonraki Adımlar

1. [ ] Profil oluştur ve Cloudflare'ı geç
2. [ ] HTML yapısını analiz et (gerçek selector'ları bul)
3. [ ] Schema'yı güncelle
4. [ ] Pagination ekle
5. [ ] Error handling ekle
6. [ ] Demir-gayrimenkul projesine entegre et

---

## 📚 Referanslar

- [Crawl4AI Docs](https://docs.crawl4ai.com)
- [Identity Based Crawling](https://docs.crawl4ai.com/advanced/identity-based-crawling/)
- [Undetected Browser](https://docs.crawl4ai.com/advanced/undetected-browser/)
- [Hooks & Auth](https://docs.crawl4ai.com/advanced/hooks-auth/)
