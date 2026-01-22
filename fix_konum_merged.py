#!/usr/bin/env python3
"""
Sahibinden Liste - Merged Konum Fixer
======================================
Konum sütununda ilçe adı ile mahalle adı birleşmiş kayıtları düzeltir.

Örnekler:
- "MerkezYeni Mah." -> "Yeni Mah."
- "AkyazıÖmercikler Mh." -> "Ömercikler Mh."
- "KuzulukKuzuluk Ortamahalle Mh." -> "Kuzuluk Ortamahalle Mh."
"""

import os
import sys
import json
import time
import re
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
DRY_RUN = True  # İlk test için True
CHECKPOINT_FILE = "konum_merged_fix_checkpoint.json"


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


def clean_konum(konum_text, ilce):
    """
    Konum metninden ilçe adını temizle
    
    Örnekler:
    - "MerkezYeni Mah." + ilce="Hendek" -> "Yeni Mah."
    - "AkyazıÖmercikler Mh." + ilce="Akyazı" -> "Ömercikler Mh."
    - "KuzulukKuzuluk Ortamahalle" + ilce="Akyazı" -> "Kuzuluk Ortamahalle"
    - "Merkez" + ilce="Hendek" -> "Merkez" (değişmez)
    """
    if not konum_text or not ilce:
        return konum_text
    
    original = konum_text
    
    # Yaygın mahalle/semt isimleri (ilçe adı olmayanlar)
    common_neighborhoods = [
        "Merkez", "Köyler", "Yeni", "Eski", "Cumhuriyet", "İstiklal",
        "Tepekum", "Semerciler", "Kemaliye", "Başpınar", "İnönü",
        "Hızırtepe", "Beylice", "Kadifekale", "Ömercikler", "Sarıdede",
        "Uzunçınar", "Karaköy", "Kızılcıkorman", "Şeker", "Nuriye",
        "Düzyazı", "Ortamahalle"
    ]
    
    # İlçe adı ile başlıyorsa ve hemen ardından mahalle adı geliyorsa
    if konum_text.startswith(ilce):
        # İlçe adını kaldır
        remaining = konum_text[len(ilce):]
        
        # Eğer kalan kısım boşsa veya sadece boşluksa, "Merkez" yap
        if not remaining.strip():
            return "Merkez"
        
        # Kalan kısmı döndür
        return remaining.strip()
    
    # Yaygın mahalle isimleri ile başlıyorsa kontrol et
    for neighborhood in common_neighborhoods:
        if konum_text.startswith(neighborhood):
            # Hemen ardından başka bir kelime geliyorsa (boşluksuz birleşmiş)
            if len(konum_text) > len(neighborhood):
                next_char = konum_text[len(neighborhood)]
                # Eğer sonraki karakter büyük harf ise (birleşmiş kelime)
                if next_char.isupper():
                    # İlk kelimeyi (Merkez, Köyler vs.) kaldır
                    return konum_text[len(neighborhood):].strip()
    
    # Değişiklik gerekmiyorsa olduğu gibi döndür
    return konum_text


def fix_konum_batch(conn, offset, batch_size, dry_run=False):
    """Bir batch kayıt işle"""
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Tüm kayıtları getir
    query = """
        SELECT id, konum, ilce
        FROM sahibinden_liste
        WHERE konum IS NOT NULL AND ilce IS NOT NULL
        ORDER BY id
        LIMIT %s OFFSET %s
    """
    
    cursor.execute(query, (batch_size, offset))
    records = cursor.fetchall()
    
    if not records:
        return 0, 0
    
    updated_count = 0
    
    for record in records:
        old_konum = record["konum"]
        ilce = record["ilce"]
        new_konum = clean_konum(old_konum, ilce)
        
        # Değişiklik varsa güncelle
        if new_konum != old_konum:
            if dry_run:
                print(f"  [DRY-RUN] ID {record['id']}: '{old_konum}' -> '{new_konum}'")
            else:
                update_query = """
                    UPDATE sahibinden_liste
                    SET konum = %s
                    WHERE id = %s
                """
                cursor.execute(update_query, (new_konum, record["id"]))
                updated_count += 1
    
    if not dry_run:
        conn.commit()
    
    cursor.close()
    return len(records), updated_count


def get_total_count(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM sahibinden_liste WHERE konum IS NOT NULL AND ilce IS NOT NULL")
    count = cursor.fetchone()[0]
    cursor.close()
    return count


def main():
    print("=" * 70)
    print("🔧 Sahibinden Liste - Merged Konum Fixer")
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
    
    total_count = get_total_count(conn)
    print(f"📊 Toplam kayıt: {total_count}")
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
            
            processed, updated = fix_konum_batch(conn, offset, BATCH_SIZE, DRY_RUN)
            
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
    
    print("=" * 70)


if __name__ == "__main__":
    if not DRY_RUN:
        print()
        print("⚠️  UYARI: Bu işlem 6000+ kayıt güncelleyecek!")
        print()
        response = input("Devam etmek istiyor musunuz? (evet/hayir): ")
        if response.lower() not in ["evet", "e", "yes", "y"]:
            print("❌ İşlem iptal edildi")
            sys.exit(0)
        print()
    
    main()
