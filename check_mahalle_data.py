import psycopg2
import os
from dotenv import load_dotenv

load_dotenv('.env.local')

conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

# Akyazı mahallelerini çek
cur.execute("""
    SELECT konum, COUNT(*) as count 
    FROM sahibinden_liste 
    WHERE ilce = 'Akyazı' AND konum IS NOT NULL 
    GROUP BY konum 
    ORDER BY count DESC 
    LIMIT 30
""")

print("Top 30 Mahalleler (Akyazı):")
print("-" * 70)
for row in cur.fetchall():
    konum, count = row
    print(f"{konum:50} -> {count:5} ilan")

cur.close()
conn.close()
