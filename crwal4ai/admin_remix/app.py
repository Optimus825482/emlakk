"""
Sahibinden Crawler Admin Panel - Python Remix
==============================================
Crawler verilerini görüntülemek için ayrı admin arayüzü.
Ana admin panelinden bağımsız çalışır, sadece verileri gösterir.

Kullanım:
    python app.py

Özellikler:
    - İlan listesi (filtreleme, arama, pagination)
    - Kategori istatistikleri
    - Yeni ilanlar
    - Kaldırılan ilanlar
    - Crawler job geçmişi
    - Real-time dashboard
"""

from flask import Flask, render_template, jsonify, request, make_response
from db_manager import db
import json
from dotenv import load_dotenv
import os
import subprocess
import sys
from datetime import datetime, timedelta
from typing import Optional, Dict, List
import threading
import uuid

# Load environment
load_dotenv(".env")

app = Flask(__name__)
app.config["SECRET_KEY"] = "dev-secret-key-change-in-production"

# Database setup
# DATABASE_URL is expected in .env or provided by environment
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "postgres://postgres:518518Erkan@wgkosgwkg8o4wg4k8cgcw4og:5432/demir_db"
os.environ["DATABASE_URL"] = DATABASE_URL

# Crawler state
crawler_running = False
current_job_id = None


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================


def format_price(price: int) -> str:
    """Fiyatı formatla: 9300000 -> 9.300.000 TL"""
    if not price:
        return "Belirtilmemiş"
    return f"{price:,.0f} TL".replace(",", ".")


def format_date(date_str: str) -> str:
    """Tarihi formatla"""
    if not date_str:
        return "-"
    try:
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        return dt.strftime("%d.%m.%Y %H:%M")
    except:
        return date_str


def get_category_display(category: str) -> str:
    """Kategori display adı"""
    mapping = {"konut": "Konut", "arsa": "Arsa", "isyeri": "İşyeri", "bina": "Bina"}
    return mapping.get(category, category.title())


def get_transaction_display(transaction: str) -> str:
    """İşlem tipi display adı"""
    mapping = {"satilik": "Satılık", "kiralik": "Kiralık"}
    return mapping.get(transaction, transaction.title())


# ============================================================================
# ROUTES - PAGES
# ============================================================================


@app.route("/")
def index():
    """Ana dashboard - ilçe parametresi ile"""
    district = request.args.get('district', 'all')
    
    # İlçe listesi
    districts = db.get_district_list()
    
    return render_template('index.html', 
                         districts=districts,
                         selected_district=district)


@app.route("/listings")
def listings():
    """İlan listesi sayfası"""
    return render_template("listings.html")


@app.route("/new-listings")
def new_listings():
    """Yeni ilanlar sayfası"""
    return render_template("new_listings.html")


@app.route("/removed-listings")
def removed_listings():
    """Kaldırılan ilanlar sayfası"""
    return render_template("removed_listings.html")


@app.route("/jobs")
def jobs():
    """Crawler job geçmişi"""
    return render_template("jobs.html")


@app.route("/crawler")
def crawler():
    """Crawler yönetim sayfası - ilçe parametresi ile"""
    district = request.args.get('district', 'hendek')
    
    # İlçe listesi
    districts = db.get_district_list()
    
    return render_template("crawler.html",
                         districts=districts,
                         selected_district=district)


@app.route("/map")
def map_page():
    """Hendek Emlak Haritası"""
    return render_template("map.html")


# ============================================================================
# API ENDPOINTS
# ============================================================================


@app.route("/api/crawler/status")
def api_crawler_status():
    """Crawler durumu"""
    global crawler_running, current_job_id

    try:
        status = {"running": crawler_running, "job_id": current_job_id}

        # Eğer job varsa detaylarını al
        if current_job_id:
            try:
                job_data = db.execute_one(
                    "SELECT * FROM mining_jobs WHERE id = %s",
                    (current_job_id,)
                )

                if job_data:
                    status["job"] = {
                        "id": job_data["id"],
                        "status": job_data["status"],
                        "created_at": format_date(job_data["created_at"].isoformat() if hasattr(job_data["created_at"], 'isoformat') else str(job_data["created_at"])),
                        "stats": job_data.get("stats", {}),
                        "progress": job_data.get("progress", {}),
                    }
            except Exception as job_error:
                print(f"Error getting job status: {job_error}")

        return jsonify({"success": True, "data": status})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/crawler/start", methods=["POST"])
