#!/usr/bin/env python3
import psycopg2

DATABASE_URL = "postgres://postgres:518518Erkan@77.42.68.4:5432/demir_db"

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# 1. District kolonu var mı kontrol et
cur.execute("""
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'sahibinden_liste' AND column_name = 'district';
""")
result = cur.fetchone()
if result:
    print(f"✅ 'district' kolonu mevcut: {result[1]}")
else:
    print("❌ 'district' kolonu bulunamadı!")
    cur.close()
    conn.close()
    exit(1)

# 2. District değerlerini kontrol et
cur.execute("""
    SELECT district, COUNT(*) 
    FROM sahibinden_liste 
    WHERE district IS NOT NULL 
    GROUP BY district 
    ORDER BY COUNT(*) DESC;
""")
print("\n📊 İlçe Dağılımı:")
total = 0
for district, count in cur.fetchall():
    print(f"  {district}: {count:,} ilan")
    total += count
print(f"  TOPLAM: {total:,} ilan")

# 3. NULL district kontrolü
cur.execute("SELECT COUNT(*) FROM sahibinden_liste WHERE district IS NULL;")
null_count = cur.fetchone()[0]
if null_count > 0:
    print(f"\n⚠️  District NULL olan kayıt: {null_count:,}")
else:
    print(f"\n✅ Tüm kayıtlarda district dolu!")

# 4. Örnek veriler
print("\n📝 Örnek veriler (ilk 10 kayıt):")
cur.execute("SELECT id, district, konum FROM sahibinden_liste LIMIT 10;")
for id, district, konum in cur.fetchall():
    print(f"  ID: {id}, District: {district}, Konum: {konum}")

cur.close()
conn.close()
