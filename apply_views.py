import psycopg2
from dotenv import load_dotenv
import os

load_dotenv(".env")

# New Postgres (Destination)
POSTGRES_URL = "postgres://postgres:518518Erkan@77.42.68.4:5432/demir_db"

def main():
    try:
        conn = psycopg2.connect(POSTGRES_URL)
        print("🔗 Connected to Postgres.")
        cur = conn.cursor()
        
        # 1. recent_new_listings View
        print("🏗️ Creating recent_new_listings view...")
        cur.execute("""
        CREATE OR REPLACE VIEW recent_new_listings AS
        SELECT 
            nl.*,
            sl.crawled_at,
            EXTRACT(EPOCH FROM (NOW() - nl.first_seen_at)) / 3600 AS hours_since_added
        FROM new_listings nl
        LEFT JOIN sahibinden_liste sl ON nl.listing_id = sl.id
        WHERE nl.first_seen_at >= NOW() - INTERVAL '2 days'
        ORDER BY nl.first_seen_at DESC;
        """)
        
        # 2. new_listings_stats View
        print("🏗️ Creating new_listings_stats view...")
        cur.execute("""
        CREATE OR REPLACE VIEW new_listings_stats AS
        SELECT 
            category,
            transaction,
            COUNT(*) as total_new,
            COUNT(*) FILTER (WHERE first_seen_at >= NOW() - INTERVAL '24 hours') as last_24h,
            COUNT(*) FILTER (WHERE first_seen_at >= NOW() - INTERVAL '48 hours') as last_48h,
            MIN(first_seen_at) as oldest_new,
            MAX(first_seen_at) as newest_new
        FROM new_listings
        WHERE first_seen_at >= NOW() - INTERVAL '2 days'
        GROUP BY category, transaction
        ORDER BY category, transaction;
        """)
        
        # 3. recent_removed_listings View
        print("🏗️ Creating recent_removed_listings view...")
        cur.execute("""
        CREATE OR REPLACE VIEW recent_removed_listings AS
        SELECT 
            rl.*,
            CASE 
                WHEN days_active <= 7 THEN 'quick_removal'
                WHEN days_active <= 30 THEN 'normal'
                WHEN days_active <= 90 THEN 'long_term'
                ELSE 'very_long_term'
            END as listing_duration_category
        FROM removed_listings rl
        WHERE removed_at >= NOW() - INTERVAL '30 days'
        ORDER BY removed_at DESC;
        """)

        # 4. removed_listings_stats View
        print("🏗️ Creating removed_listings_stats view...")
        cur.execute("""
        CREATE OR REPLACE VIEW removed_listings_stats AS
        SELECT 
            category,
            transaction,
            COUNT(*) as total_removed,
            AVG(days_active) as avg_days_active,
            AVG(last_price) as avg_price,
            MIN(removed_at) as first_removal,
            MAX(removed_at) as last_removal
        FROM removed_listings
        GROUP BY category, transaction
        ORDER BY total_removed DESC;
        """)
        
        conn.commit()
        cur.close()
        print("✅ Views created successfully.")
    except Exception as e:
        print(f"❌ View creation failed: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    main()
