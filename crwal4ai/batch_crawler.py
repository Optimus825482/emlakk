"""
Sahibinden Toplu Crawler
=========================
Tüm Hendek ilanlarını kategorilere göre toplu çeker.

Kullanım:
   python batch_crawler.py

Özellikler:
- Tüm kategorileri sırayla tarar
- Rate limiting (sayfa arası bekleme)
- Progress tracking
- Checkpoint/resume desteği
- JSON çıktı
"""

import asyncio
import json
import os
from datetime import datetime
from typing import Optional
from sahibinden_crawl4ai import SahibindenCrawl4AI

# Hendek kategorileri ve URL'leri
HENDEK_CATEGORIES = {
    "konut_satilik": {
        "url": "https://www.sahibinden.com/satilik/sakarya-hendek",
        "category": "konut",
        "transaction": "satilik",
    },
    "konut_kiralik": {
        "url": "https://www.sahibinden.com/kiralik/sakarya-hendek",
        "category": "konut",
        "transaction": "kiralik",
    },
    "isyeri_satilik": {
        "url": "https://www.sahibinden.com/satilik-isyeri/sakarya-hendek",
        "category": "isyeri",
        "transaction": "satilik",
    },
    "isyeri_kiralik": {
        "url": "https://www.sahibinden.com/kiralik-isyeri/sakarya-hendek",
        "category": "isyeri",
        "transaction": "kiralik",
    },
    "arsa_satilik": {
        "url": "https://www.sahibinden.com/satilik-arsa/sakarya-hendek",
        "category": "arsa",
        "transaction": "satilik",
    },
    "arsa_kiralik": {
        "url": "https://www.sahibinden.com/kiralik-arsa/sakarya-hendek",
        "category": "arsa",
        "transaction": "kiralik",
    },
    "bina_satilik": {
        "url": "https://www.sahibinden.com/satilik-bina/sakarya-hendek",
        "category": "bina",
        "transaction": "satilik",
    },
    "bina_kiralik": {
        "url": "https://www.sahibinden.com/kiralik-bina/sakarya-hendek",
        "category": "bina",
        "transaction": "kiralik",
    },
}

# Ayarlar
PAGE_DELAY = 5  # Sayfalar arası bekleme (saniye)
CATEGORY_DELAY = 10  # Kategoriler arası bekleme (saniye)
MAX_PAGES_PER_CATEGORY = 100  # Kategori başına max sayfa (20 ilan/sayfa = 2000 ilan)
CHECKPOINT_FILE = "batch_checkpoint.json"
OUTPUT_FILE = "hendek_tum_ilanlar.json"


