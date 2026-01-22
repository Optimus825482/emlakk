#!/usr/bin/env python3
"""
'tarih' kolonundan 'crawled_at' kolonunu düzgün parse eder.
Örnek: "26 Aralık" → 2025-12-26, "21 Ocak" → 2026-01-21
"""

import psycopg2
from datetime import datetime
import os
from dotenv import load_dotenv
import re

# .env.local dosyasını yükle
load_dotenv('.env.local')

# Database connection
DATABASE_URL = os.getenv('DATABASE_URL')

# Türkçe ay isimleri
AYLAR = {
    'Ocak': 1, 'Şubat': 2, 'Mart': 3, 'Nisan': 4,
    'Mayıs': 5, 'Haziran': 6, 'Temmuz': 7, 'Ağustos': 8,
    'Eylül': 9, 'Ekim': 10, 'Kasım': 11, 'Aralık': 12
}

def parse_tarih(tarih_str):
    """
    Tarih string'ini parse et ve timestamp döndür.
    Örnek: "26 Aralık" → 2025-12-26
    Mantık: Ocak ayı → 2026, diğer aylar → 2025
    """
    if not tarih_str:
        return None
    
    # "26 Aralık" formatını parse et
    match = re.match(r'(\d+)\s+(\w+)', tarih_str)
    if not match:
        return None
    
    gun = int(match.group(1))
    ay_adi = match.group(2)
    
    if ay_adi not in AYLAR:
        return None
    
    ay = AYLAR[ay_adi]
    
    # Yıl belirleme: Ocak → 2026, diğerleri → 2025
    yil = 2026 if ay == 1 else 2025
    
    try:
        return datetime(yil, ay, gun)
    except ValueError:
        return None

def fix_crawled_at():
    """tarih kolonundan crawled_at'ı düzgün parse et - BATCH UPDATE"""
    
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    try:
        # Önce kaç kayıt var kontrol et
        cur.execute("""
            SELECT COUNT(*) 
            FROM sahibinden_liste 
            WHERE crawled_at < '2020-01-01'::timestamptz
        """)
        total = cur.fetchone()[0]
        
        print(f"\n📊 Güncellenecek kayıt sayısı: {total:,}")
        
        if total == 0:
            print("✅ Tüm kayıtlar güncel!")
            return
        
        # BATCH UPDATE - Tek SQL ile tüm kayıtları güncelle
        print("\n⚡ Batch update başlıyor...")
        
        # Ocak ayı için (2026)
        cur.execute("""
            UPDATE sahibinden_liste 
            SET crawled_at = (
                '2026-01-' || LPAD(SPLIT_PART(tarih, ' ', 1), 2, '0') || ' 00:00:00'
            )::timestamptz
            WHERE crawled_at < '2020-01-01'::timestamptz
            AND tarih LIKE '%Ocak%'
        """)
        ocak_count = cur.rowcount
        print(f"   ✅ Ocak: {ocak_count:,} kayıt")
        
        # Aralık ayı için (2025)
        cur.execute("""
            UPDATE sahibinden_liste 
            SET crawled_at = (
                '2025-12-' || LPAD(SPLIT_PART(tarih, ' ', 1), 2, '0') || ' 00:00:00'
            )::timestamptz
            WHERE crawled_at < '2020-01-01'::timestamptz
            AND tarih LIKE '%Aralık%'
        """)
        aralik_count = cur.rowcount
        print(f"   ✅ Aralık: {aralik_count:,} kayıt")
        
        # Kasım ayı için (2025)
        cur.execute("""
            UPDATE sahibinden_liste 
            SET crawled_at = (
                '2025-11-' || LPAD(SPLIT_PART(tarih, ' ', 1), 2, '0') || ' 00:00:00'
            )::timestamptz
            WHERE crawled_at < '2020-01-01'::timestamptz
            AND tarih LIKE '%Kasım%'
        """)
        kasim_count = cur.rowcount
        print(f"   ✅ Kasım: {kasim_count:,} kayıt")
        
        # Ekim ayı için (2025)
        cur.execute("""
            UPDATE sahibinden_liste 
            SET crawled_at = (
                '2025-10-' || LPAD(SPLIT_PART(tarih, ' ', 1), 2, '0') || ' 00:00:00'
            )::timestamptz
            WHERE crawled_at < '2020-01-01'::timestamptz
            AND tarih LIKE '%Ekim%'
        """)
        ekim_count = cur.rowcount
        print(f"   ✅ Ekim: {ekim_count:,} kayıt")
        
        # Diğer aylar için (varsa)
        for ay_adi, ay_no in AYLAR.items():
            if ay_adi in ['Ocak', 'Aralık', 'Kasım', 'Ekim']:
                continue
            
            yil = 2025
            cur.execute(f"""
                UPDATE sahibinden_liste 
                SET crawled_at = (
                    '{yil}-{ay_no:02d}-' || LPAD(SPLIT_PART(tarih, ' ', 1), 2, '0') || ' 00:00:00'
                )::timestamptz
                WHERE crawled_at < '2020-01-01'::timestamptz
                AND tarih LIKE '%{ay_adi}%'
            """)
            if cur.rowcount > 0:
                print(f"   ✅ {ay_adi}: {cur.rowcount:,} kayıt")
        
        conn.commit()
        
        updated = ocak_count + aralik_count + kasim_count + ekim_count
        failed = total - updated
        
        print(f"\n✅ {updated:,} kayıt güncellendi!")
        if failed > 0:
            print(f"⚠️  {failed:,} kayıt parse edilemedi")
        
        # Kontrol et
        cur.execute("""
            SELECT 
                MIN(crawled_at) as en_eski,
                MAX(crawled_at) as en_yeni,
                COUNT(*) as toplam
            FROM sahibinden_liste
        """)
        
        result = cur.fetchone()
        print(f"\n📅 Tarih Aralığı:")
        print(f"   En eski: {result[0]}")
        print(f"   En yeni: {result[1]}")
        print(f"   Toplam: {result[2]:,} ilan")
        
        # Ay dağılımı
        cur.execute("""
            SELECT 
                EXTRACT(YEAR FROM crawled_at) as yil,
                EXTRACT(MONTH FROM crawled_at) as ay,
                COUNT(*) as adet
            FROM sahibinden_liste
            WHERE crawled_at >= '2020-01-01'::timestamptz
            GROUP BY yil, ay
            ORDER BY yil DESC, ay DESC
            LIMIT 5
        """)
        
        print(f"\n📊 Ay Dağılımı (Son 5):")
        for row in cur.fetchall():
            yil, ay, adet = row
            print(f"   {int(yil)}-{int(ay):02d}: {adet:,} ilan")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Hata: {e}")
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    print("=" * 60)
    print("TARİH KOLONUNDAN CRAWLED_AT PARSE")
    print("=" * 60)
    
    fix_crawled_at()
    
    print("\n✅ İşlem tamamlandı!")
