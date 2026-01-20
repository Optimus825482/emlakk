import os
import psycopg2
from psycopg2 import extras
from supabase import create_client, Client
from dotenv import load_dotenv
import time
from datetime import datetime

# Load environment
load_dotenv(".env")

# --- CONFIGURATION ---
# Supabase (Source)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

# New Postgres (Destination)
# Format: postgres://user:password@host:port/dbname
POSTGRES_URL = "postgres://postgres:518518Erkan@77.42.68.4:5432/demir_db"

def migrate_table(supabase_client, pg_conn, table_name, conflict_col='id'):
    print(f"📦 Migrating table: {table_name}...")
    
    # Register JSON adapter for this connection
    extras.register_default_jsonb(pg_conn)
    
    # 1. Get data from Supabase
    try:
        response = supabase_client.table(table_name).select("*").execute()
        data = response.data
        if not data:
            print(f"ℹ️ No data found in {table_name}")
            return
        print(f"📄 Found {len(data)} records in {table_name}")
    except Exception as e:
        print(f"❌ Error fetching from Supabase ({table_name}): {e}")
        return

    # 2. Re-create table schema in Postgres (Basic inference or manual)
    # Since we have the SQL files, we should ideally run them.
    # But for a quick migration, we can try to insert and let it fail or prepare it.
    
    if not data:
        return

    # 3. Get target columns from Postgres
    cur = pg_conn.cursor()
    cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name = %s", (table_name,))
    pg_cols = [r[0] for r in cur.fetchall()]
    cur.close()

    if not pg_cols:
        print(f"❌ Could not find columns for {table_name} in Postgres")
        return

    # Filter source columns to only those that exist in target
    source_cols = data[0].keys()
    cols = [c for c in source_cols if c in pg_cols]
    
    if len(cols) < len(source_cols):
        missing = set(source_cols) - set(pg_cols)
        print(f"⚠️ Skipping missing columns in target: {missing}")

    # 4. Prepare Insert
    query = f"INSERT INTO {table_name} ({', '.join(cols)}) VALUES %s ON CONFLICT ({conflict_col}) DO UPDATE SET "
    query += ", ".join([f"{col} = EXCLUDED.{col}" for col in cols if col != conflict_col])

    import json
    values = []
    for row in data:
        row_values = []
        for col in cols:
            val = row.get(col)
            if isinstance(val, (dict, list)):
                row_values.append(json.dumps(val))
            else:
                row_values.append(val)
        values.append(row_values)

    # 5. Execute
    try:
        cur = pg_conn.cursor()
        extras.execute_values(cur, query, values)
        pg_conn.commit()
        cur.close()
        print(f"✅ Successfully migrated {len(data)} records to {table_name}")
    except Exception as e:
        pg_conn.rollback()
        print(f"❌ Error inserting into Postgres ({table_name}): {e}")

