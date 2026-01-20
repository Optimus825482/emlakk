"""
İlan detay sayfasının HTML yapısını çek
"""

import asyncio
from playwright.async_api import async_playwright

async def get_detail_html():
    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp("http://localhost:9222")
        context = browser.contexts[0]
        page = context.pages[0]
        
        # Bir ilan detay sayfasına git
        detail_url = "https://www.sahibinden.com/ilan/emlak-konut-satilik-hastane-yolunda-modern-3-plus1-daire-1293080702/detay"
        
        print(f"🔗 Detay sayfasına gidiliyor: {detail_url}")
        await page.goto(detail_url)
        await page.wait_for_load_state("domcontentloaded")
        await asyncio.sleep(3)
        
        html = await page.content()
        
        with open("ilan_detay.html", "w", encoding="utf-8") as f:
            f.write(html)
        
        print(f"✅ HTML kaydedildi: ilan_detay.html ({len(html)} karakter)")

if __name__ == "__main__":
    asyncio.run(get_detail_html())
