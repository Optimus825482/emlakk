"""
Parallel Sahibinden Crawler
===========================
2 Chrome worker ile 7 kategoriyi paralel crawl eder.
Hedef: 7 dakikadan 3.5 dakikaya düşürmek (2x hızlanma)

Kullanim:
    python parallel_crawler.py
    python parallel_crawler.py --categories konut_satilik arsa_satilik
    python parallel_crawler.py --max-pages 50 --turbo
"""

import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from typing import List, Dict, Optional
import logging
import argparse
import uuid
from datetime import datetime
import time
import sys
import json
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

from supabase import create_client, Client

from sahibinden_uc_batch_supabase import (
    SahibindenSupabaseCrawler,
    HENDEK_CATEGORIES,
    SUPABASE_URL,
    SUPABASE_KEY,
)
from rate_limiter import AdaptiveRateLimiter, RateLimiterConfig

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [W%(thread)d] %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class ThreadSafeRateLimiter:
    """
    Thread-safe rate limiter - 2 worker icin koordineli bekleme.
    Worker'lar arasi staggering ile cakisma onlenir.
    """

    def __init__(self, num_workers: int = 2):
        self._lock = threading.Lock()
        self._limiter = AdaptiveRateLimiter(
            RateLimiterConfig(
                base_delay=2.0,
                min_delay=1.0,
                max_delay=45.0,
                jitter_range=0.5,
                requests_per_minute=30,
                cooldown_after_block=30.0,
            )
        )
        self.num_workers = num_workers
        self._request_count = 0
        self._last_request_time = 0.0

    def wait(self, worker_id: int = 0) -> float:
        with self._lock:
            now = time.time()

            base_delay = self._limiter._calculate_delay()
            worker_offset = (worker_id / self.num_workers) * 0.75

            time_since_last = now - self._last_request_time
            required_delay = base_delay + worker_offset

            if time_since_last < required_delay:
                actual_wait = required_delay - time_since_last
                time.sleep(actual_wait)
            else:
                actual_wait = 0

            self._last_request_time = time.time()
            self._request_count += 1

            return actual_wait

    def report_success(self):
        with self._lock:
            self._limiter.report_success()

    def report_blocked(self):
        with self._lock:
            self._limiter.report_blocked()
            logger.warning("🚫 Block algilandi - tum worker'lar yavasliyor")

    def get_stats(self) -> dict:
        with self._lock:
            stats = self._limiter.get_stats()
            stats["total_coordinated_requests"] = self._request_count
            return stats


@dataclass
class WorkerResult:
    worker_id: int
    categories_completed: List[str] = field(default_factory=list)
    total_listings: int = 0
    new_listings: int = 0
    pages_crawled: int = 0
    smart_stops: int = 0
    pages_saved: int = 0
    errors: List[str] = field(default_factory=list)
    duration_seconds: float = 0.0


