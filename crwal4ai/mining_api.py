"""
Mining API - Data Mining Center için FastAPI Backend
=====================================================
Crawler'ları kontrol etmek ve durumlarını takip etmek için API.

Kullanım:
   uvicorn mining_api:app --host 0.0.0.0 --port 8765 --reload
"""

import os
import asyncio
import subprocess
import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List
from pathlib import Path
from contextlib import asynccontextmanager
from get_category_counts import get_category_counts

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment
load_dotenv()

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Supabase HTTP request log'larını kapat (çok fazla spam)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)

# Paths
SCRIPT_DIR = Path(__file__).parent

# Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://cxeakfwtrlnjcjzvqdip.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")

logger.info(f"SUPABASE_URL: {SUPABASE_URL}")
logger.info(f"SUPABASE_KEY exists: {bool(SUPABASE_KEY)}")

supabase: Optional[Client] = None

# Active processes
active_processes: Dict[str, subprocess.Popen] = {}


def get_supabase() -> Client:
    global supabase
    if supabase is None:
        if not SUPABASE_KEY:
            logger.error("SUPABASE_KEY not found!")
            raise Exception("Supabase key not configured")
        try:
            supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
            logger.info("Supabase client created successfully")
        except Exception as e:
            logger.error(f"Failed to create Supabase client: {e}")
            raise
    return supabase


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown events"""
    logger.info("🚀 Mining API starting...")
    yield
    logger.info("👋 Mining API shutting down...")
    # Kill any active processes
    for job_id, proc in active_processes.items():
        if proc.poll() is None:
            proc.terminate()
            logger.info(f"Terminated process for job {job_id}")


app = FastAPI(
    title="DEMIR-NET Mining API",
    description="Data Mining Center Crawler Control API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS - must be first middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={"Access-Control-Allow-Origin": "*"}
    )


# ==================== MODELS ====================

class CrawlConfig(BaseModel):
    categories: Optional[List[str]] = None
    max_pages: int = 100
    max_listings: Optional[int] = None


class JobResponse(BaseModel):
    id: str
    job_type: str
    source: str
    status: str
    progress: Dict[str, Any]
    stats: Dict[str, Any]
    created_at: str


# ==================== HELPERS ====================

async def create_job(job_type: str, source: str = "sahibinden", config: dict = None) -> dict:
    """Create a new mining job"""
    db = get_supabase()
    job_data = {
        "job_type": job_type,
        "source": source,
        "status": "pending",
        "config": config or {},
        "progress": {"current": 0, "total": 0, "percentage": 0},
        "stats": {},
    }
    result = db.table("mining_jobs").insert(job_data).execute()
    return result.data[0] if result.data else None


async def update_job(job_id: str, **kwargs) -> dict:
    """Update job status"""
    db = get_supabase()
    kwargs["updated_at"] = datetime.now().isoformat()
    result = db.table("mining_jobs").update(kwargs).eq("id", job_id).execute()
    return result.data[0] if result.data else None


async def add_log(job_id: str, level: str, message: str, data: dict = None):
    """Add log entry"""
    db = get_supabase()
    log_data = {
        "job_id": job_id,
        "level": level,
        "message": message,
        "data": data,
    }
    db.table("mining_logs").insert(log_data).execute()


async def run_list_crawler(job_id: str, config: CrawlConfig):
    """Run the list crawler in background"""
    try:
        await update_job(job_id, status="running", started_at=datetime.now().isoformat())
        await add_log(job_id, "info", "Liste crawler başlatılıyor...")
        
        # Build command
        cmd = ["python", str(SCRIPT_DIR / "sahibinden_uc_batch_supabase.py")]
        if config.categories:
            cmd.extend(["--categories"] + config.categories)
        if config.max_pages:
            cmd.extend(["--max-pages", str(config.max_pages)])
        cmd.extend(["--job-id", job_id])
        
        logger.info(f"Running: {' '.join(cmd)}")
        
        # Run process
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            cwd=str(SCRIPT_DIR)
        )
        active_processes[job_id] = proc
        
        # Stream output
        for line in proc.stdout:
            line = line.strip()
            if line:
                logger.info(f"[{job_id[:8]}] {line}")
                # Parse progress from output
                if "ilan bulundu" in line.lower() or "sayfa" in line.lower():
                    await add_log(job_id, "info", line)
        
        proc.wait()
        
        if proc.returncode == 0:
            await update_job(job_id, status="completed", completed_at=datetime.now().isoformat())
            await add_log(job_id, "success", "Liste crawler tamamlandı")
        else:
            await update_job(job_id, status="failed", error_message=f"Exit code: {proc.returncode}")
            await add_log(job_id, "error", f"Crawler hata ile sonlandı: {proc.returncode}")
            
    except Exception as e:
        logger.error(f"Crawler error: {e}")
        await update_job(job_id, status="failed", error_message=str(e))
        await add_log(job_id, "error", f"Hata: {str(e)}")
    finally:
        active_processes.pop(job_id, None)


async def run_detail_crawler(job_id: str, config: CrawlConfig):
    """Run the detail crawler in background"""
    try:
        await update_job(job_id, status="running", started_at=datetime.now().isoformat())
        await add_log(job_id, "info", "Detay crawler başlatılıyor...")
        
        # Build command
        cmd = ["python", str(SCRIPT_DIR / "sahibinden_uc_detail_supabase.py")]
        if config.max_listings:
            cmd.extend(["--max-listings", str(config.max_listings)])
        cmd.extend(["--job-id", job_id])
        
        logger.info(f"Running: {' '.join(cmd)}")
        
        # Run process
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            cwd=str(SCRIPT_DIR)
        )
        active_processes[job_id] = proc
        
        # Stream output
        for line in proc.stdout:
            line = line.strip()
            if line:
                logger.info(f"[{job_id[:8]}] {line}")
                if "detay" in line.lower() or "kaydedildi" in line.lower():
                    await add_log(job_id, "info", line)
        
        proc.wait()
        
        if proc.returncode == 0:
            await update_job(job_id, status="completed", completed_at=datetime.now().isoformat())
            await add_log(job_id, "success", "Detay crawler tamamlandı")
        else:
            await update_job(job_id, status="failed", error_message=f"Exit code: {proc.returncode}")
            await add_log(job_id, "error", f"Crawler hata ile sonlandı: {proc.returncode}")
            
    except Exception as e:
        logger.error(f"Crawler error: {e}")
        await update_job(job_id, status="failed", error_message=str(e))
        await add_log(job_id, "error", f"Hata: {str(e)}")
    finally:
        active_processes.pop(job_id, None)


async def run_local_list_crawler(job_id: str, config: CrawlConfig):
    """Run the LOCAL list crawler (JSON output) in background"""
    try:
        await update_job(job_id, status="running", started_at=datetime.now().isoformat())
        await add_log(job_id, "info", "Local liste crawler başlatılıyor (JSON çıktı)...")
        
        # Build command
        cmd = ["python", str(SCRIPT_DIR / "sahibinden_uc_batch.py")]
        if config.categories:
            cmd.extend(["--categories"] + config.categories)
        if config.max_pages:
            cmd.extend(["--max-pages", str(config.max_pages)])
        cmd.extend(["--job-id", job_id])
        
        logger.info(f"Running LOCAL: {' '.join(cmd)}")
        
        # Run process
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            cwd=str(SCRIPT_DIR)
        )
        active_processes[job_id] = proc
        
        # Stream output
        for line in proc.stdout:
            line = line.strip()
            if line:
                logger.info(f"[{job_id[:8]}] {line}")
                if "ilan" in line.lower() or "sayfa" in line.lower():
                    await add_log(job_id, "info", line)
        
        proc.wait()
        
        if proc.returncode == 0:
            await update_job(job_id, status="completed", completed_at=datetime.now().isoformat())
            await add_log(job_id, "success", "Local liste crawler tamamlandı")
        else:
            await update_job(job_id, status="failed", error_message=f"Exit code: {proc.returncode}")
            await add_log(job_id, "error", f"Crawler hata ile sonlandı: {proc.returncode}")
            
    except Exception as e:
        logger.error(f"Crawler error: {e}")
        await update_job(job_id, status="failed", error_message=str(e))
        await add_log(job_id, "error", f"Hata: {str(e)}")
    finally:
        active_processes.pop(job_id, None)


async def run_local_detail_crawler(job_id: str, config: CrawlConfig):
    """Run the LOCAL detail crawler (JSON output) in background"""
    try:
        await update_job(job_id, status="running", started_at=datetime.now().isoformat())
        await add_log(job_id, "info", "Local detay crawler başlatılıyor (JSON çıktı)...")
        
        # Build command
        cmd = ["python", str(SCRIPT_DIR / "sahibinden_uc_detail_batch.py")]
        if config.max_listings:
            cmd.extend(["--max-listings", str(config.max_listings)])
        cmd.extend(["--job-id", job_id])
        
        logger.info(f"Running LOCAL: {' '.join(cmd)}")
        
        # Run process
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            cwd=str(SCRIPT_DIR)
        )
        active_processes[job_id] = proc
        
        # Stream output
        for line in proc.stdout:
            line = line.strip()
            if line:
                logger.info(f"[{job_id[:8]}] {line}")
                if "detay" in line.lower() or "özellik" in line.lower():
                    await add_log(job_id, "info", line)
        
        proc.wait()
        
        if proc.returncode == 0:
            await update_job(job_id, status="completed", completed_at=datetime.now().isoformat())
            await add_log(job_id, "success", "Local detay crawler tamamlandı")
        else:
            await update_job(job_id, status="failed", error_message=f"Exit code: {proc.returncode}")
            await add_log(job_id, "error", f"Crawler hata ile sonlandı: {proc.returncode}")
            
    except Exception as e:
        logger.error(f"Crawler error: {e}")
        await update_job(job_id, status="failed", error_message=str(e))
        await add_log(job_id, "error", f"Hata: {str(e)}")
    finally:
        active_processes.pop(job_id, None)


# ==================== ENDPOINTS ====================

@app.get("/")
async def root():
    return {"status": "online", "service": "DEMIR-NET Mining API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.get("/stats")
async def get_stats():
    """Get overall mining statistics"""
    try:
        db = get_supabase()
        
        # Liste sayısı
        liste_count = db.table("sahibinden_liste").select("id", count="exact").execute()
        
        # Aktif job sayısı
        active_jobs = db.table("mining_jobs").select("id", count="exact").eq("status", "running").execute()
        
        # Kategori + Transaction bazlı sayılar (category ve transaction ayrı kolonlar)
        konut_satilik = db.table("sahibinden_liste").select("id", count="exact").eq("category", "konut").eq("transaction", "satilik").execute()
        konut_kiralik = db.table("sahibinden_liste").select("id", count="exact").eq("category", "konut").eq("transaction", "kiralik").execute()
        isyeri_satilik = db.table("sahibinden_liste").select("id", count="exact").eq("category", "isyeri").eq("transaction", "satilik").execute()
        isyeri_kiralik = db.table("sahibinden_liste").select("id", count="exact").eq("category", "isyeri").eq("transaction", "kiralik").execute()
        arsa_satilik = db.table("sahibinden_liste").select("id", count="exact").eq("category", "arsa").eq("transaction", "satilik").execute()
        bina_satilik = db.table("sahibinden_liste").select("id", count="exact").eq("category", "bina").eq("transaction", "satilik").execute()
        
        return {
            "total_listings": liste_count.count or 0,
            "active_jobs": active_jobs.count or 0,
            "recent_24h": 0,
            "pending_details": 0,  # Detay sistemi henüz yok
            "active_processes": len(active_processes),
            "by_category": {
                "konut_satilik": konut_satilik.count or 0,
                "konut_kiralik": konut_kiralik.count or 0,
                "isyeri_satilik": isyeri_satilik.count or 0,
                "isyeri_kiralik": isyeri_kiralik.count or 0,
                "arsa_satilik": arsa_satilik.count or 0,
                "bina_satilik": bina_satilik.count or 0
            }
        }
    except Exception as e:
        logger.error(f"Stats error: {e}")
        return {
            "total_listings": 0,
            "active_jobs": 0,
            "recent_24h": 0,
            "pending_details": 0,
            "active_processes": 0,
            "by_category": {
                "konut_satilik": 0,
                "konut_kiralik": 0,
                "isyeri_satilik": 0,
                "isyeri_kiralik": 0,
                "arsa_satilik": 0,
                "bina_satilik": 0
            },
            "error": str(e)
        }


@app.get("/jobs")
async def list_jobs(limit: int = 20, status: Optional[str] = None):
    """List mining jobs"""
    try:
        db = get_supabase()
        query = db.table("mining_jobs").select("*").order("created_at", desc=True).limit(limit)
        if status:
            query = query.eq("status", status)
        result = query.execute()
        return {"jobs": result.data or []}
    except Exception as e:
        logger.error(f"Jobs list error: {e}")
        return {"jobs": [], "error": str(e)}


@app.get("/jobs/{job_id}")
async def get_job(job_id: str):
    """Get job details"""
    try:
        db = get_supabase()
        result = db.table("mining_jobs").select("*").eq("id", job_id).single().execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Get logs
        logs = db.table("mining_logs").select("*").eq("job_id", job_id).order("created_at", desc=True).limit(50).execute()
        
        return {"job": result.data, "logs": logs.data or []}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Job detail error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/jobs/list-crawl")
async def start_list_crawl(config: CrawlConfig, background_tasks: BackgroundTasks):
    """Start a list crawl job"""
    try:
        # Check if already running
        db = get_supabase()
        running = db.table("mining_jobs").select("id").eq("status", "running").eq("job_type", "list_crawl").execute()
        if running.data:
            raise HTTPException(status_code=409, detail="Liste crawler zaten çalışıyor")
        
        # Create job
        job = await create_job("list_crawl", "sahibinden", config.model_dump())
        if not job:
            raise HTTPException(status_code=500, detail="Job oluşturulamadı")
        
        # Start in background
        background_tasks.add_task(run_list_crawler, job["id"], config)
        
        return {"message": "Liste crawler başlatıldı", "job_id": job["id"]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"List crawl start error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/jobs/detail-crawl")
async def start_detail_crawl(config: CrawlConfig, background_tasks: BackgroundTasks):
    """Start a detail crawl job"""
    try:
        # Check if already running
        db = get_supabase()
        running = db.table("mining_jobs").select("id").eq("status", "running").eq("job_type", "detail_crawl").execute()
        if running.data:
            raise HTTPException(status_code=409, detail="Detay crawler zaten çalışıyor")
        
        # Create job
        job = await create_job("detail_crawl", "sahibinden", config.model_dump())
        if not job:
            raise HTTPException(status_code=500, detail="Job oluşturulamadı")
        
        # Start in background
        background_tasks.add_task(run_detail_crawler, job["id"], config)
        
        return {"message": "Detay crawler başlatıldı", "job_id": job["id"]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Detail crawl start error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/jobs/{job_id}/cancel")
async def cancel_job(job_id: str):
    """Cancel a running job"""
    try:
        db = get_supabase()
        
        # Önce job'ın var olup olmadığını kontrol et
        job_result = db.table("mining_jobs").select("id, status").eq("id", job_id).single().execute()
        if not job_result.data:
            raise HTTPException(status_code=404, detail="Job bulunamadı")
        
        job = job_result.data
        
        # Zaten tamamlanmış veya iptal edilmiş mi?
        if job["status"] in ["completed", "cancelled", "failed"]:
            return {"message": f"Job zaten {job['status']} durumunda", "status": job["status"]}
        
        # Aktif process varsa terminate et
        process_terminated = False
        if job_id in active_processes:
            proc = active_processes[job_id]
            if proc.poll() is None:
                proc.terminate()
                process_terminated = True
                logger.info(f"Process terminated for job {job_id}")
            active_processes.pop(job_id, None)
        
        # Supabase'de durumu güncelle
        await update_job(job_id, status="cancelled")
        await add_log(job_id, "warning", "Job kullanıcı tarafından iptal edildi")
        
        if process_terminated:
            return {"message": "Job iptal edildi ve process sonlandırıldı"}
        else:
            return {"message": "Job iptal edildi (process zaten sonlanmıştı)"}
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Cancel job error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/jobs/local-list-crawl")
async def start_local_list_crawl(config: CrawlConfig, background_tasks: BackgroundTasks):
    """Start a LOCAL list crawl job (JSON output)"""
    try:
        # Check if already running
        db = get_supabase()
        running = db.table("mining_jobs").select("id").eq("status", "running").eq("job_type", "local_list_crawl").execute()
        if running.data:
            raise HTTPException(status_code=409, detail="Local liste crawler zaten çalışıyor")
        
        # Create job
        job = await create_job("local_list_crawl", "sahibinden_local", config.model_dump())
        if not job:
            raise HTTPException(status_code=500, detail="Job oluşturulamadı")
        
        # Start in background
        background_tasks.add_task(run_local_list_crawler, job["id"], config)
        
        return {"message": "Local liste crawler başlatıldı", "job_id": job["id"]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Local list crawl start error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/jobs/local-detail-crawl")
async def start_local_detail_crawl(config: CrawlConfig, background_tasks: BackgroundTasks):
    """Start a LOCAL detail crawl job (JSON output)"""
    try:
        # Check if already running
        db = get_supabase()
        running = db.table("mining_jobs").select("id").eq("status", "running").eq("job_type", "local_detail_crawl").execute()
        if running.data:
            raise HTTPException(status_code=409, detail="Local detay crawler zaten çalışıyor")
        
        # Create job
        job = await create_job("local_detail_crawl", "sahibinden_local", config.model_dump())
        if not job:
            raise HTTPException(status_code=500, detail="Job oluşturulamadı")
        
        # Start in background
        background_tasks.add_task(run_local_detail_crawler, job["id"], config)
        
        return {"message": "Local detay crawler başlatıldı", "job_id": job["id"]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Local detail crawl start error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/jobs/{job_id}/logs")
async def get_job_logs(job_id: str, limit: int = 50):
    """Get logs for a specific job"""
    try:
        db = get_supabase()
        logs = db.table("mining_logs").select("*").eq("job_id", job_id).order("created_at", desc=True).limit(limit).execute()
        return {"logs": logs.data or []}
    except Exception as e:
        logger.error(f"Get logs error: {e}")
        return {"logs": [], "error": str(e)}


@app.get("/logs")
async def get_all_logs(limit: int = 100, level: Optional[str] = None, since: Optional[str] = None):
    """Get all recent logs across all jobs"""
    try:
        db = get_supabase()
        query = db.table("mining_logs").select("*, mining_jobs(job_type, status)").order("created_at", desc=True).limit(limit)
        
        if level:
            query = query.eq("level", level)
        if since:
            query = query.gte("created_at", since)
            
        result = query.execute()
        return {"logs": result.data or []}
    except Exception as e:
        logger.error(f"Get all logs error: {e}")
        return {"logs": [], "error": str(e)}


@app.get("/logs/stream")
async def get_logs_stream(job_id: Optional[str] = None, last_id: Optional[str] = None, limit: int = 50):
    """Get new logs since last_id for live streaming"""
    try:
        db = get_supabase()
        
        # Build query - order by created_at ASC for streaming
        query = db.table("mining_logs").select("*").order("created_at", desc=False)
        
        if job_id:
            query = query.eq("job_id", job_id)
        
        # If we have a last_id, get logs created AFTER that log's timestamp
        if last_id:
            try:
                # First get the timestamp of the last log
                last_log_result = db.table("mining_logs").select("created_at").eq("id", last_id).execute()
                if last_log_result.data and len(last_log_result.data) > 0:
                    query = query.gt("created_at", last_log_result.data[0]["created_at"])
            except Exception as e:
                logger.warning(f"Could not find last_id {last_id}: {e}")
                # Continue without the filter
        
        query = query.limit(limit)
        result = query.execute()
        logs = result.data or []
        
        # Return the last log's ID for next poll
        new_last_id = logs[-1]["id"] if logs else last_id
        
        return {
            "logs": logs,
            "last_id": new_last_id,
            "count": len(logs)
        }
    except Exception as e:
        logger.error(f"Logs stream error: {e}")
        return {"logs": [], "last_id": last_id, "count": 0, "error": str(e)}


@app.get("/listings")
async def get_listings(limit: int = 50, offset: int = 0, category: Optional[str] = None):
    """Get crawled listings"""
    try:
        db = get_supabase()
        query = db.table("sahibinden_liste").select("*").order("id", desc=True).range(offset, offset + limit - 1)
        if category:
            query = query.eq("category", category)
        result = query.execute()
        return {"listings": result.data or [], "count": len(result.data or [])}
    except Exception as e:
        logger.error(f"Listings error: {e}")
        return {"listings": [], "count": 0, "error": str(e)}


@app.get("/stats/pending-details")
async def get_pending_details():
    """Get count of listings without details"""
    try:
        db = get_supabase()
        result = db.table("sahibinden_liste").select("id", count="exact").or_("detay_cekildi.is.null,detay_cekildi.eq.false").execute()
        return {"pending_count": result.count or 0}
    except Exception as e:
        logger.error(f"Pending details error: {e}")
        return {"pending_count": 0, "error": str(e)}


@app.get("/live-counts")
async def get_live_counts():
    """Get real-time category counts from Sahibinden using Selenium"""
    try:
        logger.info("Requesting live counts via Selenium...")
        # Run synchronously since we need the result now
        # Ideally this should be cached or queued, but for now we wait (client has timeout)
        result = await asyncio.to_thread(get_category_counts)
        
        if not result.get("success"):
            logger.error(f"Live counts failed: {result.get('error')}")
            raise HTTPException(status_code=500, detail=result.get("error"))
            
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Live counts endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8765)
