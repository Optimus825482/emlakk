"""
Sahibinden.com Ilan Detay Crawler
=================================
Her ilanin detay sayfasina gidip tum bilgileri ceker.

Kullanim:
1. Chrome'u debug modda ac (PowerShell):
   Start-Process "C:/Program Files/Google/Chrome/Application/chrome.exe" -ArgumentList "--remote-debugging-port=9222", "--user-data-dir=C:/Users/erkan/chrome_debug_profile"

2. Sahibinden sayfasina git ve Cloudflare'i gec

3. Bu scripti calistir:
   python sahibinden_detail_crawler.py
"""

import asyncio
import json
import re
from datetime import datetime
from playwright.async_api import async_playwright


async def extract_listing_details(page) -> dict:
    """Detay sayfasından tüm bilgileri çeker"""
    details = {}
    
    try:
        # Başlık
        title_el = page.locator(".classifiedDetailTitle h1")
        if await title_el.count() > 0:
            details["baslik"] = (await title_el.inner_text()).strip()
        
        # Fiyat
        price_el = page.locator("#favoriteClassifiedPrice")
        if await price_el.count() > 0:
            details["fiyat"] = (await price_el.get_attribute("value") or "").strip()
        
        # Konum (Breadcrumb'dan)
        breadcrumb_links = page.locator("ul.classifiedInfoList").locator("..").locator("h2 a")
        konum_parts = []
        bc_count = await breadcrumb_links.count()
        for i in range(bc_count):
            part = (await breadcrumb_links.nth(i).inner_text()).strip()
            if part:
                konum_parts.append(part)
        if konum_parts:
            details["konum"] = " / ".join(konum_parts)
        
        # Özellikler (classifiedInfoList)
        ozellikler = {}
        info_items = page.locator("ul.classifiedInfoList li")
        item_count = await info_items.count()
        
        for i in range(item_count):
            item = info_items.nth(i)
            strong_el = item.locator("strong")
            span_el = item.locator("span")
            
            if await strong_el.count() > 0 and await span_el.count() > 0:
                key = (await strong_el.inner_text()).strip()
                value = (await span_el.first.inner_text()).strip()
                
                # Key'i normalize et
                key = key.replace("(TL)", "").strip()
                
                if key and value:
                    ozellikler[key] = value
        
        details["ozellikler"] = ozellikler
        
        # İlan No (özelliklerden al)
        if "İlan No" in ozellikler:
            details["ilan_no"] = ozellikler["İlan No"]
        
        # Açıklama
        desc_el = page.locator("#classifiedDescription")
        if await desc_el.count() > 0:
            # HTML olarak al
            details["aciklama_html"] = await desc_el.inner_html()
            # Text olarak da al
            details["aciklama"] = (await desc_el.inner_text()).strip()
        
        # Resimler
        resimler = []
        
        # AVIF source'lardan
        avif_sources = page.locator(".classifiedDetailPhotos source.avif-source[srcset]")
        avif_count = await avif_sources.count()
        for i in range(avif_count):
            srcset = await avif_sources.nth(i).get_attribute("srcset")
            if srcset and "blank" not in srcset and srcset not in resimler:
                # AVIF'i JPG'ye çevir
                jpg_url = srcset.replace(".avif", ".jpg")
                resimler.append(jpg_url)
        
        # Eğer AVIF yoksa img data-src'den
        if not resimler:
            img_els = page.locator(".classifiedDetailPhotos img[data-src]")
            img_count = await img_els.count()
            for i in range(img_count):
                src = await img_els.nth(i).get_attribute("data-src")
                if src and "blank" not in src and src not in resimler:
                    resimler.append(src)
        
        details["resimler"] = resimler
        details["resim_sayisi"] = len(resimler)
        
        # Ek Özellikler (classifiedProperties)
        ek_ozellikler = {}
        props_container = page.locator("#classifiedProperties")
        if await props_container.count() > 0:
            # Her h3 başlığı altındaki özellikleri al
            h3_els = props_container.locator("h3")
            h3_count = await h3_els.count()
            
            for i in range(h3_count):
                category = (await h3_els.nth(i).inner_text()).strip()
                # Sonraki ul'daki li'leri al
                ul_el = props_container.locator(f"h3:nth-of-type({i+1}) + ul")
                if await ul_el.count() > 0:
                    items = []
                    li_els = ul_el.locator("li")
                    li_count = await li_els.count()
                    for j in range(li_count):
                        item_text = (await li_els.nth(j).inner_text()).strip()
                        if item_text:
                            items.append(item_text)
                    if items:
                        ek_ozellikler[category] = items
        
        if ek_ozellikler:
            details["ek_ozellikler"] = ek_ozellikler
        
        # Satıcı Bilgisi
        seller_box = page.locator(".classifiedUserBox")
        if await seller_box.count() > 0:
            # Mağaza adı
            store_name = seller_box.locator(".store-name, .username")
            if await store_name.count() > 0:
                details["satici"] = (await store_name.first.inner_text()).strip()
            
            # Yıl badge
            year_badge = seller_box.locator(".badge .year")
            if await year_badge.count() > 0:
                details["satici_yil"] = (await year_badge.inner_text()).strip()
        
    except Exception as e:
        details["hata"] = str(e)
    
    return details


