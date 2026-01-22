#!/usr/bin/env python3
import psycopg2

DATABASE_URL = "postgres://postgres:518518Erkan@77.42.68.4:5432/demir_db"

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Adapazarı ilanlarını kontrol et
cur.execute("SELECT COUNT(*) FROM sahibinden_liste WHERE konum LIKE 'Adapazarı%' OR konum LIKE '%Adapazarı%';")
count = cur.fetchone()[0]
print(f"Adapazarı ilanları: {count:,}")

# Örnek konum verileri
if count > 0:
    cur.execute("SELECT konum FROM sahibinden_liste WHERE konum LIKE 'Adapazarı%' OR konum LIKE '%Adapazarı%' LIMIT 10;")
    print("\nÖrnek konumlar:")
    for i, (konum,) in enumerate(cur.fetchall(), 1):
        print(f"  {i}. {konum}")

cur.close()
conn.close()
