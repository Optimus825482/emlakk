import psycopg2
import os
from dotenv import load_dotenv
import json
import random

load_dotenv('.env.local')

# Sakarya ilçe koordinatları (merkez noktaları)
DISTRICT_COORDS = {
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

conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

# Her ilçeden 50 ilana koordinat ekle
for district, base_coords in DISTRICT_COORDS.items():
    # İlçedeki ilanları al
    cur.execute("""
        SELECT id FROM sahibinden_liste
        WHERE ilce = %s AND koordinatlar IS NULL
        LIMIT 50
    """, (district,))
    
    listings = cur.fetchall()
    
    print(f"\n{district}: {len(listings)} ilana koordinat ekleniyor...")
    
    for listing in listings:
        # Rastgele offset ekle (±0.02 derece = yaklaşık ±2km)
        lat = base_coords["lat"] + random.uniform(-0.02, 0.02)
        lng = base_coords["lng"] + random.uniform(-0.02, 0.02)
        
        coords = json.dumps({"lat": str(lat), "lng": str(lng)})
        
        cur.execute("""
            UPDATE sahibinden_liste
            SET koordinatlar = %s
            WHERE id = %s
        """, (coords, listing[0]))
    
    conn.commit()
    print(f"  ✅ {len(listings)} ilan güncellendi")

# Sonuçları kontrol et
cur.execute("SELECT COUNT(*) FROM sahibinden_liste WHERE koordinatlar IS NOT NULL")
total_with_coords = cur.fetchone()[0]

print(f"\n✅ Toplam koordinatlı ilan: {total_with_coords}")

cur.close()
conn.close()
