"""
Sahibinden.com'dan ilan sayısı çekme testi
"""
import requests
from bs4 import BeautifulSoup

def test_sahibinden():
    url = "https://www.sahibinden.com/satilik/sakarya-hendek"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    print(f"🔍 Test URL: {url}")
    print("=" * 60)
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        print(f"✅ Status Code: {response.status_code}")
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Method 1: searchCategoryContainer
            print("\n📊 Method 1: searchCategoryContainer")
            search_cats = soup.find('div', {'id': 'searchCategoryContainer'})
            if search_cats:
                print("✅ searchCategoryContainer bulundu")
                spans = search_cats.find_all('span')
                print(f"   Toplam {len(spans)} span bulundu")
                for i, span in enumerate(spans):
                    text = span.get_text(strip=True)
                    print(f"   Span {i+1}: '{text}'")
                    if text.startswith('(') and text.endswith(')'):
                        count = text.strip('()')
                        print(f"   ✅ İlan sayısı bulundu: {count}")
            else:
                print("❌ searchCategoryContainer bulunamadı")
            
            # Method 2: result-text
            print("\n📊 Method 2: result-text")
            result_text = soup.find('div', class_='result-text')
            if result_text:
                text = result_text.get_text(strip=True)
                print(f"✅ result-text bulundu: '{text}'")
                import re
                match = re.search(r'(\d+)', text)
                if match:
                    print(f"   ✅ İlan sayısı: {match.group(1)}")
            else:
                print("❌ result-text bulunamadı")
            
            # Method 3: Tüm span'leri tara
            print("\n📊 Method 3: Tüm span'leri tara")
            all_spans = soup.find_all('span')
            print(f"Toplam {len(all_spans)} span bulundu")
            for span in all_spans[:20]:  # İlk 20 span
                text = span.get_text(strip=True)
                if text.startswith('(') and text.endswith(')'):
                    print(f"   Potansiyel sayı: {text}")
            
            # HTML'in bir kısmını kaydet
            print("\n💾 HTML kaydediliyor...")
            with open('sahibinden_test.html', 'w', encoding='utf-8') as f:
                f.write(response.text)
            print("✅ HTML 'sahibinden_test.html' dosyasına kaydedildi")
            
    except Exception as e:
        print(f"❌ Hata: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_sahibinden()
