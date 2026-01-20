"""
Sahibinden Crawler FastAPI Servisi
===================================
Next.js Collector modülü için HTTP API sağlar.

Kullanım:
   uvicorn crawler_api:app --host 0.0.0.0 --port 8000 --reload

Endpoints:
   POST /crawl - Liste sayfalarını crawl et
   POST /detail - Tek ilan detayı çek
   POST /detail-batch - Toplu detay çek
   GET /health - Servis durumu
   GET /stats - Rate limiter istatistikleri
"""

import asyncio
import os
import logging
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import subprocess
import sys

# Rate Limiter import
from rate_limiter import AdaptiveRateLimiter, RateLimiterConfig

# Logger setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Sahibinden Crawler API",
    description="DEMİR-NET Collector için Sahibinden.com crawler servisi",
    version="1.1.0"
)

# CORS - Next.js'den erişim için
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
rate_limiter = AdaptiveRateLimiter()
is_crawling = False
crawler_lock = asyncio.Lock()


class CrawlRequest(BaseModel):
    url: str
    maxPages: int = 5
    withDetails: bool = False
    maxDetails: int = 10


class DetailRequest(BaseModel):
    url: str


class DetailBatchRequest(BaseModel):
    """Toplu detay çekme isteği"""
    urls: Optional[List[str]] = None  # Belirli URL'ler
    maxListings: int = 50             # Veya pending listelerden max sayı
    category: Optional[str] = None    # Kategori filtresi
    onlyPending: bool = True          # Sadece detayı çekilmemiş olanlar


class CrawlJob(BaseModel):
    id: str
    status: str
    url: str
    startedAt: str
    completedAt: Optional[str] = None
    totalListings: int = 0
    error: Optional[str] = None


# Aktif işler
active_jobs: dict[str, CrawlJob] = {}


