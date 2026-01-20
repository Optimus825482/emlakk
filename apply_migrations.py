import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(".env")

# New Postgres (Destination)
POSTGRES_URL = "postgres://postgres:518518Erkan@77.42.68.4:5432/demir_db"

def apply_sql_file(conn, file_path):
    print(f"📄 Applying: {file_path}")
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Drizzle SQL files use --> statement-breakpoint
    statements = content.split("--> statement-breakpoint")
    
    cur = conn.cursor()
    for sql in statements:
        sql = sql.strip()
        if not sql:
            continue
        try:
            cur.execute(sql)
        except Exception as e:
            print(f"⚠️ Error in statement: {e}")
            conn.rollback()
            # If it's a "table already exists" error, we might want to continue
            if "already exists" in str(e).lower() or "already a type" in str(e).lower():
                print("   (Skipping as it already exists)")
                continue
            else:
                raise e
    conn.commit()
    cur.close()

def main():
    try:
        conn = psycopg2.connect(POSTGRES_URL)
        print("🔗 Connected to Postgres.")
        
        drizzle_dir = "drizzle"
        # Get .sql files in order
        sql_files = sorted([f for f in os.listdir(drizzle_dir) if f.endswith(".sql")])
        
        for sql_file in sql_files:
            apply_sql_file(conn, os.path.join(drizzle_dir, sql_file))
            
        print("✅ All migrations applied.")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    main()