class BatchCrawler:
    def __init__(self, headless: bool = False):
        self.crawler = SahibindenCrawl4AI()
        self.headless = headless
        self.all_listings = []
        self.stats = {
            "started_at": None,
            "completed_at": None,
            "categories_completed": [],
            "total_listings": 0,
            "total_pages": 0,
            "errors": [],
        }
        self.checkpoint = self.load_checkpoint()

    def load_checkpoint(self) -> dict:
        """Checkpoint dosyasını yükle"""
        if os.path.exists(CHECKPOINT_FILE):
            try:
                with open(CHECKPOINT_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
            except:
                pass
        return {"completed_categories": [], "listings": []}

    def save_checkpoint(self):
        """Checkpoint kaydet"""
        checkpoint = {
            "completed_categories": self.stats["categories_completed"],
            "listings": self.all_listings,
            "stats": self.stats,
            "saved_at": datetime.now().isoformat(),
        }
        with open(CHECKPOINT_FILE, "w", encoding="utf-8") as f:
            json.dump(checkpoint, f, ensure_ascii=False, indent=2)
        print(f"   💾 Checkpoint kaydedildi ({len(self.all_listings)} ilan)")

    def save_output(self):
        """Final çıktıyı kaydet"""
        output = {
            "crawled_at": datetime.now().isoformat(),
            "stats": self.stats,
            "total_listings": len(self.all_listings),
            "listings": self.all_listings,
        }
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        print(f"\n💾 Tüm ilanlar kaydedildi: {OUTPUT_FILE}")

    async def crawl_category(self, key: str, config: dict) -> list:
        """Tek kategoriyi crawl et"""
        url = config["url"]
        category = config["category"]
        transaction = config["transaction"]

        print(f"\n{'='*60}")
        print(f"📂 Kategori: {key}")
        print(f"   URL: {url}")
        print(f"   Tip: {category} / {transaction}")
        print(f"{'='*60}")

        category_listings = []
        page = 0

        while page < MAX_PAGES_PER_CATEGORY:
            page_url = url if page == 0 else f"{url}?pagingOffset={page * 20}"
            print(f"\n📄 Sayfa {page + 1} taranıyor...")

            try:
                result = await self.crawler.navigate_with_bypass(page_url)

                if not result["success"]:
                    print(f"   ❌ Sayfa yüklenemedi: {result.get('error', 'Bilinmeyen hata')}")
                    self.stats["errors"].append({
                        "category": key,
                        "page": page + 1,
                        "error": result.get("error"),
                    })
                    break

                listings = await self.crawler.extract_listings(result["html"])

                if not listings:
                    print(f"   ℹ️ Bu sayfada ilan yok, kategori tamamlandı")
                    break

                # Kategori bilgisi ekle
                for listing in listings:
                    listing["category"] = category
                    listing["transaction"] = transaction
                    listing["crawled_at"] = datetime.now().isoformat()

                category_listings.extend(listings)
                self.stats["total_pages"] += 1

                print(f"   ✅ {len(listings)} ilan bulundu (Kategori toplam: {len(category_listings)})")

                # Sonraki sayfa için bekle
                if page < MAX_PAGES_PER_CATEGORY - 1 and listings:
                    print(f"   ⏳ {PAGE_DELAY} saniye bekleniyor...")
                    await asyncio.sleep(PAGE_DELAY)

                page += 1

            except Exception as e:
                print(f"   ❌ Hata: {e}")
                self.stats["errors"].append({
                    "category": key,
                    "page": page + 1,
                    "error": str(e),
                })
                break

        return category_listings

    async def run(self, categories: Optional[list] = None):
        """Toplu taramayı başlat"""
        print("=" * 60)
        print("🚀 SAHİBİNDEN TOPLU CRAWLER")
        print("   Hendek Tüm İlanlar")
        print("=" * 60)

        self.stats["started_at"] = datetime.now().isoformat()

        # Checkpoint'ten devam et
        if self.checkpoint.get("listings"):
            self.all_listings = self.checkpoint["listings"]
            print(f"\n📥 Checkpoint'ten {len(self.all_listings)} ilan yüklendi")

        # Crawler başlat - headless=False önerilir (Cloudflare bypass için)
        await self.crawler.setup(headless=self.headless)

        try:
            # Kategorileri belirle
            cats_to_crawl = categories or list(HENDEK_CATEGORIES.keys())
            completed = self.checkpoint.get("completed_categories", [])

            for key in cats_to_crawl:
                if key in completed:
                    print(f"\n⏭️ {key} zaten tamamlanmış, atlanıyor...")
                    continue

                if key not in HENDEK_CATEGORIES:
                    print(f"\n⚠️ Bilinmeyen kategori: {key}")
                    continue

                config = HENDEK_CATEGORIES[key]
                listings = await self.crawl_category(key, config)

                self.all_listings.extend(listings)
                self.stats["categories_completed"].append(key)
                self.stats["total_listings"] = len(self.all_listings)

                # Checkpoint kaydet
                self.save_checkpoint()

                # Kategoriler arası bekleme
                remaining = [k for k in cats_to_crawl if k not in self.stats["categories_completed"]]
                if remaining:
                    print(f"\n⏳ Sonraki kategori için {CATEGORY_DELAY} saniye bekleniyor...")
                    await asyncio.sleep(CATEGORY_DELAY)

        except KeyboardInterrupt:
            print("\n\n⏸️ Kullanıcı tarafından durduruldu")
            self.save_checkpoint()

        except Exception as e:
            print(f"\n❌ Kritik hata: {e}")
            self.save_checkpoint()
            raise

        finally:
            await self.crawler.close()

        self.stats["completed_at"] = datetime.now().isoformat()
        self.save_output()

        # Özet
        print("\n" + "=" * 60)
        print("📊 ÖZET")
        print("=" * 60)
        print(f"   Toplam ilan: {len(self.all_listings)}")
        print(f"   Toplam sayfa: {self.stats['total_pages']}")
        print(f"   Tamamlanan kategoriler: {len(self.stats['categories_completed'])}")
        print(f"   Hatalar: {len(self.stats['errors'])}")

        # Kategori bazlı dağılım
        print("\n📂 Kategori Dağılımı:")
        category_counts = {}
        for listing in self.all_listings:
            key = f"{listing.get('category', 'bilinmeyen')}_{listing.get('transaction', 'bilinmeyen')}"
            category_counts[key] = category_counts.get(key, 0) + 1

        for cat, count in sorted(category_counts.items()):
            print(f"   {cat}: {count}")

        return self.all_listings


async def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Sahibinden Toplu Crawler")
    parser.add_argument("--headless", action="store_true", help="Headless mod (önerilmez)")
    parser.add_argument("--categories", nargs="+", help="Sadece belirli kategoriler")
    parser.add_argument("--reset", action="store_true", help="Checkpoint sıfırla")
    args = parser.parse_args()
    
    # Checkpoint sıfırla
    if args.reset and os.path.exists(CHECKPOINT_FILE):
        os.remove(CHECKPOINT_FILE)
        print("🗑️ Checkpoint sıfırlandı")
    
    # Headless=False önerilir (Cloudflare bypass için)
    crawler = BatchCrawler(headless=args.headless)
    
    # Kategorileri belirle
    categories = args.categories if args.categories else None
    
    await crawler.run(categories)


if __name__ == "__main__":
    asyncio.run(main())
