#!/usr/bin/env python3
"""
Sahibinden Liste - Semt & Mahalle Migration
============================================
1. Yeni sütunlar ekler (semt, mahalle)
2. Mevcut konum verisini parse ederek yeni sütunlara doldurur

Örnek:
- "MerkezYeni Mah." -> semt="Merkez", mahalle="Yeni Mah."
- "KöylerDağdibi Mh." -> semt="Köyler", mahalle="Dağdibi Mh."
- "AkyazıÖmercikler Mh." -> semt="Akyazı", mahalle="Ömercikler Mh."
"""

import os
import sys
import json
import time
from datetime import datetime
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

load_dotenv()

DATABASE_URL = os.getenv("DIRECT_URL") or os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ DATABASE_URL veya DIRECT_URL bulunamadı!")
    sys.exit(1)

# Configuration
BATCH_SIZE = 100
DRY_RUN = False  # Gerçek güncelleme
CHECKPOINT_FILE = "semt_mahalle_migration_checkpoint.json"

# Yaygın semt/bölge isimleri
COMMON_SEMTS = [
    "Merkez", "Köyler", "İstiklal", "Tepekum", "Semerciler",
    "Adapazarı", "Akyazı", "Hendek", "Geyve", "Karasu",
    "Kaynarca", "Sapanca", "Serdivan", "Söğütlü", "Taraklı"
]


def load_checkpoint():
    if os.path.exists(CHECKPOINT_FILE):
        with open(CHECKPOINT_FILE, "r") as f:
            data = json.load(f)
            return data.get("last_processed_id", 0)
    return 0


def save_checkpoint(last_id, processed_count, updated_count):
    with open(CHECKPOINT_FILE, "w") as f:
        json.dump({
            "last_processed_id": last_id,
            "processed_count": processed_count,
            "updated_count": updated_count,
            "last_update": datetime.now().isoformat()
        }, f, indent=2)


def parse_konum_to_semt_mahalle(konum_text, ilce):
    """
    Konum metnini semt ve mahalle olarak ayır
    
    Strateji:
    1. CamelCase pattern kullan: İlk büyük harf grubu = semt, ikinci büyük harf grubu = mahalle
    2. Örnek: "TığcılarYahyalar Mah." -> "Tığcılar" + "Yahyalar Mah."
    3. Örnek: "MerkezYeni Mah." -> "Merkez" + "Yeni Mah."
    4. Örnek: "KöylerDağdibi Mh." -> "Köyler" + "Dağdibi Mh."
    
    Örnekler:
    - "TığcılarYahyalar Mah." -> ("Tığcılar", "Yahyalar Mah.")
    - "KaraosmanSakarya Mah." -> ("Karaosman", "Sakarya Mah.")
    - "MerkezYeni Mah." -> ("Merkez", "Yeni Mah.")
    - "Yeni Mah." -> (None, "Yeni Mah.") # Tek kelime, semt yok
    """
    if not konum_text:
        return None, None
    
    # Boşluk varsa zaten ayrılmış demektir
    if ' ' in konum_text and not konum_text[0].isupper():
        return None, konum_text
    
    # CamelCase pattern'i bul: Büyük harfle başlayan kelime grupları
    # Regex: Büyük harf + küçük harfler
    import re
    
    # Büyük harfle başlayan kelime gruplarını bul
    # Pattern: Büyük harf + (küçük harfler veya Türkçe karakterler)
    pattern = r'[A-ZÇĞİÖŞÜ][a-zçğıöşü]*'
    matches = re.findall(pattern, konum_text)
    
    if len(matches) == 0:
        # Hiç büyük harf yok, tüm metin mahalle
        return None, konum_text
    
    elif len(matches) == 1:
        # Tek kelime var
        # Eğer yaygın semt isimlerinden biriyse semt, değilse mahalle
        common_semts = ["Merkez", "Köyler", "İstiklal", "Tepekum", "Semerciler"]
        if matches[0] in common_semts:
            # Kalan kısmı al
            remaining = konum_text[len(matches[0]):].strip()
            if remaining:
                return matches[0], remaining
            else:
                return matches[0], None
        else:
            return None, konum_text
    
    else:
        # İki veya daha fazla kelime var
        # İlk kelime = semt, geri kalanı = mahalle
        semt = matches[0]
        
        # Semt'ten sonraki kısmı al
        semt_end_index = konum_text.find(semt) + len(semt)
        mahalle = konum_text[semt_end_index:].strip()
        
        if not mahalle:
            # Sadece semt var
            return semt, None
        
        return semt, mahalle