def api_crawler_start():
    """Crawler başlat - UC Batch Crawler"""
    global crawler_running, current_job_id

    if crawler_running:
        return jsonify({"success": False, "error": "Crawler zaten çalışıyor"}), 400

    try:
        data = request.json or {}
        categories = data.get("categories", ["konut_satilik"])
        district = data.get("district", "hendek")  # YENİ: İlçe parametresi
        max_pages = data.get("max_pages", 100)
        force = data.get("force", False)
        reverse_sort = data.get("reverse_sort", False)
        sync = data.get("sync", False)
        turbo = data.get("turbo", False)

        # Job ID oluştur
        job_id = str(uuid.uuid4())
        current_job_id = job_id

        # Job kaydı oluştur
        job_sql = """
            INSERT INTO mining_jobs (id, job_type, status, config, stats, progress)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        db.execute_query(
            job_sql, 
            (
                job_id, 
                "manual_crawler", 
                "running", 
                json.dumps({
                    "categories": categories,
                    "district": district,  # YENİ: İlçe config'e eklendi
                    "max_pages": max_pages,
                    "force": force,
                    "reverse_sort": reverse_sort,
                    "sync": sync,
                    "turbo": turbo,
                }),
                json.dumps({}),
                json.dumps({"current": 0, "total": 0, "percentage": 0})
            ),
            fetch=False
        )

        # Crawler'ı background thread'de başlat
        def run_crawler():
            global crawler_running
            crawler_running = True

            try:
                # Python script yolu (Sahibinden Crawler)
                script_path = os.path.join(os.path.dirname(__file__), "sahibinden_crawler.py")

                # Komut hazırla
                cmd = [
                    sys.executable,
                    script_path,
                    "--categories",
                    *categories,
                    "--district",  # YENİ: İlçe parametresi
                    district,
                    "--max-pages",
                    str(max_pages),
                    "--job-id",
                    job_id,
                ]

                if force:
                    print("⚡ Force mode detected")
                    cmd.append("--force")

                if reverse_sort:
                    print("🔄 Reverse sort detected")
                    cmd.append("--reverse-sort")

                if sync:
                    print("🗑️ Sync mode detected")
                    cmd.append("--sync")

                if turbo:
                    print("⚡ Turbo mode detected")
                    cmd.append("--turbo")

                # Crawler'ı çalıştır
                print(f"🚀 Executing crawler: {' '.join(cmd)}")
                script_dir = os.path.dirname(script_path)
                log_file = os.path.join(script_dir, "crawler_debug.log")
                error_log_file = os.path.join(script_dir, "crawler_error.log")
                
                # Windows'ta detached process (penceresiz)
                creationflags = 0
                if sys.platform == "win32":
                    creationflags = 0x00000008  # DETACHED_PROCESS

                # STDOUT ve STDERR'i ayrı dosyalara yaz
                with open(log_file, "w", encoding="utf-8") as stdout_f, \
                     open(error_log_file, "w", encoding="utf-8") as stderr_f:
                    
                    print(f"📝 Logs: {log_file}")
                    print(f"📝 Errors: {error_log_file}")
                    
                    result = subprocess.run(
                        cmd,
                        stdout=stdout_f,
                        stderr=stderr_f,
                        text=True,
                        timeout=3600,  # 1 saat timeout
                        cwd=script_dir,
                        creationflags=creationflags,
                    )

                # Debug logu oku
                try:
                    with open(log_file, "r", encoding="utf-8") as f:
                        debug_log = f.read()
                except Exception as e:
                    debug_log = f"Log file read error: {str(e)}"

                # Error logu oku
                try:
                    with open(error_log_file, "r", encoding="utf-8") as f:
                        error_log = f.read()
                except Exception as e:
                    error_log = f"Error log read error: {str(e)}"

                # Logları birleştir
                full_log = f"=== STDOUT ===\n{debug_log}\n\n=== STDERR ===\n{error_log}"
                
                print(f"✅ Crawler finished with return code: {result.returncode}")
                print(f"📊 Log preview: {full_log[:500]}")

                # Job'u güncelle
                if result.returncode == 0:
                    db.execute_query(
                        "UPDATE mining_jobs SET status = 'completed', error = %s WHERE id = %s",
                        (full_log[-5000:] if full_log else "No output", job_id),
                        fetch=False
                    )
                else:
                    db.execute_query(
                        "UPDATE mining_jobs SET status = 'failed', error = %s WHERE id = %s",
                        (full_log[-5000:], job_id),
                        fetch=False
                    )

            except subprocess.TimeoutExpired as e:
                error_msg = f"Timeout (1 saat): {str(e)}"
                print(f"❌ {error_msg}")
                db.execute_query(
                    "UPDATE mining_jobs SET status = 'failed', error = %s WHERE id = %s",
                    (error_msg, job_id),
                    fetch=False
                )

            except Exception as e:
                error_msg = f"Crawler exception: {str(e)}"
                print(f"❌ {error_msg}")
                import traceback
                traceback.print_exc()
                db.execute_query(
                    "UPDATE mining_jobs SET status = 'failed', error = %s WHERE id = %s",
                    (error_msg[:500], job_id),
                    fetch=False
                )

            finally:
                crawler_running = False
                print(f"🏁 Crawler thread finished for job {job_id}")

        # Thread başlat
        thread = threading.Thread(target=run_crawler, daemon=True)
        thread.start()

        return jsonify(
            {"success": True, "message": "Crawler başlatıldı", "job_id": job_id}
        )

    except Exception as e:
        crawler_running = False
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/crawler/stop", methods=["POST"])
def api_crawler_stop():
    """Crawler durdur (şu an desteklenmiyor)"""
    return jsonify(
        {"success": False, "error": "Crawler durdurulamaz. Tamamlanmasını bekleyin."}
    ), 400


@app.route("/api/crawler/start-parallel", methods=["POST"])
def api_crawler_start_parallel():
    """Paralel Crawler başlat (2 Chrome worker)"""
    global crawler_running, current_job_id

    if crawler_running:
        return jsonify({"success": False, "error": "Crawler zaten çalışıyor"}), 400

    try:
        data = request.json or {}
        categories = data.get("categories", ["konut_satilik"])
        district = data.get("district", "hendek")  # YENİ: İlçe parametresi
        max_pages = data.get("max_pages", 100)
        turbo = data.get("turbo", False)
        sync = data.get("sync", False)

        # Job ID oluştur
        job_id = str(uuid.uuid4())
        current_job_id = job_id

        # Job kaydı oluştur
        job_sql = """
            INSERT INTO mining_jobs (id, job_type, status, config, stats, progress)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        db.execute_query(
            job_sql,
            (
                job_id,
                "parallel_crawler",
                "running",
                json.dumps({
                    "categories": categories,
                    "district": district,  # YENİ: İlçe config'e eklendi
                    "max_pages": max_pages,
                    "workers": 2,
                    "turbo": turbo,
                    "sync": sync,
                }),
                json.dumps({}),
                json.dumps({"current": 0, "total": len(categories), "percentage": 0})
            ),
            fetch=False
        )

        # Paralel Crawler'ı background thread'de başlat
        def run_parallel_crawler():
            global crawler_running
            crawler_running = True

            try:
                # Paralel crawler script yolu
                script_path = os.path.join(os.path.dirname(__file__), "parallel_crawler.py")

                # Komut hazırla
                cmd = [
                    sys.executable,
                    script_path,
                    "--categories",
                    *categories,
                    "--district",  # YENİ: İlçe parametresi
                    district,
                    "--max-pages",
                    str(max_pages),
                    "--job-id",
                    job_id,
                ]

                if turbo:
                    cmd.append("--turbo")

                if sync:
                    cmd.append("--sync")

                # Crawler'ı çalıştır
                print(f"Executing Parallel Crawler: {' '.join(cmd)}")
                script_dir = os.path.dirname(script_path)
                log_file = os.path.join(script_dir, "parallel_crawler_debug.log")
                
                # Windows'ta detached process (penceresiz)
                creationflags = 0
                if sys.platform == "win32":
                    creationflags = 0x00000008  # DETACHED_PROCESS
                
                with open(log_file, "w", encoding="utf-8") as f:
                    result = subprocess.run(
                        cmd,
                        stdout=f,
                        stderr=subprocess.STDOUT,
                        text=True,
                        timeout=3600,  # 1 saat timeout
                        cwd=script_dir,
                        creationflags=creationflags,
                    )

                # DEBUG: Capture output
                try:
                    with open(log_file, "r", encoding="utf-8") as f:
                        debug_log = f.read()
                except:
                    debug_log = "Log read error"

                # Job'u güncelle
                if result.returncode == 0:
                    db.execute_query(
                        "UPDATE mining_jobs SET status = 'completed', error = %s WHERE id = %s",
                        (debug_log[-5000:] if debug_log else "No output", job_id),
                        fetch=False
                    )
                else:
                    db.execute_query(
                        "UPDATE mining_jobs SET status = 'failed', error = %s WHERE id = %s",
                        (debug_log[-5000:], job_id),
                        fetch=False
                    )

            except subprocess.TimeoutExpired:
                db.execute_query(
                    "UPDATE mining_jobs SET status = %s, error = %s WHERE id = %s",
                    ("failed", "Timeout (1 saat)", job_id),
                    fetch=False
                )

            except Exception as e:
                db.execute_query(
                    "UPDATE mining_jobs SET status = %s, error = %s WHERE id = %s",
                    ("failed", str(e)[:500], job_id),
                    fetch=False
                )

            finally:
                crawler_running = False

        # Thread başlat
        thread = threading.Thread(target=run_parallel_crawler, daemon=True)
        thread.start()

        return jsonify(
            {
                "success": True,
                "message": "Paralel Crawler başlatıldı (2 Worker)",
                "job_id": job_id,
            }
        )

    except Exception as e:
        crawler_running = False
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/category-counts")
def api_category_counts():
    """Kategori bazında ilan sayıları (veritabanından)"""
    try:
        counts = {}

        # Tüm kategori kombinasyonları
        categories = [
            ("konut", "satilik", "konut_satilik"),
            ("konut", "kiralik", "konut_kiralik"),
            ("arsa", "satilik", "arsa_satilik"),
            ("isyeri", "satilik", "isyeri_satilik"),
            ("isyeri", "kiralik", "isyeri_kiralik"),
            ("bina", "satilik", "bina_satilik"),
            ("bina", "kiralik", "bina_kiralik"),
        ]

        for category, transaction, key in categories:
            res = db.execute_one(
                "SELECT COUNT(*) as count FROM sahibinden_liste WHERE category = %s AND transaction = %s",
                (category, transaction)
            )
            counts[key] = res["count"] if res else 0

        return jsonify({"success": True, "data": counts})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/dashboard")
