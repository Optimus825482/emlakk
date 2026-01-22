#!/usr/bin/env python3
"""
Parse fonksiyonunu test et - Hızlı test için
"""

import re

def parse_konum_to_semt_mahalle(konum_text, ilce):
    """CamelCase pattern ile parse et"""
    if not konum_text:
        return None, None
    
    if ' ' in konum_text and not konum_text[0].isupper():
        return None, konum_text
    
    pattern = r'[A-ZÇĞİÖŞÜ][a-zçğıöşü]*'
    matches = re.findall(pattern, konum_text)
    
    if len(matches) == 0:
        return None, konum_text
    
    elif len(matches) == 1:
        common_semts = ["Merkez", "Köyler", "İstiklal", "Tepekum", "Semerciler"]
        if matches[0] in common_semts:
            remaining = konum_text[len(matches[0]):].strip()
            if remaining:
                return matches[0], remaining
            else:
                return matches[0], None
        else:
            return None, konum_text
    
    else:
        semt = matches[0]
        semt_end_index = konum_text.find(semt) + len(semt)
        mahalle = konum_text[semt_end_index:].strip()
        
        if not mahalle:
            return semt, None
        
        return semt, mahalle


# Test örnekleri
test_cases = [
    "TığcılarYahyalar Mah.",
    "TığcılarTığcılar Mh.",
    "KaraosmanSakarya Mah.",
    "MerkezYeni Mah.",
    "KöylerDağdibi Mh.",
    "AkyazıÖmercikler Mh.",
    "İstiklalCumhuriyet Mah.",
    "KuzulukKuzuluk Ortamahalle Mh.",
    "Semerciler",
    "Yeni Mah.",
]

print("=" * 70)
print("🧪 Parse Fonksiyonu Test")
print("=" * 70)
print()

for konum in test_cases:
    semt, mahalle = parse_konum_to_semt_mahalle(konum, "Test")
    semt_str = f"'{semt}'" if semt else "NULL"
    mahalle_str = f"'{mahalle}'" if mahalle else "NULL"
    print(f"'{konum}'")
    print(f"  → semt={semt_str}, mahalle={mahalle_str}")
    print()

print("=" * 70)
print("✅ Test tamamlandı!")
print("=" * 70)
