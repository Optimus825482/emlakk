# 🔧 BACKEND FIX - MANUAL APPLICATION (1 Change)

**File:** `admin_remix/app.py`

## Change Needed: Add Force Parameter Support

**Location:** Line ~169-225 (in `api_crawler_start` function)

### 1. Add force parameter extraction (Line ~172-174)

```python
# AFTER this line:
    data = request.json or {}
    categories = data.get('categories', ['konut_satilik'])
    max_pages = data.get('max_pages', 100)

# ADD this line:
    force = data.get('force', False)  # NEW
```

### 2. Update job config (Line ~187-190)

```python
# CHANGE this:
            "config": {
                "categories": categories,
                "max_pages": max_pages
            },

# TO this:
            "config": {
                "categories": categories,
                "max_pages": max_pages,
                "force": force  # NEW
            },
```

### 3. Update script path (Line ~215)

```python
# CHANGE this:
                script_path = os.path.join(os.path.dirname(__file__), '..', 'sahibinden_uc_batch_supabase.py')

# TO this:
                script_path = os.path.join(os.path.dirname(__file__), '..', 'sahibinden_smart_crawler.py')
```

### 4. Add force flag to command (After Line ~224)

```python
# AFTER this:
                cmd = [
                    sys.executable,
                    script_path,
                    '--categories', *categories,
                    '--max-pages', str(max_pages),
                    '--job-id', job_id
                ]

# ADD this:
                if force:
                    cmd.append('--force')
```

---

## ALTERNATIVE: Full Function Replacement

If easier, replace entire `api_crawler_start()` function (lines 170-260) with this:

```python
@app.route('/api/crawler/start', methods=['POST'])
def api_crawler_start():
    """Crawler başlat"""
    global crawler_running, current_job_id

    try:
        data = request.json or {}
        categories = data.get('categories', ['konut_satilik'])
        max_pages = data.get('max_pages', 100)
        force = data.get('force', False)  # NEW

        if crawler_running:
            return jsonify({
                "success": False,
                "error": "Crawler zaten çalışıyor"
            }), 400

        # Yeni job oluştur
        job_id = str(uuid.uuid4())
        job_data = {
            "id": job_id,
            "status": "running",
            "config": {
                "categories": categories,
                "max_pages": max_pages,
                "force": force  # NEW
            },
            "stats": {
                "new_listings": 0,
                "updated_listings": 0,
                "total_listings": 0,
        "categories_completed": []
            },
            "progress": {
                "current": 0,
                "total": 0,
                "percentage": 0
            }
        }
        supabase.table("mining_jobs").insert(job_data).execute()

        # Crawler'ı background thread'de başlat
        def run_crawler():
            global crawler_running
            crawler_running = True

            try:
                # Python script yolu - NEW: Use smart crawler
                script_path = os.path.join(os.path.dirname(__file__), '..', 'sahibinden_smart_crawler.py')

                # Komut hazırla
                cmd = [
                    sys.executable,
                    script_path,
                    '--categories', *categories,
                    '--max-pages', str(max_pages),
                    '--job-id', job_id
                ]

                # NEW: Add force flag if enabled
                if force:
                    cmd.append('--force')

                # Crawler'ı çalıştır
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=3600  # 1 saat timeout
                )

                # Job'u güncelle
                if result.returncode == 0:
                    supabase.table("mining_jobs")\
                        .update({"status": "completed"})\
                        .eq("id", job_id)\
                        .execute()
                else:
                    supabase.table("mining_jobs")\
                        .update({
                            "status": "failed",
                            "error": result.stderr
                        })\
                        .eq("id", job_id)\
                        .execute()

            except subprocess.TimeoutExpired:
                supabase.table("mining_jobs")\
                    .update({"status": "failed", "error": "Timeout"})\
                    .eq("id", job_id)\
                    .execute()
            except Exception as e:
                supabase.table("mining_jobs")\
                    .update({"status": "failed", "error": str(e)})\
                    .eq("id", job_id)\
                    .execute()
            finally:
                crawler_running = False
                current_job_id = None

        # Thread başlat
        thread = threading.Thread(target=run_crawler, daemon=True)
        thread.start()
        current_job_id = job_id

        return jsonify({
            "success": True,
            "message": "Crawler başlatıldı",
            "job_id": job_id
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
```

---

## ✅ CHECKLIST

After applying changes:

- [ ] Line ~174: `force = data.get('force', False)` added
- [ ] Line ~191: `"force": force` added to config
- [ ] Line ~215: Script path changed to `sahibinden_smart_crawler.py`
- [ ] Line ~226: `if force: cmd.append('--force')` added

---

**STATUS:** UI is ready ✅, backend needs 4 line changes.
