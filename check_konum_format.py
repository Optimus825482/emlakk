#!/usr/bin/env python3
"""
Konum Format Checker
====================
sahibinden_liste tablosundaki konum sütununun formatını analiz eder
"""

import os
import sys
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
from collections import Counter

load_dotenv()

DATABASE_URL = os.getenv("DIRECT_URL") or os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ DATABASE_URL veya DIRECT_URL bulunamadı!")
    sys.exit(1)

def analyze_konum_formats():
    """Konum sütunundaki farklı formatları analiz et"""
    
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    print("=" * 70)
    print("📊 Konum Format Analizi")
    print("=" * 70)
    print()
    
    # Toplam kayıt sayısı
    cursor.execute("SELECT COUNT(*) as total FROM sahibinden_liste")
    total = cursor.fetchone()["total"]
    print(f"📦 Toplam kayıt: {total}")
    print()
    
    # İlçe sütunu dolu olanlar
    cursor.execute("SELECT COUNT(*) as count FROM sahibinden_liste WHERE ilce IS NOT NULL AND ilce != ''")
    ilce_count = cursor.fetchone()["count"]
    print(f"✅ İlçe sütunu dolu: {ilce_count} ({ilce_count/total*100:.1f}%)")
    
    # İlçe sütunu boş olanlar
    cursor.execute("SELECT COUNT(*) as count FROM sahibinden_liste WHERE ilce IS NULL OR ilce = ''")
    no_ilce = cursor.fetchone()["count"]
    print(f"❌ İlçe sütunu boş: {no_ilce} ({no_ilce/total*100:.1f}%)")
    print()
    
    # Konum formatları
    print("-" * 70)
    print("🔍 Konum Formatları:")
    print("-" * 70)
    
    # Virgül içerenler
    cursor.execute("SELECT COUNT(*) as count FROM sahibinden_liste WHERE konum LIKE '%,%'")
    comma_count = cursor.fetchone()["count"]
    print(f"📍 Virgül içeren (İlçe, Mahalle): {comma_count}")
    
    # Tire içerenler
    cursor.execute("SELECT COUNT(*) as count FROM sahibinden_liste WHERE konum LIKE '%-%'")
    dash_count = cursor.fetchone()["count"]
    print(f"📍 Tire içeren (İlçe-Mahalle): {dash_count}")
    
    # Slash içerenler
    cursor.execute("SELECT COUNT(*) as count FROM sahibinden_liste WHERE konum LIKE '%/%'")
    slash_count = cursor.fetchone()["count"]
    print(f"📍 Slash içeren (İlçe/Mahalle): {slash_count}")
    
    # Sadece tek kelime (muhtemelen düzgün)
    cursor.execute("""
        SELECT COUNT(*) as count 
        FROM sahibinden_liste 
        WHERE konum NOT LIKE '%,%' 
        AND konum NOT LIKE '%-%' 
        AND konum NOT LIKE '%/%'
        AND konum IS NOT NULL
    """)
    clean_count = cursor.fetchone()["count"]
    print(f"✅ Temiz format (sadece mahalle): {clean_count}")
    print()
    
    # Örnek kayıtlar
    print("-" * 70)
    print("📋 Örnek Kayıtlar (İlk 20):")
    print("-" * 70)
    
    cursor.execute("""
        SELECT id, ilce, konum
        FROM sahibinden_liste
        WHERE konum IS NOT NULL
        ORDER BY id
        LIMIT 20
    """)
    
    samples = cursor.fetchall()
    for sample in samples:
        ilce = sample["ilce"] or "NULL"
        konum = sample["konum"] or "NULL"
        print(f"ID {sample['id']:6d} | İlçe: {ilce:15s} | Konum: {konum}")
    
    print()
    
    # İlçe ile konum eşleşmesi kontrolü
    print("-" * 70)
    print("🔍 İlçe-Konum Eşleşme Analizi:")
    print("-" * 70)
    
    # Konum'da ilçe adı geçenler
    cursor.execute("""
        SELECT COUNT(*) as count
        FROM sahibinden_liste
        WHERE ilce IS NOT NULL 
        AND konum IS NOT NULL
        AND (
            konum ILIKE ilce || ',%'
            OR konum ILIKE ilce || '-%'
            OR konum ILIKE ilce || '/%'
        )
    """)
    matching = cursor.fetchone()["count"]
    print(f"📍 Konum'da ilçe adı geçen: {matching}")
    
    if matching > 0:
        print()
        print("💡 Düzeltme önerisi:")
        print("   Bu kayıtların konum sütununda ilçe adı var.")
        print("   Script'i güncelleyerek tire (-) ve slash (/) ayraçlarını da")
        print("   destekleyebiliriz.")
    
    print()
    print("=" * 70)
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    analyze_konum_formats()
