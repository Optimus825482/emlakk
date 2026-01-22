import psycopg2
import os
from dotenv import load_dotenv

load_dotenv('.env.local')

conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

# Tüm unique ilçe isimlerini çek
cur.execute("""
    SELECT DISTINCT ilce, COUNT(*) as count
    FROM sahibinden_liste 
    WHERE ilce IS NOT NULL
    GROUP BY ilce
    ORDER BY count DESC
""")

print("Veritabanındaki ilçe isimleri:")
print("-" * 50)
for row in cur.fetchall():
    ilce, count = row
    print(f"{ilce:20} -> {count:5} ilan")
    print(f"  Bytes: {ilce.encode('utf-8')}")
    print(f"  Lower: {ilce.lower()}")
    print()

cur.close()
conn.close()
