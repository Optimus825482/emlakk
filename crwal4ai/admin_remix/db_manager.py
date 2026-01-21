import os
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
import json
from datetime import datetime

class DatabaseManager:
    _instance = None
    _pool = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseManager, cls).__new__(cls)
            cls._instance._init_pool()
        return cls._instance

    def _init_pool(self):
        load_dotenv()
        # Admin Panel URL'sini kullanıyoruz (Internal URL daha hızlıdır eğer aynı networkteyse)
        # Ancak şimdilik public olanı kullanalım garantici olmak için
        self.db_url = os.getenv("DATABASE_URL")
        if not self.db_url:
            # Fallback
            self.db_url = "postgres://postgres:518518Erkan@wgkosgwkg8o4wg4k8cgcw4og:5432/demir_db"
        
        try:
            self._pool = psycopg2.pool.SimpleConnectionPool(
                1, 20, self.db_url
            )
        except Exception as e:
            print(f"❌ Database connection pool error: {e}")

    def get_conn(self):
        return self._pool.getconn()

    def put_conn(self, conn):
        self._pool.putconn(conn)

    def execute_query(self, query, params=None, fetch=True):
        conn = self.get_conn()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, params)
                if fetch:
                    result = cur.fetchall()
                    return result
                conn.commit()
                return True
        except Exception as e:
            print(f"❌ Query error: {e}\nQuery: {query}")
            conn.rollback()
            return None
        finally:
            self.put_conn(conn)

    def execute_one(self, query, params=None):
        res = self.execute_query(query, params)
        return res[0] if res else None

    def execute_batch(self, query, params_list):
        """
        Batch insert/update/delete için optimize edilmiş metod.
        
        Args:
            query: SQL query (tek satır için)
            params_list: List of tuples, her tuple bir satır için parametreler
        
        Returns:
            True if successful, None if error
        """
        if not params_list:
            return True
            
        conn = self.get_conn()
        try:
            with conn.cursor() as cur:
                # psycopg2.extras.execute_batch kullan (daha hızlı)
                from psycopg2.extras import execute_batch
                execute_batch(cur, query, params_list, page_size=100)
                conn.commit()
                return True
        except Exception as e:
            print(f"❌ Batch query error: {e}\nQuery: {query}")
            conn.rollback()
            return None
        finally:
            self.put_conn(conn)

# Singleton instance
db = DatabaseManager()
