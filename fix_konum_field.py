#!/usr/bin/env python3
"""
Sahibinden Liste - Konum Field Fixer
====================================
Bu script, sahibinden_liste tablosundaki eski kayıtların konum sütununu düzeltir.
Konum sütununda "İlçe, Mahalle" formatında olan verileri sadece "Mahalle" olarak günceller.

Özellikler:
- Batch processing (100'er kayıt)
- Progress tracking
- Error handling
- Dry-run mode (test için)
- Checkpoint system (kesintide kaldığı yerden devam)
"""

import os
import sys
import json
import time
from datetime import datetime
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

# .env dosyasını yükle
load_dotenv()

# Database connection
DATABASE_URL = os.getenv("DIRECT_URL")
if not DATABASE_URL:
    print("❌ DATABASE_URL bulunamadı!")
    sys.exit(1)

# Configuration
BATCH_SIZE = 100  # Her seferde kaç kayıt işlenecek
DRY_RUN = True  # True yaparsanız sadece test eder, güncelleme yapmaz
CHECKPOINT_FILE = "konum_fix_checkpoint.json"


def load_checkpoint():
    """Checkpoint dosyasından son işlenen ID'yi yükle"""
    if os.path.exists(CHECKPOINT_FILE):
        with open(CHECKPOINT_FILE, "r") as f:
            data = json.load(f)
            return data.get("last_processed_id", 0)
    return 0


def save_checkpoint(last_id, processed_count, updated_count):
    """Checkpoint dosyasına ilerlemeyi kaydet"""
    with open(CHECKPOINT_FILE, "w") as f:
        json.dump({
            "last_processed_id": last_id,
            "processed_count": processed_count,
            "updated_count": updated_count,
            "last_update": datetime.now().isoformat()
        }, f, indent=2)


def parse_konum(konum_text, ilce):
    """
    Konum metnini parse et ve sadece mahalle adını döndür
    
    Örnekler:
    - "Hendek, Merkez" + ilce="Hendek" -> "Merkez"
    - "Akyazı, Kuzuluk" + ilce="Akyazı" -> "Kuzuluk"
    - "Merkez" + ilce="Hendek" -> "Merkez" (zaten düzgün)
    """
    if not konum_text or not ilce:
        return konum_text
    
    # Virgül varsa split et
    if "," in konum_text:
        parts = [p.strip() for p in konum_text.split(",")]
        
        # İlk kısım ilçe adıyla eşleşiyorsa, ikinci kısmı al
        if len(parts) >= 2 and parts[0].lower() == ilce.lower():
            return parts[1]
    
    # Değişiklik gerekmiyorsa olduğu gibi döndür
    return konum_text


