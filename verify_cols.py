import psycopg2

DATABASE_URL = "postgres://postgres:518518Erkan@77.42.68.4:5432/demir_db"

def check_columns():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'valuations'
            ORDER BY ordinal_position;
        """)
        columns = cur.fetchall()
        print("Columns in 'valuations':")
        for col in columns:
            print(f" - {col[0]}")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_columns()
