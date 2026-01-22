#!/usr/bin/env python3
"""
İlçe isimlerini normalize et - case sensitivity düzelt
"""

import psycopg2
import os
from dotenv import load_dotenv

load_dotenv('.env.local')
DATABASE_URL = os.getenv('DATABASE_URL')

def fix_district_case():
    """İlçe isimlerini normalize et"""
    
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    try:
        # Önce mevcut durumu kontrol et
        cur.execute("""
            SELECT ilce, COUNT(*) as adet
            FROM sahibinden_liste
            GROUP BY ilce
            ORDER BY ilce
        """)
        
        print("\n📊 Mevcut İlçe Dağılımı:")
        for row in cur.fetchall():
            print(f"   {row[0]}: {row[1]:,} ilan")
        
        # "adapazari" -> "Adapazarı" güncelle
        cur.execute("""
            UPDATE sahibinden_liste 
            SET ilce = 'Adapazarı'
            WHERE LOWER(ilce) = 'adapazari'
        """)
        adapazari_count = cur.rowcount
        
        # "akyazi" -> "Akyazı" güncelle (varsa)
        cur.execute("""
            UPDATE sahibinden_liste 
            SET ilce = 'Akyazı'
            WHERE LOWER(ilce) = 'akyazi' AND ilce != 'Akyazı'
        """)
        akyazi_count = cur.rowcount
        
        # "hendek" -> "Hendek" güncelle (varsa)
        cur.execute("""
            UPDATE sahibinden_liste 
            SET ilce = 'Hendek'
            WHERE LOWER(ilce) = 'hendek' AND ilce != 'Hendek'
        """)
        hendek_count = cur.rowcount
        
        conn.commit()
        
        print(f"\n✅ Güncelleme Tamamlandı:")
        if adapazari_count > 0:
            print(f"   Adapazarı: {adapazari_count:,} kayıt")
        if akyazi_count > 0:
            print(f"   Akyazı: {akyazi_count:,} kayıt")
        if hendek_count > 0:
            print(f"   Hendek: {hendek_count:,} kayıt")
        
        # Yeni durumu kontrol et
        cur.execute("""
            SELECT ilce, COUNT(*) as adet
            FROM sahibinden_liste
            GROUP BY ilce
            ORDER BY ilce
        """)
        
        print(f"\n📊 Güncellenmiş İlçe Dağılımı:")
        for row in cur.fetchall():
            print(f"   {row[0]}: {row[1]:,} ilan")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Hata: {e}")
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    print("=" * 60)
    print("İLÇE İSİMLERİ NORMALIZE")
    print("=" * 60)
    
    fix_district_case()
    
    print("\n✅ İşlem tamamlandı!")