def apply_migration(conn):
    """SQL migration'ı uygula"""
    print("📝 Migration uygulanıyor...")
    
    cursor = conn.cursor()
    
    # SQL dosyasını oku ve uygula
    with open("add_semt_mahalle_columns.sql", "r", encoding="utf-8") as f:
        sql = f.read()
    
    try:
        cursor.execute(sql)
        conn.commit()
        print("✅ Migration başarıyla uygulandı")
        return True
    except Exception as e:
        print(f"❌ Migration hatası: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()


def migrate_batch(conn, offset, batch_size, dry_run=False):
    """Bir batch kayıt işle"""
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Sütunların varlığını kontrol et
    cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'sahibinden_liste' 
        AND column_name IN ('semt', 'mahalle')
    """)
    existing_columns = [row['column_name'] for row in cursor.fetchall()]
    has_columns = len(existing_columns) >= 2
    
    # Query'yi sütunlara göre ayarla
    if has_columns:
        query = """
            SELECT id, konum, ilce
            FROM sahibinden_liste
            WHERE konum IS NOT NULL 
            AND semt IS NULL 
            AND mahalle IS NULL
            ORDER BY id
            LIMIT %s OFFSET %s
        """
    else:
        query = """
            SELECT id, konum, ilce
            FROM sahibinden_liste
            WHERE konum IS NOT NULL
            ORDER BY id
            LIMIT %s OFFSET %s
        """
    
    cursor.execute(query, (batch_size, offset))
    records = cursor.fetchall()
    
    if not records:
        return 0, 0
    
    updated_count = 0
    
    for record in records:
        konum = record["konum"]
        ilce = record["ilce"]
        
        semt, mahalle = parse_konum_to_semt_mahalle(konum, ilce)
        
        if dry_run:
            semt_str = f"'{semt}'" if semt else "NULL"
            mahalle_str = f"'{mahalle}'" if mahalle else "NULL"
            print(f"  [DRY-RUN] ID {record['id']}: '{konum}' -> semt={semt_str}, mahalle={mahalle_str}")
        else:
            if has_columns:
                update_query = """
                    UPDATE sahibinden_liste
                    SET semt = %s, mahalle = %s
                    WHERE id = %s
                """
                cursor.execute(update_query, (semt, mahalle, record["id"]))
                updated_count += 1
    
    if not dry_run and has_columns:
        conn.commit()
    
    cursor.close()
    return len(records), updated_count


def get_total_count(conn):
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Sütunların varlığını kontrol et
    cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'sahibinden_liste' 
        AND column_name IN ('semt', 'mahalle')
    """)
    existing_columns = [row['column_name'] for row in cursor.fetchall()]
    
    # Eğer sütunlar yoksa, tüm kayıtları say
    if len(existing_columns) < 2:
        cursor.execute("SELECT COUNT(*) as count FROM sahibinden_liste WHERE konum IS NOT NULL")
    else:
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM sahibinden_liste 
            WHERE konum IS NOT NULL 
            AND semt IS NULL 
            AND mahalle IS NULL
        """)
    
    result = cursor.fetchone()
    count = result['count'] if result else 0
    cursor.close()
    return count


def main():
    print("=" * 70)
    print("🔧 Sahibinden Liste - Semt & Mahalle Migration")
    print("=" * 70)
    print(f"Batch Size: {BATCH_SIZE}")
    print(f"Dry Run: {'✅ Evet (sadece test)' if DRY_RUN else '❌ Hayır (gerçek güncelleme)'}")
    print()
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        print("✅ Database bağlantısı başarılı")
    except Exception as e:
        print(f"❌ Database bağlantı hatası: {e}")
        sys.exit(1)
    
    # Migration'ı uygula (dry-run'da da kontrol et)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'sahibinden_liste' 
        AND column_name IN ('semt', 'mahalle')
    """)
    existing_columns = [row['column_name'] for row in cursor.fetchall()]
    cursor.close()
    
    if len(existing_columns) < 2:
        if DRY_RUN:
            print("ℹ️  DRY-RUN modunda, migration simüle ediliyor...")
            print("   Sütunlar: semt, mahalle eklenecek")
            print()
        else:
            if not apply_migration(conn):
                print("❌ Migration başarısız, işlem durduruluyor")
                conn.close()
                sys.exit(1)
            print()
    else:
        print("✅ Sütunlar zaten mevcut (semt, mahalle)")
        print()
    
    total_count = get_total_count(conn)
    print(f"📊 Migrate edilecek kayıt: {total_count}")
    
    if total_count == 0:
        print("✅ Migrate edilecek kayıt yok!")
        conn.close()
        return
    
    print()
    print("🚀 İşlem başlıyor...")
    print("-" * 70)
    
    total_processed = 0
    total_updated = 0
    offset = 0
    start_time = time.time()
    
    try:
        while True:
            batch_start = time.time()
            
            processed, updated = migrate_batch(conn, offset, BATCH_SIZE, DRY_RUN)
            
            if processed == 0:
                break
            
            total_processed += processed
            total_updated += updated
            offset += BATCH_SIZE
            
            batch_time = time.time() - batch_start
            progress = (total_processed / total_count) * 100
            
            print(f"📦 Batch {offset // BATCH_SIZE}: "
                  f"{processed} işlendi, {updated} güncellendi | "
                  f"Progress: {progress:.1f}% | "
                  f"Süre: {batch_time:.2f}s")
            
            if not DRY_RUN:
                save_checkpoint(offset, total_processed, total_updated)
            
            time.sleep(0.1)
            
    except KeyboardInterrupt:
        print("\n⚠️  İşlem kullanıcı tarafından durduruldu!")
        if not DRY_RUN:
            save_checkpoint(offset, total_processed, total_updated)
    except Exception as e:
        print(f"\n❌ Hata oluştu: {e}")
        if not DRY_RUN:
            save_checkpoint(offset, total_processed, total_updated)
        raise
    finally:
        conn.close()
    
    elapsed_time = time.time() - start_time
    print()
    print("=" * 70)
    print("✅ İşlem Tamamlandı!")
    print("=" * 70)
    print(f"📊 Toplam işlenen kayıt: {total_processed}")
    print(f"✏️  Güncellenen kayıt: {total_updated}")
    print(f"⏱️  Toplam süre: {elapsed_time:.2f} saniye")
    
    if total_processed > 0:
        print(f"⚡ Ortalama hız: {total_processed / elapsed_time:.1f} kayıt/saniye")
    
    if DRY_RUN:
        print()
        print("⚠️  DRY-RUN modunda çalıştı, gerçek güncelleme yapılmadı!")
        print("💡 Gerçek güncelleme için script'te DRY_RUN = False yapın")
    else:
        print()
        print("🎉 Migration tamamlandı!")
        print("📋 Yeni sütunlar: semt, mahalle")
        print("💡 Crawler'ı da güncellemeyi unutmayın!")
    
    print("=" * 70)


if __name__ == "__main__":
    if not DRY_RUN:
        print()
        print("⚠️  UYARI: Bu işlem database şemasını değiştirecek!")
        print("💡 Önce DRY_RUN = True ile test etmeniz önerilir")
        print()
        response = input("Devam etmek istiyor musunuz? (evet/hayir): ")
        if response.lower() not in ["evet", "e", "yes", "y"]:
            print("❌ İşlem iptal edildi")
            sys.exit(0)
        print()
    
    main()
