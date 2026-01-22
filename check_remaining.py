#!/usr/bin/env python3
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(os.getenv('DIRECT_URL'))
cur = conn.cursor()

# Kalan kayıtları kontrol et
cur.execute("""
    SELECT id, konum, ilce, semt, mahalle 
    FROM sahibinden_liste 
    WHERE konum IS NOT NULL 
    AND (semt IS NULL OR mahalle IS NULL) 
    LIMIT 10
""")

rows = cur.fetchall()

print("=" * 70)
print("Kalan Kayıtlar (Parse Edilmemiş)")
print("=" * 70)

for r in rows:
    print(f"\nID: {r[0]}")
    print(f"  konum: '{r[1]}'")
    print(f"  ilce: '{r[2]}'")
    print(f"  semt: {r[3]}")
    print(f"  mahalle: {r[4]}")

# Toplam sayılar
cur.execute("SELECT COUNT(*) FROM sahibinden_liste WHERE konum IS NOT NULL AND (semt IS NULL OR mahalle IS NULL)")
kalan = cur.fetchone()[0]

cur.execute("SELECT COUNT(*) FROM sahibinden_liste WHERE semt IS NOT NULL")
parse = cur.fetchone()[0]

cur.execute("SELECT COUNT(*) FROM sahibinden_liste WHERE konum IS NOT NULL")
toplam = cur.fetchone()[0]

print("\n" + "=" * 70)
print(f"Kalan: {kalan}")
print(f"Parse edilmiş: {parse}/{toplam} = %{parse*100/toplam:.1f}")
print("=" * 70)

conn.close()