def create_schema(pg_conn):
    print("🏗️ Creating schema in target database...")
    cur = pg_conn.cursor()
    
    # Drop existing tables to refresh schema (Optional, use carefully)
    tables_to_drop = ['sahibinden_liste', 'mining_jobs', 'mining_logs', 'new_listings', 'removed_listings', 'category_stats']
    for t in tables_to_drop:
        cur.execute(f"DROP TABLE IF EXISTS {t} CASCADE;")
    
    # Main listings table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS sahibinden_liste (
        id BIGINT PRIMARY KEY,
        baslik TEXT,
        link TEXT,
        fiyat BIGINT,
        konum TEXT,
        tarih TEXT,
        resim TEXT,
        category TEXT,
        transaction TEXT,
        crawled_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        koordinatlar JSONB,
        satici TEXT,
        ilan_no TEXT,
        m2 TEXT,
        resim_sayisi INTEGER,
        detay_hatasi TEXT,
        detay_cekildi BOOLEAN DEFAULT FALSE,
        detay_tarihi TIMESTAMPTZ,
        aciklama TEXT,
        ozellikler JSONB,
        ek_ozellikler JSONB,
        ic_ozellikler JSONB,
        dis_ozellikler JSONB,
        konum_ozellikleri JSONB,
        cephe TEXT,
        resimler JSONB
    );
    """)

    # mining_jobs table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS mining_jobs (
        id UUID PRIMARY KEY,
        job_id TEXT,
        category TEXT,
        transaction TEXT,
        status TEXT,
        total_pages INTEGER,
        processed_pages INTEGER,
        total_listings INTEGER,
        new_listings INTEGER,
        updated_listings INTEGER,
        removed_listings INTEGER,
        duplicates INTEGER,
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        job_type TEXT,
        error_message TEXT,
        config JSONB,
        stats JSONB,
        progress JSONB,
        source TEXT,
        error TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    """)

    # mining_logs table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS mining_logs (
        id UUID PRIMARY KEY,
        job_id UUID,
        level TEXT,
        message TEXT,
        data JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    """)

    # new_listings table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS new_listings (
        id BIGSERIAL PRIMARY KEY,
        listing_id BIGINT UNIQUE,
        baslik TEXT,
        link TEXT,
        fiyat BIGINT,
        konum TEXT,
        category TEXT,
        transaction TEXT,
        resim TEXT,
        first_seen_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    """)

    # removed_listings table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS removed_listings (
        id BIGSERIAL PRIMARY KEY,
        listing_id BIGINT UNIQUE,
        baslik TEXT,
        link TEXT,
        last_price BIGINT,
        fiyat BIGINT,
        konum TEXT,
        category TEXT,
        transaction TEXT,
        resim TEXT,
        last_seen_at TIMESTAMPTZ,
        removed_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        removal_reason TEXT,
        days_active INTEGER,
        price_changes INTEGER DEFAULT 0,
        notes TEXT
    );
    """)

    # category_stats table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS category_stats (
        id BIGSERIAL PRIMARY KEY,
        category TEXT,
        transaction TEXT,
        sahibinden_count INTEGER,
        database_count INTEGER,
        diff INTEGER,
        status TEXT,
        last_checked_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(category, transaction)
    );
    """)

    pg_conn.commit()
    cur.close()
    print("✅ Schema created/verified.")

def main():
    print("🚀 Starting Database Migration from Supabase to VPS Postgres...")
    
    # Connect Supabase
    try:
        # Load from .env in current or parent dir
        load_dotenv(".env")
        load_dotenv("../.env")
        
        url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
        
        if not url or not key:
            print(f"❌ Supabase credentials missing (URL: {url}, KEY: {'set' if key else 'missing'})")
            return

        supabase: Client = create_client(url, key)
        print(f"🔗 Connected to Supabase: {url}")
    except Exception as e:
        print(f"❌ Could not connect to Supabase: {e}")
        return

    # Connect Postgres
    try:
        pg_conn = psycopg2.connect(POSTGRES_URL)
    except Exception as e:
        print(f"❌ Could not connect to Postgres: {e}")
        return

    # 1. Create Schema
    create_schema(pg_conn)

    # 2. Migrate Tables
    tables = [
        # Crawler tables
        ('sahibinden_liste', 'id'),
        ('new_listings', 'listing_id'),
        ('removed_listings', 'listing_id'),
        ('category_stats', 'id'),
        ('mining_jobs', 'id'),
        ('mining_logs', 'id'),
        
        # Next.js Application tables
        ('users', 'id'),
        ('listings', 'id'),
        ('appointments', 'id'),
        ('contacts', 'id'),
        ('valuations', 'id'),
        ('about_page', 'id'),
        ('hendek_stats', 'id'),
        ('page_content', 'id'),
        ('site_settings', 'id'),
        ('system_settings', 'id'),
        ('email_settings', 'id'),
        ('notifications', 'id'),
        ('listing_analytics', 'id'),
        ('workflow_logs', 'id'),
        ('seo_settings', 'id'),
        ('collected_listings', 'id')
    ]

    for table_name, pk in tables:
        print(f"\n📦 Processing table: {table_name}")
        migrate_table(supabase, pg_conn, table_name, pk)

    pg_conn.close()
    print("\n🏁 Migration Complete!")
    print("Next steps: Update .env files to use POSTGRES_URL.")

if __name__ == "__main__":
    main()