class ParallelCrawlerRunner:
    """
    2 Chrome worker ile paralel crawl yoneticisi.
    Mevcut SahibindenSupabaseCrawler sinifini kullanir.
    """

    CATEGORY_DISTRIBUTION = {
        0: ["konut_satilik", "arsa_satilik", "bina_satilik", "bina_kiralik"],
        1: ["konut_kiralik", "isyeri_satilik", "isyeri_kiralik"],
    }

    def __init__(
        self,
        job_id: Optional[str] = None,
        categories: Optional[List[str]] = None,
        max_pages: int = 100,
        turbo: bool = False,
        sync: bool = False,
    ):
        self.job_id = job_id or str(uuid.uuid4())
        self.categories = categories or list(HENDEK_CATEGORIES.keys())
        self.max_pages = max_pages
        self.turbo = turbo
        self.sync = sync

        self.shared_rate_limiter = ThreadSafeRateLimiter(num_workers=2)

        self.supabase: Optional[Client] = None
        self._init_supabase()

        self.stats = {
            "started_at": None,
            "completed_at": None,
            "total_listings": 0,
            "new_listings": 0,
            "updated_listings": 0,
            "categories_completed": [],
            "workers": 2,
            "smart_stops": 0,
            "pages_saved": 0,
            "total_pages": 0,
            "errors": [],
        }

    def _init_supabase(self):
        if SUPABASE_KEY:
            self.supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    def _create_job_record(self):
        if not self.supabase:
            return
        try:
            self.supabase.table("mining_jobs").upsert(
                {
                    "id": self.job_id,
                    "job_type": "parallel_crawler",
                    "status": "running",
                    "config": {
                        "categories": self.categories,
                        "max_pages": self.max_pages,
                        "workers": 2,
                        "turbo": self.turbo,
                        "sync": self.sync,
                    },
                    "stats": self.stats,
                    "progress": {
                        "current": 0,
                        "total": len(self.categories),
                        "percentage": 0,
                    },
                },
                on_conflict="id",
            ).execute()
        except Exception as e:
            logger.warning(f"Job record olusturulamadi: {e}")

    def _update_job_progress(self, current: int, total: int, message: str = ""):
        if not self.supabase:
            return
        try:
            percentage = int((current / total * 100)) if total > 0 else 0
            self.supabase.table("mining_jobs").update(
                {
                    "progress": {
                        "current": current,
                        "total": total,
                        "percentage": percentage,
                        "message": message,
                    },
                    "stats": self.stats,
                    "updated_at": datetime.now().isoformat(),
                }
            ).eq("id", self.job_id).execute()
        except Exception as e:
            logger.debug(f"Progress update failed: {e}")

    def _finalize_job(self, status: str = "completed", error: str = None):
        if not self.supabase:
            return
        try:
            update_data = {
                "status": status,
                "stats": self.stats,
                "progress": {
                    "current": len(self.stats["categories_completed"]),
                    "total": len(self.categories),
                    "percentage": 100 if status == "completed" else 0,
                },
                "updated_at": datetime.now().isoformat(),
            }
            if error:
                update_data["error"] = error[:500]
            self.supabase.table("mining_jobs").update(update_data).eq(
                "id", self.job_id
            ).execute()
        except Exception as e:
            logger.warning(f"Job finalize failed: {e}")

    def _distribute_categories(self) -> Dict[int, List[str]]:
        distribution = {}
        for worker_id, default_cats in self.CATEGORY_DISTRIBUTION.items():
            distribution[worker_id] = [
                cat for cat in default_cats if cat in self.categories
            ]
        return distribution

    def _run_worker(self, worker_id: int, categories: List[str]) -> WorkerResult:
        result = WorkerResult(worker_id=worker_id)
        start_time = time.time()

        if not categories:
            logger.info(f"Worker {worker_id}: Kategori yok, atlaniyor")
            return result

        logger.info(f"🚀 Worker {worker_id} baslatiliyor: {categories}")

        crawler = SahibindenSupabaseCrawler(job_id=f"{self.job_id}_w{worker_id}")
        crawler.rate_limiter = self.shared_rate_limiter

        try:
            crawler.start_browser()

            if worker_id > 0:
                logger.info(f"Worker {worker_id}: Stagger bekleniyor (2s)...")
                time.sleep(2.0)

            for cat_idx, category in enumerate(categories):
                config = HENDEK_CATEGORIES.get(category)
                if not config:
                    logger.warning(
                        f"Worker {worker_id}: Kategori bulunamadi: {category}"
                    )
                    continue

                logger.info(
                    f"📂 Worker {worker_id}: {category} ({cat_idx + 1}/{len(categories)})"
                )

                try:
                    saved = crawler.crawl_category(
                        key=category,
                        config=config,
                        max_pages=self.max_pages,
                        turbo=self.turbo,
                        sync=self.sync,
                    )

                    result.categories_completed.append(category)
                    result.new_listings += crawler.stats.get("new_listings", 0)
                    result.pages_crawled += crawler.stats.get("total_pages", 0)
                    result.smart_stops += crawler.stats.get("smart_stops", 0)
                    result.pages_saved += crawler.stats.get("pages_saved", 0)

                    crawler.stats["new_listings"] = 0
                    crawler.stats["total_pages"] = 0
                    crawler.stats["smart_stops"] = 0
                    crawler.stats["pages_saved"] = 0

                    logger.info(f"✅ Worker {worker_id}: {category} tamamlandi")

                    if cat_idx < len(categories) - 1:
                        time.sleep(1.0)

                except Exception as e:
                    error_msg = f"{category}: {str(e)}"
                    result.errors.append(error_msg)
                    logger.error(f"❌ Worker {worker_id} hatasi: {error_msg}")

            result.total_listings = len(crawler.seen_ids)

        except Exception as e:
            result.errors.append(f"Worker init error: {str(e)}")
            logger.error(f"❌ Worker {worker_id} baslatma hatasi: {e}")

        finally:
            try:
                crawler.close_browser()
            except:
                pass
            result.duration_seconds = time.time() - start_time

        logger.info(
            f"🏁 Worker {worker_id} bitti: "
            f"{len(result.categories_completed)} kategori, "
            f"{result.new_listings} yeni ilan, "
            f"{result.duration_seconds:.1f}s"
        )

        return result

    def run(self) -> Dict:
        self.stats["started_at"] = datetime.now().isoformat()

        logger.info("=" * 60)
        logger.info("🚀 PARALLEL CRAWLER BASLATILIYOR")
        logger.info(f"   Job ID: {self.job_id}")
        logger.info(f"   Kategoriler: {self.categories}")
        logger.info(f"   Workers: 2")
        logger.info(f"   Max Pages: {self.max_pages}")
        logger.info(f"   Turbo: {self.turbo}")
        logger.info("=" * 60)

        self._create_job_record()

        distribution = self._distribute_categories()
        logger.info(f"Kategori dagilimi: {distribution}")

        results: List[WorkerResult] = []

        try:
            with ThreadPoolExecutor(
                max_workers=2, thread_name_prefix="CrawlWorker"
            ) as executor:
                futures = {
                    executor.submit(self._run_worker, worker_id, cats): worker_id
                    for worker_id, cats in distribution.items()
                    if cats
                }

                completed_categories = 0
                for future in as_completed(futures):
                    worker_id = futures[future]
                    try:
                        result = future.result()
                        results.append(result)

                        self.stats["total_listings"] += result.total_listings
                        self.stats["new_listings"] += result.new_listings
                        self.stats["categories_completed"].extend(
                            result.categories_completed
                        )
                        self.stats["smart_stops"] += result.smart_stops
                        self.stats["pages_saved"] += result.pages_saved
                        self.stats["total_pages"] += result.pages_crawled
                        self.stats["errors"].extend(result.errors)

                        completed_categories += len(result.categories_completed)
                        self._update_job_progress(
                            completed_categories,
                            len(self.categories),
                            f"Worker {worker_id} tamamlandi",
                        )

                    except Exception as e:
                        logger.error(f"❌ Worker {worker_id} exception: {e}")
                        self.stats["errors"].append(f"Worker {worker_id}: {str(e)}")

        except KeyboardInterrupt:
            logger.warning("⚠️ Kullanici tarafindan durduruldu")
            self._finalize_job("cancelled", "User interrupted")
            raise

        self.stats["completed_at"] = datetime.now().isoformat()
        self.stats["rate_limiter"] = self.shared_rate_limiter.get_stats()

        start = datetime.fromisoformat(self.stats["started_at"])
        end = datetime.fromisoformat(self.stats["completed_at"])
        duration = (end - start).total_seconds()
        self.stats["duration_seconds"] = duration

        self._finalize_job("completed")

        logger.info("\n" + "=" * 60)
        logger.info("📊 PARALEL CRAWLER OZETI")
        logger.info("=" * 60)
        logger.info(
            f"   Toplam sure: {duration:.1f} saniye ({duration / 60:.1f} dakika)"
        )
        logger.info(
            f"   Kategoriler: {len(self.stats['categories_completed'])}/{len(self.categories)}"
        )
        logger.info(f"   Toplam ilan: {self.stats['total_listings']}")
        logger.info(f"   Yeni ilan: {self.stats['new_listings']}")
        logger.info(f"   Toplam sayfa: {self.stats['total_pages']}")
        logger.info(f"   Smart stops: {self.stats['smart_stops']}")
        logger.info(f"   Atlanan sayfa: {self.stats['pages_saved']}")
        if self.stats["errors"]:
            logger.warning(f"   Hatalar: {len(self.stats['errors'])}")
        logger.info("=" * 60)

        return self.stats


