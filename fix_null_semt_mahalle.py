#!/usr/bin/env python3
"""
Semt ve Mahalle NULL Değerlerini Düzelt
========================================
Kural 1: Semt NULL ise → İlçe adını kopyala
Kural 2: Mahalle NULL ise → Semt adını kopyala
"""

import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DIRECT_URL") or os.getenv("DATABASE_URL")

print("=" * 70)
print("🔧 Semt & Mahalle NULL Değerlerini Düzelt")
print("=" * 70)

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Önce mevcut durumu kontrol et
print("\n📊 Mevcut Durum:")
cur.execute("""
    SELECT 
        COUNT(*) FILTER (WHERE semt IS NULL) as semt_null,
        COUNT(*) FILTER (WHERE mahalle IS NULL) as mahalle_null,
        COUNT(*) FILTER (WHERE semt IS NOT NULL AND mahalle IS NOT NULL) as both_filled,
        COUNT(*) as total
    FROM sahibinden_liste
    WHERE konum IS NOT NULL
""")

before = cur.fetchone()
print(f"   Semt NULL: {before[0]}")
print(f"   Mahalle NULL: {before[1]}")
print(f"   Her ikisi dolu: {before[2]}")
print(f"   Toplam: {before[3]}")

# 1. Semt NULL olanları düzelt
print("\n🔧 Adım 1: Semt NULL → İlçe adını kopyala")
cur.execute("""
    UPDATE sahibinden_liste
    SET semt = ilce
    WHERE semt IS NULL 
    AND ilce IS NOT NULL
""")
semt_updated = cur.rowcount
print(f"   ✅ {semt_updated} kayıt güncellendi")

# 2. Mahalle NULL olanları düzelt
print("\n🔧 Adım 2: Mahalle NULL → Semt adını kopyala")
cur.execute("""
    UPDATE sahibinden_liste
    SET mahalle = semt
    WHERE mahalle IS NULL 
    AND semt IS NOT NULL
""")
mahalle_updated = cur.rowcount
print(f"   ✅ {mahalle_updated} kayıt güncellendi")

# Commit
conn.commit()

# Sonuç kontrolü
print("\n📊 Güncellenmiş Durum:")
cur.execute("""
    SELECT 
        COUNT(*) FILTER (WHERE semt IS NULL) as semt_null,
        COUNT(*) FILTER (WHERE mahalle IS NULL) as mahalle_null,
        COUNT(*) FILTER (WHERE semt IS NOT NULL AND mahalle IS NOT NULL) as both_filled,
        COUNT(*) as total
    FROM sahibinden_liste
    WHERE konum IS NOT NULL
""")

after = cur.fetchone()
print(f"   Semt NULL: {after[0]} (önce: {before[0]})")
print(f"   Mahalle NULL: {after[1]} (önce: {before[1]})")
print(f"   Her ikisi dolu: {after[2]} (önce: {before[2]})")
print(f"   Toplam: {after[3]}")

# Örnek kayıtlar
print("\n📋 Örnek Güncellenmiş Kayıtlar:")
cur.execute("""
    SELECT ilce, semt, mahalle, COUNT(*) as count
    FROM sahibinden_liste
    WHERE semt IS NOT NULL AND mahalle IS NOT NULL
    GROUP BY ilce, semt, mahalle
    ORDER BY count DESC
    LIMIT 10
""")

rows = cur.fetchall()
for r in rows:
    print(f"   {r[0]} → {r[1]} → {r[2]}: {r[3]} ilan")

print("\n" + "=" * 70)
print("✅ İşlem Tamamlandı!")
print("=" * 70)
print(f"Toplam Güncelleme: {semt_updated + mahalle_updated} kayıt")
print(f"   - Semt güncellendi: {semt_updated}")
print(f"   - Mahalle güncellendi: {mahalle_updated}")
print("=" * 70)

conn.close()