def run_crawler_script(script_name: str, args: List[str]) -> dict:
    """Python crawler scriptini çalıştır"""
    try:
        import logging
        logger = logging.getLogger(__name__)
        
        cmd = [sys.executable, script_name] + args
        logger.info(f"Running: {' '.join(cmd)}")
        
        result = subprocess.run(
            cmd,
            cwd=os.path.dirname(__file__),
            capture_output=True,
            text=True,
            timeout=300  # 5 dakika timeout
        )
        
        logger.info(f"Return code: {result.returncode}")
        logger.info(f"STDOUT: {result.stdout[:500]}")
        logger.info(f"STDERR: {result.stderr[:500]}")
        
        if result.returncode != 0:
            return {
                "success": False,
                "error": result.stderr or "Script failed",
                "stdout": result.stdout
            }
        
        # Output'tan JSON parse et
        try:
            output_lines = result.stdout.strip().split('\n')
            for line in reversed(output_lines):
                if line.startswith('{'):
                    return json.loads(line)
        except Exception as e:
            logger.error(f"JSON parse error: {e}")
            pass
        
        return {
            "success": True,
            "output": result.stdout,
            "total_listings": 0
        }
        
    except subprocess.TimeoutExpired:
        return {"success": False, "error": "Timeout"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/health")
async def health_check():
    """Servis durumu"""
    limiter_stats = rate_limiter.get_stats()
    
    return {
        "status": "healthy",
        "crawler_ready": True,
        "is_crawling": is_crawling,
        "active_jobs": len(active_jobs),
        "rate_limiter": {
            "current_delay": limiter_stats["current_delay"],
            "backoff_level": limiter_stats["current_backoff_level"],
            "block_rate": f"{limiter_stats['block_rate']:.1f}%"
        },
        "timestamp": datetime.now().isoformat()
    }


@app.get("/stats")
async def get_stats():
    """Rate limiter ve crawler istatistikleri"""
    return {
        "rate_limiter": rate_limiter.get_stats(),
        "crawler": {
            "ready": True,
            "is_crawling": is_crawling,
            "active_jobs": len(active_jobs),
        },
        "jobs": {
            "total": len(active_jobs),
            "running": len([j for j in active_jobs.values() if j.status == "running"]),
            "completed": len([j for j in active_jobs.values() if j.status == "completed"]),
            "failed": len([j for j in active_jobs.values() if j.status == "failed"]),
        },
        "timestamp": datetime.now().isoformat()
    }


@app.post("/crawl")
async def crawl_listings(request: CrawlRequest, background_tasks: BackgroundTasks):
    """Liste sayfalarını crawl et - Supabase crawler kullanır"""
    global is_crawling
    
    if is_crawling:
        raise HTTPException(status_code=429, detail="Başka bir crawl işlemi devam ediyor")
    
    job_id = f"job_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # Job oluştur
    job = CrawlJob(
        id=job_id,
        status="running",
        url=request.url,
        startedAt=datetime.now().isoformat()
    )
    active_jobs[job_id] = job
    
    try:
        is_crawling = True
        
        # Kategoriyi URL'den belirle
        category = "konut_satilik"
        if "kiralik" in request.url:
            if "isyeri" in request.url:
                category = "isyeri_kiralik"
            else:
                category = "konut_kiralik"
        elif "isyeri" in request.url:
            category = "isyeri_satilik"
        elif "arsa" in request.url:
            category = "arsa_satilik"
        elif "bina" in request.url:
            category = "bina_satilik"
        
        # Args hazırla
        args = [
            "--categories", category,
            "--max-pages", str(request.maxPages),
            "--job-id", job_id
        ]
        
        # Gerçek Supabase crawler'ı çalıştır
        result = run_crawler_script("sahibinden_uc_batch_supabase.py", args)

        
        if not result.get("success", False):
            raise Exception(result.get("error", "Crawler failed"))
        
        # Job güncelle
        job.status = "completed"
        job.completedAt = datetime.now().isoformat()
        job.totalListings = result.get("total_listings", 0)
        
        return {
            "success": True,
            "jobId": job_id,
            "totalListings": result.get("total_listings", 0),
            "message": f"{request.maxPages} sayfa tarandı, {result.get('total_listings', 0)} ilan bulundu"
        }
        
    except Exception as e:
        job.status = "failed"
        job.error = str(e)
        job.completedAt = datetime.now().isoformat()
        
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        is_crawling = False


@app.post("/detail")
async def crawl_detail(request: DetailRequest):
    """Tek ilan detayı çek - Detay crawler kullanır"""
    try:
        # Detay crawler'ı çalıştır
        args = ["--url", request.url]
        result = run_crawler_script("sahibinden_uc_detail_supabase.py", args)
        
        if not result.get("success", False):
            raise HTTPException(status_code=500, detail=result.get("error", "Detay çekilemedi"))
        
        return {
            "success": True,
            "detail": result.get("detail", {})
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/detail-batch")
async def crawl_detail_batch(request: DetailBatchRequest, background_tasks: BackgroundTasks):
    """Toplu detay çekme - Detay batch crawler kullanır"""
    global is_crawling
    
    if is_crawling:
        raise HTTPException(status_code=429, detail="Başka bir crawl işlemi devam ediyor")
    
    job_id = f"detail_batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # Job oluştur
    job = CrawlJob(
        id=job_id,
        status="running",
        url="batch-detail",
        startedAt=datetime.now().isoformat()
    )
    active_jobs[job_id] = job
    
    try:
        is_crawling = True
        
        if not request.urls:
            raise HTTPException(
                status_code=400, 
                detail="urls parametresi gerekli"
            )
        
        # Detay batch crawler'ı çalıştır
        args = [
            "--max-listings", str(request.maxListings),
            "--job-id", job_id
        ]
        
        # URL'leri geçici dosyaya yaz
        urls_file = f"temp_urls_{job_id}.txt"
        with open(urls_file, "w") as f:
            f.write("\n".join(request.urls))
        
        args.extend(["--urls-file", urls_file])
        
        result = run_crawler_script("sahibinden_uc_detail_batch.py", args)
        
        # Geçici dosyayı sil
        if os.path.exists(urls_file):
            os.remove(urls_file)
        
        if not result.get("success", False):
            raise Exception(result.get("error", "Batch detail failed"))
        
        # Job tamamla
        job.status = "completed"
        job.completedAt = datetime.now().isoformat()
        job.totalListings = result.get("success_count", 0)
        
        return {
            "success": True,
            "jobId": job_id,
            "totalProcessed": result.get("total_processed", 0),
            "successCount": result.get("success_count", 0),
            "errorCount": result.get("error_count", 0),
            "message": f"{result.get('success_count', 0)}/{result.get('total_processed', 0)} ilan detayı çekildi"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        job.status = "failed"
        job.error = str(e)
        job.completedAt = datetime.now().isoformat()
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        is_crawling = False


@app.get("/jobs")
async def list_jobs():
    """Aktif işleri listele"""
    return {
        "jobs": list(active_jobs.values()),
        "total": len(active_jobs)
    }


@app.get("/jobs/{job_id}")
async def get_job(job_id: str):
    """İş durumunu al"""
    if job_id not in active_jobs:
        raise HTTPException(status_code=404, detail="İş bulunamadı")
    return active_jobs[job_id]


@app.on_event("shutdown")
async def shutdown_event():
    """Uygulama kapanırken temizlik"""
    logger.info("Crawler API shutting down...")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