def api_dashboard():
    """Dashboard özet verileri - İlçe Filtreleme Destekli"""
    try:
        # Parametreler
        days = int(request.args.get("days", 1))
        district = request.args.get("district", "all")  # YENİ: İlçe parametresi
        
        # ISO formatında tarih sınırı
        days_ago = (datetime.now() - timedelta(days=days)).isoformat()

        # İlçe filtresi için SQL condition
        district_condition = ""
        district_params = []
        
        if district and district != 'all':
            district_condition = " AND LOWER(konum) LIKE %s"
            district_params = [f'%{district.lower()}%']

        # 1. Toplam İlan Sayısı
        total_sql = f"SELECT COUNT(*) as count FROM sahibinden_liste WHERE 1=1{district_condition}"
        total_res = db.execute_one(total_sql, district_params if district_params else None)
        total_count = total_res["count"] if total_res else 0

        # 2. Yeni İlanlar
        new_sql = f"SELECT COUNT(*) as count FROM new_listings WHERE created_at >= %s{district_condition}"
        new_params = [days_ago] + district_params
        new_res = db.execute_one(new_sql, new_params if district_params else [days_ago])
        new_listings_count = new_res["count"] if new_res else 0

        # 3. Kaldırılan İlanlar
        rem_sql = f"SELECT COUNT(*) as count FROM removed_listings WHERE removed_at >= %s{district_condition}"
        rem_params = [days_ago] + district_params
        rem_res = db.execute_one(rem_sql, rem_params if district_params else [days_ago])
        removed_listings_count = rem_res["count"] if rem_res else 0

        # 4. Kategori Dağılımı (db_manager fonksiyonunu kullan)
        category_data = db.get_category_stats(district=district)

        # 5. Son İşlem (Mining Jobs)
        last_job_data = db.execute_one(
            "SELECT * FROM mining_jobs ORDER BY created_at DESC LIMIT 1"
        )

        last_job = None
        if last_job_data:
            job = last_job_data
            last_job = {
                "id": job.get("id"),
                "status": job.get("status"),
                "created_at": format_date(job.get("created_at").isoformat() if hasattr(job.get("created_at"), 'isoformat') else str(job.get("created_at"))),
                "stats": job.get("stats") or {},
                "config": job.get("config") or {},
            }

        return jsonify(
            {
                "success": True,
                "data": {
                    "total_listings": total_count,
                    "new_listings": new_listings_count,
                    "removed_listings": removed_listings_count,
                    "categories": category_data,
                    "last_job": last_job,
                    "days": days,
                    "district": district,  # YENİ: Seçili ilçe bilgisi
                },
            }
        )

    except Exception as e:
        app.logger.error(f"Dashboard API Error: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/listings")
