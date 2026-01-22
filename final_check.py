#!/usr/bin/env python3
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(os.getenv('DIRECT_URL'))
cur = conn.cursor()

print("=" * 70)
print("🎉 FINAL MIGRATION DURUMU")
print("=" * 70)

# Toplam kayıtlar
cur.execute("SELECT COUNT(*) FROM sahibinden_liste WHERE konum IS NOT NULL")
toplam = cur.fetchone()[0]

# Her ikisi de dolu
cur.execute("SELECT COUNT(*) FROM sahibinden_liste WHERE semt IS NOT NULL AND mahalle IS NOT NULL")
her_ikisi = cur.fetchone()[0]

# Sadece semt dolu
cur.execute("SELECT COUNT(*) FROM sahibinden_liste WHERE semt IS NOT NULL AND mahalle IS NULL")
sadece_semt = cur.fetchone()[0]

# Sadece mahalle dolu
cur.execute("SELECT COUNT(*) FROM sahibinden_liste WHERE semt IS NULL AND mahalle IS NOT NULL")
sadece_mahalle = cur.fetchone()[0]

# Her ikisi de NULL
cur.execute("SELECT COUNT(*) FROM sahibinden_liste WHERE konum IS NOT NULL AND semt IS NULL AND mahalle IS NULL")
her_ikisi_null = cur.fetchone()[0]

print(f"\n📊 Toplam Kayıt (konum IS NOT NULL): {toplam}")
print(f"\n✅ Parse Edilmiş:")
print(f"   - Her ikisi dolu (semt + mahalle): {her_ikisi} (%{her_ikisi*100/toplam:.1f})")
print(f"   - Sadece semt dolu: {sadece_semt} (%{sadece_semt*100/toplam:.1f})")
print(f"   - Sadece mahalle dolu: {sadece_mahalle} (%{sadece_mahalle*100/toplam:.1f})")
print(f"\n❌ Parse Edilmemiş:")
print(f"   - Her ikisi NULL: {her_ikisi_null} (%{her_ikisi_null*100/toplam:.1f})")

parse_toplam = her_ikisi + sadece_semt + sadece_mahalle
print(f"\n🎯 TOPLAM PARSE: {parse_toplam}/{toplam} = %{parse_toplam*100/toplam:.1f}")

# Örnek kayıtlar
print(f"\n📋 Örnek Kayıtlar:")
cur.execute("""
    SELECT ilce, semt, mahalle, COUNT(*) as count
    FROM sahibinden_liste
    WHERE semt IS NOT NULL OR mahalle IS NOT NULL
    GROUP BY ilce, semt, mahalle
    ORDER BY count DESC
    LIMIT 10
""")

rows = cur.fetchall()
for r in rows:
    semt_str = r[1] if r[1] else "NULL"
    mahalle_str = r[2] if r[2] else "NULL"
    print(f"   {r[0]} → {semt_str} → {mahalle_str}: {r[3]} ilan")

print("=" * 70)
print("✅ MIGRATION TAMAMLANDI!")
print("=" * 70)

conn.close()
