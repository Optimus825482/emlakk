import psycopg2
import os
from dotenv import load_dotenv

# .env.local dosyasını yükle
load_dotenv('.env.local')

# Database bağlantısı
DATABASE_URL = os.getenv('DATABASE_URL')
print(f"Connecting to: {DATABASE_URL[:50]}...")

try:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    # İlçe kolonunu kontrol et
    print("\n=== İLÇE KOLONU KONTROLÜ ===\n")
    
    cur.execute("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'sahibinden_liste' 
        AND column_name = 'ilce'
    """)
    
    column_info = cur.fetchone()
    if column_info:
        print(f"✅ 'ilce' kolonu mevcut")
        print(f"   - Tip: {column_info[1]}")
        print(f"   - Nullable: {column_info[2]}")
    else:
        print("❌ 'ilce' kolonu bulunamadı!")
    
    # İlçe verilerini kontrol et
    print("\n=== İLÇE VERİLERİ ===\n")
    
    cur.execute("""
        SELECT 
            ilce,
            COUNT(*) as count
        FROM sahibinden_liste 
        WHERE ilce IS NOT NULL 
        GROUP BY ilce 
        ORDER BY count DESC
    """)
    
    districts = cur.fetchall()
    
    if districts:
        print(f"Toplam {len(districts)} farklı ilçe bulundu:\n")
        for district, count in districts:
            print(f"  {district}: {count:,} ilan")
    else:
        print("❌ Hiç ilçe verisi yok!")
    
    # NULL değerleri kontrol et
    print("\n=== NULL KONTROL ===\n")
    
    cur.execute("""
        SELECT 
            COUNT(*) as total,
            COUNT(ilce) as with_district,
            COUNT(*) - COUNT(ilce) as without_district
        FROM sahibinden_liste
    """)
    
    total, with_district, without_district = cur.fetchone()
    print(f"Toplam ilan: {total:,}")
    print(f"İlçe bilgisi olan: {with_district:,} ({with_district*100/total:.1f}%)")
    print(f"İlçe bilgisi olmayan: {without_district:,} ({without_district*100/total:.1f}%)")
    
    # Örnek kayıtlar
    print("\n=== ÖRNEK KAYITLAR ===\n")
    
    cur.execute("""
        SELECT id, baslik, konum, ilce
        FROM sahibinden_liste 
        WHERE ilce IS NOT NULL
        LIMIT 5
    """)
    
    samples = cur.fetchall()
    for id, baslik, konum, ilce in samples:
        print(f"ID: {id}")
        print(f"  Başlık: {baslik[:50]}...")
        print(f"  Konum: {konum}")
        print(f"  İlçe: {ilce}")
        print()
    
    cur.close()
    conn.close()
    
    print("✅ Kontrol tamamlandı!")
    
except Exception as e:
    print(f"❌ Hata: {e}")
