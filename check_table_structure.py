import psycopg2
import os
from dotenv import load_dotenv

load_dotenv('.env.local')

conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

# Tablo kolonlarını kontrol et
cur.execute("""
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'sahibinden_liste' 
    ORDER BY ordinal_position
""")

cols = cur.fetchall()

print("\n📋 sahibinden_liste Tablo Yapısı:\n")
for col in cols:
    print(f"  {col[0]}: {col[1]}")

# Örnek veri çek
cur.execute("""
    SELECT id, baslik, ilce, category, transaction
    FROM sahibinden_liste
    LIMIT 3
""")

rows = cur.fetchall()
print(f"\n📊 Örnek Veriler:\n")
for row in rows:
    print(f"  ID: {row[0]}, İlçe: {row[2]}, Kategori: {row[3]}")

cur.close()
conn.close()
