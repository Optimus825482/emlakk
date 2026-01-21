"""
Duplicate Kontrol ve Temizleme - Sahibinden Liste
==================================================
Veritabanındaki duplicate ilanları bulur ve temizler.

Kullanım:
    python check_duplicates.py --check          # Sadece kontrol et
    python check_duplicates.py --remove         # Duplicate'leri sil
    python check_duplicates.py --check --table new_listings  # Başka tablo
"""

import argparse
import sys
from datetime import datetime
from db_manager import db
from dotenv import load_dotenv

# Load environment
load_dotenv()


def check_duplicates(table_name: str = "sahibinden_liste") -> dict:
    """
    Duplicate link'leri kontrol et
    
    Args:
        table_name: Kontrol edilecek tablo adı
        
    Returns:
        {
            "total_records": 1000,
            "unique_links": 950,
            "duplicate_count": 50,
            "duplicates": [
                {"link": "https://...", "count": 3, "oldest": "2024-01-01", "newest": "2024-01-15"},
                ...
            ]
        }
    """
    print(f"\n{'='*60}")
    print(f"🔍 DUPLICATE KONTROL: {table_name} (link bazlı)")
    print(f"{'='*60}\n")
    
    try:
        # Toplam kayıt sayısı
        total_result = db.execute_one(f"SELECT COUNT(*) as count FROM {table_name}")
        total_records = total_result["count"] if total_result else 0
        
        print(f"📊 Toplam kayıt: {total_records:,}")
        
        # Unique link sayısı
        unique_result = db.execute_one(f"SELECT COUNT(DISTINCT link) as count FROM {table_name}")
        unique_links = unique_result["count"] if unique_result else 0
        
        print(f"🔗 Unique link: {unique_links:,}")
        
        # Duplicate sayısı
        duplicate_count = total_records - unique_links
        
        if duplicate_count == 0:
            print(f"\n✅ Duplicate yok! Tüm kayıtlar unique.\n")
            return {
                "total_records": total_records,
                "unique_links": unique_links,
                "duplicate_count": 0,
                "duplicates": []
            }
        
        print(f"⚠️  Duplicate kayıt: {duplicate_count:,}\n")
        
        # Duplicate link'leri ve detaylarını bul
        query = f"""
            SELECT 
                link,
                COUNT(*) as count,
                MIN(crawled_at) as oldest_crawl,
                MAX(crawled_at) as newest_crawl,
                ARRAY_AGG(id) as listing_ids,
                ARRAY_AGG(ctid) as row_ids
            FROM {table_name}
            GROUP BY link
            HAVING COUNT(*) > 1
            ORDER BY count DESC, link
        """
        
        duplicates = db.execute_query(query)
        
        print(f"📋 Duplicate Link'ler:\n")
        print(f"{'Link':<50} {'Adet':<8} {'ID\'ler':<30} {'İlk Tarih':<20}")
        print(f"{'-'*120}")
        
        for dup in duplicates[:20]:  # İlk 20'yi göster
            link_short = dup['link'][:47] + "..." if len(dup['link']) > 50 else dup['link']
            ids_str = str(dup['listing_ids'][:3])[1:-1]  # İlk 3 ID'yi göster
            if len(dup['listing_ids']) > 3:
                ids_str += "..."
            print(f"{link_short:<50} {dup['count']:<8} {ids_str:<30} {str(dup['oldest_crawl']):<20}")
        
        if len(duplicates) > 20:
            print(f"\n... ve {len(duplicates) - 20} tane daha\n")
        
        return {
            "total_records": total_records,
            "unique_links": unique_links,
            "duplicate_count": duplicate_count,
            "duplicates": duplicates
        }
        
    except Exception as e:
        print(f"\n❌ Hata: {e}\n")
        return None


def remove_duplicates(table_name: str = "sahibinden_liste", dry_run: bool = False) -> int:
    """
    Duplicate kayıtları sil (link bazlı - en yeni olanı tut)
    
    Args:
        table_name: Temizlenecek tablo adı
        dry_run: True ise sadece simülasyon (silme yapmaz)
        
    Returns:
        Silinen kayıt sayısı
    """
    print(f"\n{'='*60}")
    print(f"🗑️  DUPLICATE TEMİZLEME: {table_name} (link bazlı)")
    print(f"{'='*60}\n")
    
    if dry_run:
        print("⚠️  DRY RUN MODU: Hiçbir kayıt silinmeyecek (sadece simülasyon)\n")
    
    try:
        # Önce duplicate kontrolü yap
        check_result = check_duplicates(table_name)
        
        if not check_result or check_result["duplicate_count"] == 0:
            print("✅ Temizlenecek duplicate yok.\n")
            return 0
        
        duplicates = check_result["duplicates"]
        
        print(f"\n🎯 Strateji: Her link için EN YENİ kaydı tut, eskilerini sil\n")
        
        # Onay al (dry_run değilse)
        if not dry_run:
            response = input(f"⚠️  {check_result['duplicate_count']} duplicate kayıt silinecek. Emin misin? (yes/no): ")
            if response.lower() != "yes":
                print("\n❌ İşlem iptal edildi.\n")
                return 0
        
        deleted_count = 0
        
        for dup in duplicates:
            link = dup["link"]
            count = dup["count"]
            
            # Her link için en yeni kaydı tut, eskilerini sil
            delete_query = f"""
                DELETE FROM {table_name}
                WHERE link = %s
                AND ctid NOT IN (
                    SELECT ctid
                    FROM {table_name}
                    WHERE link = %s
                    ORDER BY crawled_at DESC
                    LIMIT 1
                )
            """
            
            if not dry_run:
                db.execute_query(delete_query, (link, link), fetch=False)
                deleted_count += (count - 1)  # count - 1 = silinen kayıt sayısı
                link_short = link[:60] + "..." if len(link) > 60 else link
                print(f"✓ {link_short}: {count - 1} duplicate silindi")
            else:
                deleted_count += (count - 1)
                link_short = link[:60] + "..." if len(link) > 60 else link
                print(f"[DRY RUN] {link_short}: {count - 1} duplicate silinecek")
        
        print(f"\n{'='*60}")
        if dry_run:
            print(f"✅ Simülasyon tamamlandı: {deleted_count} kayıt silinecekti")
        else:
            print(f"✅ Temizleme tamamlandı: {deleted_count} duplicate silindi")
        print(f"{'='*60}\n")
        
        # Temizleme sonrası kontrol
        if not dry_run:
            print("\n🔍 Temizleme sonrası kontrol:\n")
            check_duplicates(table_name)
        
        return deleted_count
        
    except Exception as e:
        print(f"\n❌ Hata: {e}\n")
        return 0


