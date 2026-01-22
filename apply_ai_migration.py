#!/usr/bin/env python3
"""
Apply AI Memory System Migration
Creates all necessary tables for Demir-AI Command Center
"""

import psycopg2
import os
from pathlib import Path

# Database connection
DATABASE_URL = "postgres://postgres:518518Erkan@77.42.68.4:5432/demir_db"

def apply_migration():
    """Apply AI tables migration"""
    print("🚀 Applying AI Memory System Migration...")
    
    # Read SQL file
    sql_file = Path(__file__).parent / "migrations" / "create_ai_tables.sql"
    
    if not sql_file.exists():
        print(f"❌ Migration file not found: {sql_file}")
        return False
    
    with open(sql_file, 'r', encoding='utf-8') as f:
        sql = f.read()
    
    try:
        # Connect to database
        print("📡 Connecting to database...")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # Execute migration
        print("⚙️  Executing migration...")
        cursor.execute(sql)
        conn.commit()
        
        # Verify tables
        print("\n✅ Verifying tables...")
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE 'ai_%' OR table_name = 'command_history'
            ORDER BY table_name
        """)
        
        tables = cursor.fetchall()
        print(f"\n📊 Created {len(tables)} tables:")
        for table in tables:
            print(f"   ✓ {table[0]}")
        
        # Check indexes
        cursor.execute("""
            SELECT indexname 
            FROM pg_indexes 
            WHERE schemaname = 'public' 
            AND indexname LIKE 'idx_ai_%'
            ORDER BY indexname
        """)
        
        indexes = cursor.fetchall()
        print(f"\n🔍 Created {len(indexes)} indexes:")
        for idx in indexes[:5]:  # Show first 5
            print(f"   ✓ {idx[0]}")
        if len(indexes) > 5:
            print(f"   ... and {len(indexes) - 5} more")
        
        cursor.close()
        conn.close()
        
        print("\n✅ Migration completed successfully!")
        print("\n🎉 Demir-AI Command Center database is ready!")
        return True
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        return False

if __name__ == "__main__":
    success = apply_migration()
    exit(0 if success else 1)
