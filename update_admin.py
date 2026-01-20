import psycopg2

POSTGRES_URL = "postgres://postgres:518518Erkan@77.42.68.4:5432/demir_db"
PASSWORD_HASH = "$2b$12$W7eICDPBWBAcHo/DJQrykew5FbbBEcYXgMtrgGvVZTZODqiH1LdPO"

def main():
    try:
        conn = psycopg2.connect(POSTGRES_URL)
        cur = conn.cursor()
        
        sql = """
        INSERT INTO users (id, email, password, name, role, is_active, username) 
        VALUES ('e0000000-0000-0000-0000-000000000001', 'admin@demirgayrimenkul.com', %s, 'Admin', 'admin', true, 'admin') 
        ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, username = EXCLUDED.username
        """
        cur.execute(sql, (PASSWORD_HASH,))
        conn.commit()
        cur.close()
        print("✅ Admin user credentials updated with username 'admin'.")
    except Exception as e:
        print(f"❌ Failed to update admin: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    main()
