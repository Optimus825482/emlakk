import psycopg2
import os
from dotenv import load_dotenv
import json
import random
import hashlib

load_dotenv('.env.local')

# Sakarya ilçe merkez koordinatları
DISTRICT_CENTERS = {
    "Adapazarı": {"lat": 40.7569, "lng": 30.4013},
    "Akyazı": {"lat": 40.6850, "lng": 30.6250},
    "Geyve": {"lat": 40.5083, "lng": 30.2917},
    "Hendek": {"lat": 40.7972, "lng": 30.7472},
    "Karasu": {"lat": 41.0972, "lng": 30.6917},
    "Kaynarca": {"lat": 41.0333, "lng": 30.3000},
    "Sapanca": {"lat": 40.6917, "lng": 30.2667},
    "Serdivan": {"lat": 40.7833, "lng": 30.3667},
    "Söğütlü": {"lat": 40.8833, "lng": 30.4833},
    "Taraklı": {"lat": 40.3917, "lng": 30.4917},
}

def get_neighborhood_offset(neighborhood_name):
    """
    Mahalle adından tutarlı bir offset üret (aynı mahalle her zaman aynı yerde)
    """
    # Mahalle adını hash'le
    hash_obj = hashlib.md5(neighborhood_name.encode())
    hash_int = int(hash_obj.hexdigest(), 16)
    
    # Hash'ten tutarlı offset üret (-0.03 ile +0.03 arası, yaklaşık ±3km)
    random.seed(hash_int)
    lat_offset = random.uniform(-0.03, 0.03)
    lng_offset = random.uniform(-0.03, 0.03)
    
    return lat_offset, lng_offset

def clean_neighborhood_name(konum):
    """
    Konum stringinden mahalle adını temizle
    Örnek: "MerkezYeni Mah." -> "Yeni Mah."
    """
    if not konum:
        return "Merkez"
    
    # "Merkez" prefix'ini kaldır
    cleaned = konum.replace("Merkez", "").strip()
    
    # Boşsa "Merkez" döndür
    if not cleaned:
        return "Merkez"
    
    return cleaned

conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

print("🗺️ Mahalle Bazlı Koordinat Üretimi Başlıyor...\n")

# Her ilçe için işlem yap
for district, center in DISTRICT_CENTERS.items():
    print(f"\n📍 {district} işleniyor...")
    
    # İlçedeki tüm ilanları al
    cur.execute("""
        SELECT id, konum
        FROM sahibinden_liste
        WHERE ilce = %s AND konum IS NOT NULL
    """, (district,))
    
    listings = cur.fetchall()
    
    if not listings:
        print(f"  ⚠️ İlan bulunamadı")
        continue
    
    print(f"  📊 {len(listings)} ilan bulundu")
    
    # Mahalle bazlı grupla
    neighborhood_coords = {}
    updated_count = 0
    
    for listing_id, konum in listings:
        # Mahalle adını temizle
        neighborhood = clean_neighborhood_name(konum)
        
        # Bu mahalle için daha önce koordinat üretilmişse kullan
        if neighborhood not in neighborhood_coords:
            lat_offset, lng_offset = get_neighborhood_offset(neighborhood)
            neighborhood_coords[neighborhood] = {
                "lat": center["lat"] + lat_offset,
                "lng": center["lng"] + lng_offset
            }
        
        # İlan için koordinat ata
        coords = neighborhood_coords[neighborhood]
        
        # Aynı mahallede küçük varyasyon ekle (±0.002 derece = ±200m)
        random.seed(listing_id)
        lat = coords["lat"] + random.uniform(-0.002, 0.002)
        lng = coords["lng"] + random.uniform(-0.002, 0.002)
        
        coords_json = json.dumps({"lat": str(lat), "lng": str(lng)})
        
        cur.execute("""
            UPDATE sahibinden_liste
            SET koordinatlar = %s
            WHERE id = %s
        """, (coords_json, listing_id))
        
        updated_count += 1
    
    conn.commit()
    print(f"  ✅ {updated_count} ilan güncellendi")
    print(f"  🏘️ {len(neighborhood_coords)} farklı mahalle")

# Sonuçları kontrol et
cur.execute("SELECT COUNT(*) FROM sahibinden_liste WHERE koordinatlar IS NOT NULL")
total_with_coords = cur.fetchone()[0]

cur.execute("SELECT COUNT(*) FROM sahibinden_liste")
total = cur.fetchone()[0]

print(f"\n\n✅ İşlem Tamamlandı!")
print(f"📊 Koordinatlı ilan: {total_with_coords}/{total}")
print(f"📈 Oran: %{(total_with_coords/total*100):.1f}")

cur.close()
conn.close()