def api_listings():
    """İlan listesi (pagination, filtreleme)"""
    try:
        # Query params
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 20))
        category = request.args.get("category")
        transaction = request.args.get("transaction")
        search = request.args.get("search")

        # Build SQL query with filters and pagination
        sql = "SELECT *, COUNT(*) OVER() as full_count FROM sahibinden_liste WHERE 1=1"
        params = []

        if category:
            sql += " AND category = %s"
            params.append(category)
        if transaction:
            sql += " AND transaction = %s"
            params.append(transaction)
        if search:
            sql += " AND baslik ILIKE %s"
            params.append(f"%{search}%")

        sql += " ORDER BY crawled_at DESC LIMIT %s OFFSET %s"
        params.extend([per_page, (page - 1) * per_page])

        # Execute
        results = db.execute_query(sql, params)
        total_count = results[0]["full_count"] if results else 0

        # Format
        listings = []
        for item in (results or []):
            listings.append(
                {
                    "id": item["id"],
                    "baslik": item["baslik"],
                    "fiyat": format_price(item["fiyat"]),
                    "fiyat_raw": item["fiyat"],
                    "konum": item["konum"],
                    "category": get_category_display(item["category"]),
                    "transaction": get_transaction_display(item["transaction"]),
                    "tarih": item["tarih"],
                    "crawled_at": format_date(item["crawled_at"].isoformat() if hasattr(item["crawled_at"], 'isoformat') else str(item["crawled_at"])),
                    "link": item["link"],
                    "resim": item["resim"],
                }
            )

        return jsonify(
            {
                "success": True,
                "data": listings,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total_count,
                    "total_pages": (total_count + per_page - 1) // per_page,
                },
            }
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/new-listings")
def api_new_listings():
    """Yeni ilanlar listesi"""
    try:
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 20))
        days = int(request.args.get("days", 7))

        # Son X gün
        date_threshold = (datetime.now() - timedelta(days=days)).isoformat()

        # Query
        sql = "SELECT *, COUNT(*) OVER() as full_count FROM new_listings WHERE first_seen_at >= %s ORDER BY first_seen_at DESC LIMIT %s OFFSET %s"
        params = [date_threshold, per_page, (page - 1) * per_page]

        results = db.execute_query(sql, params)
        total_count = results[0]["full_count"] if results else 0

        # Format
        listings = []
        for item in (results or []):
            listings.append(
                {
                    "listing_id": item["listing_id"],
                    "baslik": item["baslik"],
                    "fiyat": format_price(item["fiyat"]),
                    "konum": item["konum"],
                    "category": get_category_display(item["category"]),
                    "transaction": get_transaction_display(item["transaction"]),
                    "first_seen_at": format_date(item["first_seen_at"].isoformat() if hasattr(item["first_seen_at"], 'isoformat') else str(item["first_seen_at"])),
                    "link": item["link"],
                    "resim": item["resim"],
                }
            )

        return jsonify(
            {
                "success": True,
                "data": listings,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total_count,
                    "total_pages": (total_count + per_page - 1) // per_page,
                },
            }
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/removed-listings")
def api_removed_listings():
    """Kaldırılan ilanlar listesi"""
    try:
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 20))
        days = int(request.args.get("days", 30))

        # Son X gün
        date_threshold = (datetime.now() - timedelta(days=days)).isoformat()

        # Query
        sql = "SELECT *, COUNT(*) OVER() as full_count FROM removed_listings WHERE removed_at >= %s ORDER BY removed_at DESC LIMIT %s OFFSET %s"
        params = [date_threshold, per_page, (page - 1) * per_page]

        results = db.execute_query(sql, params)
        total_count = results[0]["full_count"] if results else 0

        # Format
        listings = []
        for item in (results or []):
            listings.append(
                {
                    "listing_id": item["listing_id"],
                    "baslik": item["baslik"],
                    "fiyat": format_price(item["last_price"]),
                    "konum": item["konum"],
                    "category": get_category_display(item["category"]),
                    "transaction": get_transaction_display(item["transaction"]),
                    "removed_at": format_date(item["removed_at"].isoformat() if hasattr(item["removed_at"], 'isoformat') else str(item["removed_at"])),
                    "days_active": item.get("days_active"),
                    "price_changes": item.get("price_changes", 0),
                    "link": item["link"],
                    "resim": item["resim"],
                }
            )

        return jsonify(
            {
                "success": True,
                "data": listings,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total_count,
                    "total_pages": (total_count + per_page - 1) // per_page,
                },
            }
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/crawler/logs")
def api_crawler_logs():
    """Crawler loglarını getir"""
    try:
        log_type = request.args.get("type", "debug")  # debug veya error
        lines = int(request.args.get("lines", 100))
        
        script_dir = os.path.dirname(__file__)
        
        if log_type == "error":
            log_file = os.path.join(script_dir, "crawler_error.log")
        else:
            log_file = os.path.join(script_dir, "crawler_debug.log")
        
        if not os.path.exists(log_file):
            return jsonify({
                "success": True,
                "data": {
                    "logs": "Log dosyası henüz oluşturulmadı.",
                    "file": log_file
                }
            })
        
        # Son N satırı oku
        with open(log_file, "r", encoding="utf-8") as f:
            all_lines = f.readlines()
            last_lines = all_lines[-lines:] if len(all_lines) > lines else all_lines
            logs = "".join(last_lines)
        
        return jsonify({
            "success": True,
            "data": {
                "logs": logs,
                "file": log_file,
                "total_lines": len(all_lines)
            }
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/maintenance/run", methods=["POST"])
def run_maintenance():
    """Veritabanı bakım ve temizlik işlemini tetikler"""
    try:
        # Postgres için basit bakım görevleri
        # 1. Mükerrer ilanları temizle (link bazlı)
        db.execute_query("""
            DELETE FROM sahibinden_liste 
            WHERE id NOT IN (
                SELECT MIN(id) 
                FROM sahibinden_liste 
                GROUP BY link
            )
        """, fetch=False)
        
        # 2. Geçersiz (fiyatı 0 olan) ilanları temizle
        db.execute_query("DELETE FROM sahibinden_liste WHERE fiyat <= 0", fetch=False)
        
        return jsonify({
            "success": True,
            "message": "Bakım işlemi başarıyla tamamlandı (Postgres)",
            "duplicates_removed": "Unknown",
            "nulls_removed": "Unknown"
        })
    except Exception as e:
        print(f"Maintenance Error: {e}")
        return jsonify(
            {
                "success": False,
                "message": f"Bakım işlemi başarısız: {str(e)}",
                "duplicates_removed": 0,
                "nulls_removed": 0,
            }
        ), 500


@app.route("/stats")
def stats():
    """İstatistikler sayfası"""
    return render_template("stats.html")


@app.route("/api/category-stats")
def api_category_stats():
    """Kategori istatistikleri - Gerçek Zamanlı Veritabanı Sayımlı"""
    try:
        # Kategori istatistiklerini çek
        result = db.execute_query(
            "SELECT * FROM category_stats ORDER BY last_checked_at DESC"
        )

        stats = []
        for item in (result or []):
            cat = item["category"]
            trans = item["transaction"]

            # Veritabanındaki GERÇEK sayıyı anlık olarak say (Tutarsızlığı önle)
            real_db_res = db.execute_one(
                "SELECT COUNT(*) as count FROM sahibinden_liste WHERE category = %s AND transaction = %s",
                (cat, trans)
            )

            real_db_count = real_db_res["count"] if real_db_res else 0

            # Farkı yeniden hesapla
            diff = item["sahibinden_count"] - real_db_count

            # Durumu yeniden belirle
            status = "synced"
            if diff > 0:
                status = "new"
            elif diff < 0:
                status = "removed"

            stats.append(
                {
                    "category": get_category_display(cat),
                    "transaction": get_transaction_display(trans),
                    "sahibinden_count": item["sahibinden_count"],
                    "database_count": real_db_count,
                    "diff": diff,
                    "status": status,
                    "last_checked_at": format_date(item["last_checked_at"].isoformat() if hasattr(item["last_checked_at"], 'isoformat') else str(item["last_checked_at"])),
                }
            )

        return jsonify({"success": True, "data": stats})

    except Exception as e:
        app.logger.error(f"Category Stats API Error: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/jobs")
def api_jobs():
    """Crawler job geçmişi"""
    try:
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 10))

        start = (page - 1) * per_page
        end = start + per_page - 1

        # Toplam sayıyı al
        count_res = db.execute_one("SELECT COUNT(*) as count FROM mining_jobs")
        total_count = count_res["count"] if count_res else 0

        # Sayfalı listeyi al
        result = db.execute_query(
            "SELECT * FROM mining_jobs ORDER BY created_at DESC LIMIT %s OFFSET %s",
            (per_page, start)
        )

        jobs = []
        for item in (result or []):
            stats = item.get("stats") or {}
            jobs.append(
                {
                    "id": item["id"],
                    "status": item["status"],
                    "created_at": format_date(item["created_at"].isoformat() if hasattr(item["created_at"], 'isoformat') else str(item["created_at"])),
                    "updated_at": format_date(item.get("updated_at").isoformat() if item.get("updated_at") and hasattr(item.get("updated_at"), 'isoformat') else str(item.get("updated_at"))),
                    "total_listings": stats.get("total_listings", 0) if stats else 0,
                    "new_listings": stats.get("new_listings", 0) if stats else 0,
                    "updated_listings": stats.get("updated_listings", 0)
                    if stats
                    else 0,
                    "removed_listings": stats.get("removed_listings", 0)
                    if stats
                    else 0,
                    "categories_completed": stats.get("categories_completed", [])
                    if stats
                    else [],
                }
            )

        return jsonify(
            {
                "success": True,
                "data": jobs,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total_count,
                    "total_pages": (total_count + per_page - 1) // per_page,
                },
            }
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/map/neighborhoods")
def api_map_neighborhoods():
    """Mahalle bazlı ilan istatistikleri"""
    try:
        # Tüm ilanları çek ve mahalle bazlı grupla
        # Tüm ilanları çek ve mahalle bazlı grupla
        result = db.execute_query(
            "SELECT konum, category, transaction, fiyat FROM sahibinden_liste"
        )

        # Mahalle bazlı gruplama
        neighborhoods = {}
        
        for item in (result or []):
            konum = item.get("konum", "")
            if not konum:
                continue
                
            # Mahalle adını parse et (örn: "MerkezYeni Mah." -> "Yeni")
            mahalle = konum.replace("Merkez", "").replace("Köyler", "").replace(" Mah.", "").replace(" Mh.", "").strip()
            
            if not mahalle:
                continue
                
            if mahalle not in neighborhoods:
                neighborhoods[mahalle] = {
                    "name": mahalle,
                    "total": 0,
                    "satilik": 0,
                    "kiralik": 0,
                    "konut": 0,
                    "arsa": 0,
                    "isyeri": 0,
                    "bina": 0,
                    "avg_price": 0,
                    "min_price": float('inf'),
                    "max_price": 0,
                    "prices": []
                }
            
            neighborhoods[mahalle]["total"] += 1
            
            # Transaction type
            if item.get("transaction") == "satilik":
                neighborhoods[mahalle]["satilik"] += 1
            elif item.get("transaction") == "kiralik":
                neighborhoods[mahalle]["kiralik"] += 1
            
            # Category
            category = item.get("category", "")
            if category in neighborhoods[mahalle]:
                neighborhoods[mahalle][category] += 1
            
            # Price
            fiyat = item.get("fiyat", 0)
            if fiyat and fiyat > 0:
                neighborhoods[mahalle]["prices"].append(fiyat)
                neighborhoods[mahalle]["min_price"] = min(neighborhoods[mahalle]["min_price"], fiyat)
                neighborhoods[mahalle]["max_price"] = max(neighborhoods[mahalle]["max_price"], fiyat)
        
        # Ortalama fiyat hesapla
        for mahalle in neighborhoods.values():
            if mahalle["prices"]:
                mahalle["avg_price"] = int(sum(mahalle["prices"]) / len(mahalle["prices"]))
            else:
                mahalle["avg_price"] = 0
            
            if mahalle["min_price"] == float('inf'):
                mahalle["min_price"] = 0
            
            # prices listesini kaldır (gereksiz)
            del mahalle["prices"]
        
        # Liste olarak döndür
        neighborhood_list = sorted(neighborhoods.values(), key=lambda x: x["total"], reverse=True)
        
        return jsonify({
            "success": True,
            "data": neighborhood_list,
            "total_neighborhoods": len(neighborhood_list)
        })
        
    except Exception as e:
        app.logger.error(f"Map Neighborhoods API Error: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/map/listings")