def fix_konum_batch(conn, offset, batch_size, dry_run=False):
    """Bir batch kayıt işle"""
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Düzeltilmesi gereken kayıtları getir (konum'da virgül olanlar)
    query = """
        SELECT id, konum, ilce
        FROM sahibinden_liste
        WHERE konum LIKE '%,%'
        ORDER BY id
        LIMIT %s OFFSET %s
    """
    
    cursor.execute(query, (batch_size, offset))
    records = cursor.fetchall()
    
    if not records:
        return 0, 0  # processed, updated
    
    updated_count = 0
    
    for record in records:
        old_konum = record["konum"]
        ilce = record["ilce"]
        new_konum = parse_konum(old_konum, ilce)
        
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
    """Düzeltilmesi gereken toplam kayıt sayısını getir"""
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM sahibinden_liste WHERE konum LIKE '%,%'")
    count = cursor.fetchone()[0]
    cursor.close()
    return count


def main():
    print("=" * 70)
    print("🔧 Sahibinden Liste - Konum Field Fixer")
    print("=" * 70)
    print(f"Batch Size: {BATCH_SIZE}")
    print(f"Dry Run: {'✅ Evet (sadece test)' if DRY_RUN else '❌ Hayır (gerçek güncelleme)'}")
    print()
    
    # Database bağlantısı
    try:
        conn = psycopg2.connect(DATABASE_URL)
        print("✅ Database bağlantısı başarılı")
    except Exception as e:
        print(f"❌ Database bağlantı hatası: {e}")
        sys.exit(1)
    
    # Toplam kayıt sayısı
    total_count = get_total_count(conn)
    print(f"📊 Düzeltilecek toplam kayıt: {total_count}")
    
    if total_count == 0:
        print("✅ Düzeltilecek kayıt yok!")
        conn.close()
        return
    
    # Checkpoint'ten devam et
    last_processed_id = load_checkpoint()
    if last_processed_id > 0:
        print(f"📍 Checkpoint bulundu, ID {last_processed_id}'den devam ediliyor...")
    
    print()
    print("🚀 İşlem başlıyor...")
    print("-" * 70)
    
    # İstatistikler
    total_processed = 0
    total_updated = 0
    offset = 0
    start_time = time.time()
    
    try:
        while True:
            batch_start = time.time()
            
            # Batch işle
            processed, updated = fix_konum_batch(conn, offset, BATCH_SIZE, DRY_RUN)
            
            if processed == 0:
                break  # Tüm kayıtlar işlendi
            
            total_processed += processed
            total_updated += updated
            offset += BATCH_SIZE
            
            # Progress
            batch_time = time.time() - batch_start
            progress = (total_processed / total_count) * 100
            
            print(f"📦 Batch {offset // BATCH_SIZE}: "
                  f"{processed} işlendi, {updated} güncellendi | "
                  f"Progress: {progress:.1f}% | "
                  f"Süre: {batch_time:.2f}s")
            
            # Checkpoint kaydet
            if not DRY_RUN:
                save_checkpoint(offset, total_processed, total_updated)
            
            # Rate limiting (database'i yormamak için)
            time.sleep(0.1)
            
    except KeyboardInterrupt:
        print("\n⚠️  İşlem kullanıcı tarafından durduruldu!")
        print(f"📍 Checkpoint kaydedildi: {total_processed} kayıt işlendi")
        if not DRY_RUN:
            save_checkpoint(offset, total_processed, total_updated)
    except Exception as e:
        print(f"\n❌ Hata oluştu: {e}")
        if not DRY_RUN:
            save_checkpoint(offset, total_processed, total_updated)
        raise
    finally:
        conn.close()
    
    # Özet
    elapsed_time = time.time() - start_time
    print()
    print("=" * 70)
    print("✅ İşlem Tamamlandı!")
    print("=" * 70)
    print(f"📊 Toplam işlenen kayıt: {total_processed}")
    print(f"✏️  Güncellenen kayıt: {total_updated}")
    print(f"⏱️  Toplam süre: {elapsed_time:.2f} saniye")
    print(f"⚡ Ortalama hız: {total_processed / elapsed_time:.1f} kayıt/saniye")
    
    if DRY_RUN:
        print()
        print("⚠️  DRY-RUN modunda çalıştı, gerçek güncelleme yapılmadı!")
        print("💡 Gerçek güncelleme için script'te DRY_RUN = False yapın")
    else:
        print()
        print(f"💾 Checkpoint dosyası: {CHECKPOINT_FILE}")
        print("🗑️  İşlem tamamlandı, checkpoint dosyasını silebilirsiniz")
    
    print("=" * 70)


if __name__ == "__main__":
    # Kullanıcıya onay sor (dry-run değilse)
    if not DRY_RUN:
        print()
        print("⚠️  UYARI: Bu işlem 6000+ kayıt güncelleyecek!")
        print("💡 Önce DRY_RUN = True ile test etmeniz önerilir")
        print()
        response = input("Devam etmek istiyor musunuz? (evet/hayir): ")
        if response.lower() not in ["evet", "e", "yes", "y"]:
            print("❌ İşlem iptal edildi")
            sys.exit(0)
        print()
    
    main()