async def crawl_listing_details(listings: list, max_listings: int = 10, delay: float = 3.0):
    """
    Liste halindeki ilanların detaylarını çeker.
    
    Args:
        listings: sahibinden_ilanlar.json'dan gelen ilan listesi
        max_listings: Maksimum kaç ilan çekilecek (test için)
        delay: İstekler arası bekleme süresi (saniye)
    """
    print("=" * 70)
    print("🏠 SAHİBİNDEN.COM İLAN DETAY CRAWLER")
    print("=" * 70)
    print()
    
    async with async_playwright() as p:
        # Chrome'a bağlan
        print("🔗 Chrome'a bağlanılıyor...")
        try:
            browser = await p.chromium.connect_over_cdp("http://localhost:9222")
        except Exception as e:
            print(f"❌ Chrome'a bağlanılamadı: {e}")
            print("\n💡 Chrome'u debug modda açtığından emin ol!")
            return []
        
        contexts = browser.contexts
        if not contexts:
            print("❌ Açık context bulunamadı!")
            return []
        
        context = contexts[0]
        pages = context.pages
        
        # Sahibinden sayfasını bul veya yeni sayfa aç
        page = None
        for pg in pages:
            if "sahibinden" in pg.url:
                page = pg
                break
        
        if not page:
            print("⚠️ Sahibinden sayfası bulunamadı, yeni sayfa açılıyor...")
            page = await context.new_page()
        
        print(f"✅ Sayfa hazır: {page.url}")
        print()
        
        detailed_listings = []
        total = min(len(listings), max_listings)
        
        for idx, listing in enumerate(listings[:max_listings], 1):
            ilan_id = listing.get("id", "")
            link = listing.get("link", "")
            baslik = listing.get("baslik", "")[:50]
            
            print(f"[{idx}/{total}] 📄 {baslik}...")
            
            if not link:
                print(f"   ⚠️ Link bulunamadı, atlanıyor.")
                continue
            
            try:
                # Detay sayfasına git (retry mekanizması ile)
                max_retries = 2
                for retry in range(max_retries):
                    try:
                        await page.goto(link, wait_until="domcontentloaded", timeout=30000)
                        await asyncio.sleep(2)
                        
                        # Cloudflare kontrolü
                        content = await page.content()
                        if "Cloudflare" in content or "challenge" in content.lower():
                            print(f"   ⚠️ Cloudflare tespit edildi! Manuel geçiş gerekli.")
                            print(f"   💡 Tarayıcıda Cloudflare'ı geç ve Enter'a bas...")
                            input()
                            await asyncio.sleep(2)
                        
                        # Sayfa içeriği yüklenene kadar bekle
                        await page.wait_for_selector("ul.classifiedInfoList", timeout=10000)
                        break  # Başarılı, döngüden çık
                        
                    except Exception as retry_err:
                        if retry < max_retries - 1:
                            print(f"   ⚠️ Retry {retry + 1}...")
                            await asyncio.sleep(2)
                        else:
                            raise retry_err
                
                # Detayları çek
                details = await extract_listing_details(page)
                
                # Orijinal liste bilgilerini ekle
                details["liste_bilgileri"] = listing
                details["url"] = link
                details["crawl_tarihi"] = datetime.now().isoformat()
                
                detailed_listings.append(details)
                
                ozellik_sayisi = len(details.get("ozellikler", {}))
                resim_sayisi = details.get("resim_sayisi", 0)
                print(f"   ✅ {ozellik_sayisi} özellik, {resim_sayisi} resim")
                
                # Rate limiting
                if idx < total:
                    print(f"   ⏳ {delay}s bekleniyor...")
                    await asyncio.sleep(delay)
                    
            except Exception as e:
                print(f"   ❌ Hata: {e}")
                detailed_listings.append({
                    "liste_bilgileri": listing,
                    "url": link,
                    "hata": str(e),
                    "crawl_tarihi": datetime.now().isoformat()
                })
        
        return detailed_listings


async def main():
    # Mevcut ilan listesini yükle
    try:
        with open("sahibinden_ilanlar.json", "r", encoding="utf-8") as f:
            data = json.load(f)
            listings = data.get("ilanlar", [])
    except FileNotFoundError:
        print("❌ sahibinden_ilanlar.json bulunamadı!")
        print("💡 Önce sahibinden_crawler.py çalıştır.")
        return
    
    print(f"📋 {len(listings)} ilan bulundu.")
    print()
    
    # Detayları çek (test için 5 ilan)
    detailed = await crawl_listing_details(
        listings, 
        max_listings=5,  # Test için 5 ilan
        delay=3.0        # 3 saniye bekleme
    )
    
    # Sonuçları kaydet
    output = {
        "tarih": datetime.now().isoformat(),
        "kaynak": "sahibinden.com",
        "toplam_ilan": len(detailed),
        "ilanlar": detailed
    }
    
    output_file = "sahibinden_detayli_ilanlar.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print()
    print("=" * 70)
    print(f"✅ TAMAMLANDI! {len(detailed)} ilan detayı çekildi.")
    print(f"💾 Kaydedildi: {output_file}")
    print("=" * 70)
    
    # Örnek çıktı göster
    if detailed:
        print()
        print("📋 İLK İLAN DETAYI:")
        print("-" * 50)
        first = detailed[0]
        print(f"Başlık: {first.get('baslik', 'N/A')}")
        print(f"Fiyat: {first.get('fiyat', 'N/A')}")
        print(f"Konum: {first.get('konum', 'N/A')}")
        print(f"Resim Sayısı: {first.get('resim_sayisi', 0)}")
        print()
        print("Özellikler:")
        for k, v in first.get("ozellikler", {}).items():
            print(f"  • {k}: {v}")


if __name__ == "__main__":
    asyncio.run(main())