def api_map_listings():
    """Harita için ilan listesi (mahalle filtrelemeli)"""
    try:
        neighborhood = request.args.get("neighborhood")
        category = request.args.get("category")
        transaction = request.args.get("transaction")
        
        # Base query
        # Base query
        sql = "SELECT * FROM sahibinden_liste WHERE 1=1"
        params = []
        
        # Filters
        if neighborhood:
            sql += " AND konum ILIKE %s"
            params.append(f"%{neighborhood}%")
        
        if category:
            sql += " AND category = %s"
            params.append(category)
        
        if transaction:
            sql += " AND transaction = %s"
            params.append(transaction)
        
        sql += " ORDER BY crawled_at DESC LIMIT 100"
        
        # Execute
        result = db.execute_query(sql, params)
        
        # Format
        listings = []
        for item in (result or []):
            konum = item.get("konum", "")
            mahalle = konum.replace("Merkez", "").replace("Köyler", "").replace(" Mah.", "").replace(" Mh.", "").strip()
            
            listings.append({
                "id": item["id"],
                "baslik": item["baslik"],
                "fiyat": item["fiyat"],
                "fiyat_formatted": format_price(item["fiyat"]),
                "konum": konum,
                "mahalle": mahalle,
                "category": item["category"],
                "category_display": get_category_display(item["category"]),
                "transaction": item["transaction"],
                "transaction_display": get_transaction_display(item["transaction"]),
                "link": item["link"],
                "resim": item["resim"],
                "crawled_at": format_date(item["crawled_at"].isoformat() if hasattr(item["crawled_at"], 'isoformat') else str(item["crawled_at"]))
            })
        
        return jsonify({
            "success": True,
            "data": listings,
            "total": len(listings)
        })
        
    except Exception as e:
        app.logger.error(f"Map Listings API Error: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


# ============================================================================
# RUN
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Sahibinden Crawler Admin Panel")
    print("=" * 60)
    print(f"📍 URL: http://localhost:5001")
    print(f"📊 Dashboard: http://localhost:5001/")
    print(f"📋 İlanlar: http://localhost:5001/listings")
    print(f"🆕 Yeni İlanlar: http://localhost:5001/new-listings")
    print(f"📤 Kaldırılan: http://localhost:5001/removed-listings")
    print(f"📈 İstatistikler: http://localhost:5001/stats")
    print(f"🔧 Jobs: http://localhost:5001/jobs")
    print("=" * 60)

    app.run(host="0.0.0.0", port=5001, debug=True)