def main():
    parser = argparse.ArgumentParser(description="Parallel Sahibinden Crawler")
    parser.add_argument("--categories", nargs="+", default=None, help="Kategoriler")
    parser.add_argument(
        "--max-pages", type=int, default=100, help="Kategori basina max sayfa"
    )
    parser.add_argument("--job-id", default=None, help="Job ID")
    parser.add_argument(
        "--turbo", action="store_true", help="Turbo mod (daha az bekleme)"
    )
    parser.add_argument(
        "--sync", action="store_true", help="Kaldirilan ilanlari sync et"
    )

    args = parser.parse_args()

    runner = ParallelCrawlerRunner(
        job_id=args.job_id,
        categories=args.categories,
        max_pages=args.max_pages,
        turbo=args.turbo,
        sync=args.sync,
    )

    try:
        stats = runner.run()

        result = {
            "success": True,
            "job_id": runner.job_id,
            "duration_seconds": stats.get("duration_seconds", 0),
            "total_listings": stats.get("total_listings", 0),
            "new_listings": stats.get("new_listings", 0),
            "categories_completed": stats.get("categories_completed", []),
            "smart_stops": stats.get("smart_stops", 0),
            "pages_saved": stats.get("pages_saved", 0),
            "errors": stats.get("errors", []),
        }

        print(json.dumps(result))
        sys.exit(0)

    except KeyboardInterrupt:
        print(json.dumps({"success": False, "error": "Interrupted by user"}))
        sys.exit(1)
    except Exception as e:
        logger.error(f"Crawler hatasi: {e}")
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
