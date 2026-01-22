import psycopg2
import os
from dotenv import load_dotenv
import json

load_dotenv('.env.local')

# PostgreSQL bağlantısı
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

# Koordinatlı ilanları kontrol et
cur.execute("""
    SELECT id, baslik, ilce, category, transaction, koordinatlar
    FROM sahibinden_liste
    WHERE koordinatlar IS NOT NULL
    LIMIT 10
""")

results = cur.fetchall()

print(f"\n✅ Koordinatlı ilan sayısı: {len(results)}")

if results:
    print("\n📍 İlk 5 ilan:")
    for r in results[:5]:
        print(f"\nID: {r[0]}")
        print(f"  İlçe: {r[2] or 'N/A'}")
        print(f"  Kategori: {r[3] or 'N/A'}")
        print(f"  Transaction: {r[4] or 'N/A'}")
        print(f"  Koordinat: {r[5]}")
else:
    print("\n❌ Koordinatlı ilan bulunamadı!")
    
# Toplam ilan sayısı
cur.execute("SELECT COUNT(*) FROM sahibinden_liste")
total = cur.fetchone()[0]
print(f"\n📊 Toplam ilan: {total}")

# Koordinatsız ilan sayısı
cur.execute("SELECT COUNT(*) FROM sahibinden_liste WHERE koordinatlar IS NULL")
no_coords = cur.fetchone()[0]
print(f"📊 Koordinatsız ilan: {no_coords}")

# İlçe bazında koordinatlı ilan sayısı
cur.execute("""
    SELECT ilce, COUNT(*) as count
    FROM sahibinden_liste
    WHERE koordinatlar IS NOT NULL
    GROUP BY ilce
    ORDER BY count DESC
    LIMIT 10
""")
districts = cur.fetchall()
print(f"\n📍 İlçe bazında koordinatlı ilanlar:")
for d in districts:
    print(f"  {d[0]}: {d[1]} ilan")

cur.close()
conn.close()
