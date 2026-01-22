#!/usr/bin/env python3
import psycopg2

DATABASE_URL = "postgres://postgres:518518Erkan@77.42.68.4:5432/demir_db"

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Tablo kolonlarını kontrol et
cur.execute("""
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'sahibinden_liste' 
    ORDER BY ordinal_position;
""")

print("📋 sahibinden_liste tablosu kolonları:")
for col_name, data_type in cur.fetchall():
    print(f"  {col_name}: {data_type}")

# Örnek veri
print("\n📝 Örnek veri (ilk 3 kayıt):")
cur.execute("SELECT id, konum, district, mahalle FROM sahibinden_liste LIMIT 3;")
for row in cur.fetchall():
    print(f"  ID: {row[0]}, Konum: {row[1]}, District: {row[2]}, Mahalle: {row[3]}")

cur.close()
conn.close()