def analyze_duplicates(table_name: str = "sahibinden_liste"):
    """
    Duplicate'lerin detaylı analizini yap (link bazlı)
    """
    print(f"\n{'='*60}")
    print(f"📊 DUPLICATE ANALİZİ: {table_name} (link bazlı)")
    print(f"{'='*60}\n")
    
    try:
        # Duplicate dağılımı (kaç tane 2x, 3x, 4x duplicate var?)
        distribution_query = f"""
            SELECT 
                duplicate_count,
                COUNT(*) as link_count,
                duplicate_count * COUNT(*) as total_records
            FROM (
                SELECT link, COUNT(*) as duplicate_count
                FROM {table_name}
                GROUP BY link
                HAVING COUNT(*) > 1
            ) sub
            GROUP BY duplicate_count
            ORDER BY duplicate_count
        """
        
        distribution = db.execute_query(distribution_query)
        
        if not distribution:
            print("✅ Duplicate yok!\n")
            return
        
        print("📈 Duplicate Dağılımı:\n")
        print(f"{'Tekrar Sayısı':<15} {'Link Sayısı':<15} {'Toplam Kayıt':<15}")
        print(f"{'-'*45}")
        
        total_duplicate_records = 0
        for row in distribution:
            print(f"{row['duplicate_count']:<15} {row['link_count']:<15} {row['total_records']:<15}")
            total_duplicate_records += row['total_records']
        
        print(f"\n📊 Toplam duplicate kayıt: {total_duplicate_records:,}\n")
        
        # En çok duplicate olan link'ler
        top_duplicates_query = f"""
            SELECT 
                link,
                COUNT(*) as count,
                MIN(crawled_at) as first_seen,
                MAX(crawled_at) as last_seen,
                ARRAY_AGG(id ORDER BY crawled_at DESC) as listing_ids
            FROM {table_name}
            GROUP BY link
            HAVING COUNT(*) > 1
            ORDER BY count DESC
            LIMIT 10
        """
        
        top_duplicates = db.execute_query(top_duplicates_query)
        
        print("🔝 En Çok Duplicate Olan 10 Link:\n")
        print(f"{'Link':<50} {'Adet':<8} {'İlk Görülme':<20} {'Son Görülme':<20}")
        print(f"{'-'*100}")
        
        for row in top_duplicates:
            link_short = row['link'][:47] + "..." if len(row['link']) > 50 else row['link']
            print(f"{link_short:<50} {row['count']:<8} {str(row['first_seen']):<20} {str(row['last_seen']):<20}")
            # ID'leri de göster
            ids_str = str(row['listing_ids'][:5])[1:-1]  # İlk 5 ID
            if len(row['listing_ids']) > 5:
                ids_str += "..."
            print(f"  └─ ID'ler: {ids_str}\n")
        
        print()
        
    except Exception as e:
        print(f"\n❌ Hata: {e}\n")


def main():
    parser = argparse.ArgumentParser(description="Duplicate Kontrol ve Temizleme")
    parser.add_argument("--check", action="store_true", help="Duplicate'leri kontrol et")
    parser.add_argument("--remove", action="store_true", help="Duplicate'leri sil")
    parser.add_argument("--analyze", action="store_true", help="Detaylı analiz yap")
    parser.add_argument("--dry-run", action="store_true", help="Simülasyon modu (silme yapmaz)")
    parser.add_argument("--table", default="sahibinden_liste", help="Tablo adı (default: sahibinden_liste)")
    
    args = parser.parse_args()
    
    # Hiçbir argüman verilmemişse help göster
    if not (args.check or args.remove or args.analyze):
        parser.print_help()
        sys.exit(0)
    
    # Kontrol
    if args.check:
        check_duplicates(args.table)
    
    # Analiz
    if args.analyze:
        analyze_duplicates(args.table)
    
    # Temizleme
    if args.remove:
        remove_duplicates(args.table, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
