import psycopg2
import os
from dotenv import load_dotenv

load_dotenv('.env.local')

conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

# Test 1: Akyazı ile arama
cur.execute("""
    SELECT COUNT(*) 
    FROM sahibinden_liste 
    WHERE ilce = 'akyazi' AND category = 'arsa'
""")
count1 = cur.fetchone()[0]
print(f"akyazi (lowercase): {count1} ilan")

# Test 2: Akyazı ile arama (büyük harf)
cur.execute("""
    SELECT COUNT(*) 
    FROM sahibinden_liste 
    WHERE ilce = 'Akyazı' AND category = 'arsa'
""")
count2 = cur.fetchone()[0]
print(f"Akyazı (proper case): {count2} ilan")

# Test 3: Case-insensitive arama
cur.execute("""
    SELECT COUNT(*) 
    FROM sahibinden_liste 
    WHERE LOWER(ilce) = 'akyazı' AND category = 'arsa'
""")
count3 = cur.fetchone()[0]
print(f"LOWER(ilce) = 'akyazı': {count3} ilan")

# Test 4: Tüm Akyazı ilanları
cur.execute("""
    SELECT ilce, category, COUNT(*) 
    FROM sahibinden_liste 
    WHERE LOWER(ilce) LIKE '%akyaz%'
    GROUP BY ilce, category
    ORDER BY COUNT(*) DESC
""")
results = cur.fetchall()
print(f"\nAkyazı ilanları:")
for r in results:
    print(f"  {r[0]} - {r[1]}: {r[2]} ilan")

cur.close()
conn.close()
