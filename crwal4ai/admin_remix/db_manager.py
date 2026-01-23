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
            self.db_url = (
                "postgres://postgres:518518Erkan@wgkosgwkg8o4wg4k8cgcw4og:5432/demir_db"
            )

        try:
            self._pool = psycopg2.pool.SimpleConnectionPool(1, 20, self.db_url)
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

    def get_district_list(self):
        """
        Veritabanındaki tüm ilçeleri listele

        Returns:
            List of dicts: [{'value': 'hendek', 'label': 'Hendek', 'count': 123}, ...]
        """
        query = """
            SELECT 
                LOWER(TRIM(SPLIT_PART(konum, ',', 2))) as district,
                COUNT(*) as count
            FROM sahibinden_liste
            WHERE konum IS NOT NULL AND konum != ''
            GROUP BY LOWER(TRIM(SPLIT_PART(konum, ',', 2)))
            HAVING LOWER(TRIM(SPLIT_PART(konum, ',', 2))) != ''
            ORDER BY count DESC
        """

        try:
            results = self.execute_query(query)
            districts = []

            for row in results or []:
                district_value = row["district"]
                if district_value:
                    # İlk harfi büyük yap
                    district_label = district_value.capitalize()
                    districts.append(
                        {
                            "value": district_value,
                            "label": district_label,
                            "count": row["count"],
                        }
                    )

            return districts
        except Exception as e:
            print(f"❌ get_district_list error: {e}")
            return []

    def get_category_stats(self, district=None):
        """
        Kategori istatistikleri - ilçe bazlı filtreleme ile

        Args:
            district: İlçe adı (opsiyonel). None veya 'all' ise tüm ilçeler

        Returns:
            Dict: {'konut': {'satilik': 10, 'kiralik': 5, ...}, ...}
        """
        try:
            # Base query
            if district and district != "all":
                query = """
                    SELECT 
                        category, 
                        transaction, 
                        COUNT(*) as count,
                        MAX(crawled_at) as last_updated
                    FROM sahibinden_liste
                    WHERE LOWER(konum) LIKE %s
                    GROUP BY category, transaction
                """

                params = (f"%{district.lower()}%",)
            else:
                query = """
                    SELECT 
                        category, 
                        transaction, 
                        COUNT(*) as count,
                        MAX(crawled_at) as last_updated
                    FROM sahibinden_liste
                    GROUP BY category, transaction
                """

                params = None

            results = self.execute_query(query, params)

            # Sonuçları organize et
            stats = {}
            for row in results or []:
                category = row["category"]
                transaction = row["transaction"]
                count = row["count"]
                last_updated = row["last_updated"]

                if category not in stats:
                    stats[category] = {
                        "satilik": 0,
                        "kiralik": 0,
                        "new_satilik": 0,
                        "new_kiralik": 0,
                        "last_updated_satilik": None,
                        "last_updated_kiralik": None,
                    }

                stats[category][transaction] = count

                if last_updated:
                    if isinstance(last_updated, datetime):
                        stats[category][f"last_updated_{transaction}"] = (
                            last_updated.strftime("%d.%m.%Y %H:%M")
                        )
                    else:
                        stats[category][f"last_updated_{transaction}"] = str(
                            last_updated
                        )

            # Yeni ilanları da ekle (son 7 gün)
            if district and district != "all":
                new_query = """
                    SELECT 
                        category, 
                        transaction, 
                        COUNT(*) as count
                    FROM new_listings
                    WHERE LOWER(konum) LIKE %s
                        AND created_at >= NOW() - INTERVAL '7 days'
                    GROUP BY category, transaction
                """
                new_params = (f"%{district.lower()}%",)
            else:
                new_query = """
                    SELECT 
                        category, 
                        transaction, 
                        COUNT(*) as count
                    FROM new_listings
                    WHERE created_at >= NOW() - INTERVAL '7 days'
                    GROUP BY category, transaction
                """
                new_params = None

            new_results = self.execute_query(new_query, new_params)

            for row in new_results or []:
                category = row["category"]
                transaction = row["transaction"]
                count = row["count"]

                if category in stats:
                    stats[category][f"new_{transaction}"] = count

            return stats

        except Exception as e:
            print(f"❌ get_category_stats error: {e}")
            return {}

    def get_price_trends(self, days=30, district=None):
        """
        Günlük ortalama fiyat trendleri
        """
        try:
            params = [days]
            district_filter = ""
            if district and district != "all":
                district_filter = " AND LOWER(konum) LIKE %s"
                params.append(f"%{district.lower()}%")

            query = f"""
                SELECT 
                    DATE(crawled_at) as date,
                    ROUND(AVG(fiyat)) as avg_price,
                    COUNT(*) as count
                FROM sahibinden_liste
                WHERE crawled_at >= NOW() - (INTERVAL '1 day' * %s)
                  AND fiyat > 0
                  {district_filter}
                GROUP BY DATE(crawled_at)
                ORDER BY date ASC
            """

            results = self.execute_query(query, params)
            return results or []
        except Exception as e:
            print(f"❌ get_price_trends error: {e}")
            return []

    def get_neighborhood_stats(self, district=None):
        """
        Mahalle bazlı istatistikler
        """
        try:
            params = []
            district_filter = ""
            if district and district != "all":
                district_filter = " WHERE LOWER(konum) LIKE %s"
                params.append(f"%{district.lower()}%")

            query = f"""
                SELECT 
                    TRIM(SPLIT_PART(konum, ',', 3)) as neighborhood,
                    COUNT(*) as count,
                    ROUND(AVG(fiyat)) as avg_price,
                    MIN(fiyat) as min_price,
                    MAX(fiyat) as max_price
                FROM sahibinden_liste
                {district_filter}
                GROUP BY neighborhood
                HAVING TRIM(SPLIT_PART(konum, ',', 3)) != ''
                ORDER BY count DESC
            """

            results = self.execute_query(query, params)
            return results or []
        except Exception as e:
            print(f"❌ get_neighborhood_stats error: {e}")
            return []

    def get_valuation_comparables(
        self, category, transaction, ilce, mahalle, min_price=None, max_price=None
    ):
        try:
            active_sql = """
                SELECT id, fiyat, baslik, link, mahalle, crawled_at, 'active' as status
                FROM sahibinden_liste 
                WHERE category = %s AND transaction = %s 
                AND (LOWER(ilce) = LOWER(%s) OR LOWER(konum) LIKE LOWER(%s))
                AND (LOWER(mahalle) = LOWER(%s) OR LOWER(konum) LIKE LOWER(%s))
            """
            params = [category, transaction, ilce, f"%{ilce}%", mahalle, f"%{mahalle}%"]
            active_results = self.execute_query(active_sql, params) or []

            if len(active_results) < 5:
                removed_sql = """
                    SELECT listing_id as id, last_price as fiyat, baslik, link, mahalle, removed_at as crawled_at, 'archived' as status
                    FROM removed_listings 
                    WHERE category = %s AND transaction = %s 
                    AND (LOWER(ilce) = LOWER(%s) OR LOWER(konum) LIKE LOWER(%s))
                    AND (LOWER(mahalle) = LOWER(%s) OR LOWER(konum) LIKE LOWER(%s))
                    AND removed_at >= NOW() - INTERVAL '180 days'
                    ORDER BY removed_at DESC LIMIT 10
                """
                archived_results = self.execute_query(removed_sql, params) or []
                active_results.extend(archived_results)

            return active_results
        except Exception as e:
            print(f"❌ valuation error: {e}")
            return []


# Singleton instance

db = DatabaseManager()
