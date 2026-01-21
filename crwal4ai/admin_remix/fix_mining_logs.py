#!/usr/bin/env python3
"""
Fix mining_logs table id column
Problem: id column is NOT NULL but no DEFAULT value
Solution: Add DEFAULT with auto-increment sequence
"""

from db_manager import db
import sys

def fix_mining_logs_id():
    """Fix mining_logs id column to auto-generate UUID"""
    
    print("🔧 Fixing mining_logs table...")
    print("   Detected: id column is UUID type")
    
    try:
        # 1. Add DEFAULT gen_random_uuid() to id column (PostgreSQL 13+ built-in)
        print("1️⃣ Adding DEFAULT gen_random_uuid() to id column...")
        db.execute_query(
            "ALTER TABLE mining_logs ALTER COLUMN id SET DEFAULT gen_random_uuid()",
            fetch=False
        )
        print("   ✅ DEFAULT added")
        
        print("\n✅ mining_logs table fixed successfully!")
        print("   Now INSERT queries will auto-generate UUID values.")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error fixing mining_logs: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = fix_mining_logs_id()
    sys.exit(0 if success else 1)
