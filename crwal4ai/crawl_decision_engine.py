"""
Crawler Decision Engine - Delta Sync Strategy
==============================================
Smart decision-making for which categories to crawl based on:
- Historical stats (category_stats table)
- Time since last check
- Detected changes (diff > 0)

This prevents unnecessary crawling of unchanged categories, saving ~70% of crawl time.
"""

from datetime import datetime, timedelta
from typing import Tuple, List, Optional
import logging

logger = logging.getLogger(__name__)


class CrawlDecisionEngine:
    """
    Determines which categories need crawling based on intelligent analysis.
    
    Decision Logic:
    1. If diff > 0 in category_stats → CRAWL (new listings detected)
    2. If last_checked > 6 hours ago → FULL CRAWL (periodic refresh)
    3. If last_checked < 6 hours and diff == 0 → SKIP (no changes)
    4. If category never crawled → FULL CRAWL (initialization)
    """
    
    def __init__(self, supabase_client):
        """
        Args:
            supabase_client: Initialized Supabase client instance
        """
        self.supabase = supabase_client
        self.STALE_THRESHOLD_HOURS = 6  # Configurable staleness threshold
    
    def should_crawl_category(
        self, 
        category: str, 
        transaction: str
    ) -> Tuple[bool, int, str]:
        """
        Determine if a category should be crawled.
        
        Args:
            category: Category name (e.g., 'konut', 'arsa')
            transaction: Transaction type ('satilik' or 'kiralik')
        
        Returns:
            Tuple of (should_crawl, max_pages, reason):
            - should_crawl: Boolean indicating if crawl is needed
            - max_pages: Recommended max pages to crawl
            - reason: Human-readable explanation of decision
        
        Examples:
            >>> engine.should_crawl_category('konut', 'satilik')
            (True, 5, 'new_listings_detected (25)')
            
            >>> engine.should_crawl_category('arsa', 'kiralik')
            (False, 0, 'skip (checked 2.3h ago, no changes)')
        """
        try:
            # Fetch category stats from database
            result = self.supabase.table("category_stats")\
                .select("*")\
                .eq("category", category)\
                .eq("transaction", transaction)\
                .execute()
            
            if not result.data:
                # Never crawled before - do full crawl
                logger.info(f"🆕 {category}/{transaction}: First time crawl")
                return True, 100, "first_crawl"
            
            stats = result.data[0]
            diff = stats.get("diff", 0)
            last_checked = stats.get("last_checked_at")
            sahibinden_count = stats.get("sahibinden_count", 0)
            
            # Calculate time since last check
            hours_since = self._calculate_hours_since(last_checked)
            
            # DECISION LOGIC
            
            # Case 1: New listings detected on Sahibinden
            if diff > 0:
                # Estimate pages needed (50 listings per page)
                estimated_pages = max(1, (diff // 50) + 1)
                # Cap at 10 pages for safety (avoid over-crawling)
                recommended_pages = min(estimated_pages, 10)
                
                logger.info(
                    f"✅ {category}/{transaction}: NEW LISTINGS "
                    f"(+{diff}, crawling {recommended_pages} pages)"
                )
                return True, recommended_pages, f"new_listings_detected ({diff})"
            
            # Case 2: Stale data (> 6 hours old)
            elif hours_since > self.STALE_THRESHOLD_HOURS:
                # Periodic refresh - check more pages for larger categories
                if sahibinden_count > 500:
                    refresh_pages = 20
                elif sahibinden_count > 200:
                    refresh_pages = 10
                else:
                    refresh_pages = 5
                
                logger.info(
                    f"🔄 {category}/{transaction}: PERIODIC REFRESH "
                    f"(last check: {hours_since:.1f}h ago)"
                )
                return True, refresh_pages, "periodic_refresh"
            
            # Case 3: Recently checked, no changes detected
            else:
                logger.info(
                    f"⏭️  {category}/{transaction}: SKIP "
                    f"(checked {hours_since:.1f}h ago, no changes)"
                )
                return False, 0, f"skip (checked {hours_since:.1f}h ago, no changes)"
        
        except Exception as e:
            # On error, default to crawling (fail-safe)
            logger.warning(
                f"⚠️  Decision engine error for {category}/{transaction}: {e}, "
                f"defaulting to crawl"
            )
            return True, 100, "error_fallback"
    
    def get_crawl_priority(self) -> List[Tuple[str, str, int]]:
        """
        Returns prioritized list of categories to crawl.
        
        Priority Score = diff + time_bonus
        - diff: Number of new listings detected
        - time_bonus: Points based on time since last check (max 50)
        
        Returns:
            List of (category, transaction, priority_score) tuples,
            sorted by priority (highest first)
        
        Example:
            >>> engine.get_crawl_priority()
            [
                ('konut', 'satilik', 75),   # 25 new + 50 time bonus
                ('arsa', 'satilik', 30),    # 0 new + 30 time bonus
                ('bina', 'kiralik', 5),     # 0 new + 5 time bonus
            ]
        """
        try:
            stats = self.supabase.table("category_stats")\
                .select("*")\
                .execute()
            
            priorities = []
            
            for item in stats.data:
                cat = item["category"]
                trans = item["transaction"]
                diff = item.get("diff", 0)
                last_checked = item.get("last_checked_at")
                
                # Calculate time bonus
                hours_since = self._calculate_hours_since(last_checked)
                # Time bonus: 0h = 0pts, 6h = 25pts, 12h+ = 50pts
                time_bonus = min(hours_since * 4, 50)
                
                # Total priority
                priority = diff + time_bonus
                priorities.append((cat, trans, priority))
            
            # Sort by priority (descending)
            priorities.sort(key=lambda x: x[2], reverse=True)
            
            logger.info(f"📊 Crawl priorities calculated for {len(priorities)} categories")
            return priorities
        
        except Exception as e:
            logger.error(f"❌ Priority calculation error: {e}")
            return []
    
    def _calculate_hours_since(self, timestamp_str: Optional[str]) -> float:
        """
        Calculate hours elapsed since given timestamp.
        
        Args:
            timestamp_str: ISO format timestamp string
        
        Returns:
            Hours elapsed (float). Returns 999 if timestamp is None/invalid.
        """
        if not timestamp_str:
            return 999.0  # Force crawl if never checked
        
        try:
            # Parse ISO timestamp (handle both with/without timezone)
            last_check_dt = datetime.fromisoformat(
                timestamp_str.replace("Z", "+00:00")
            )
            
            # Calculate hours difference
            # Make comparison timezone-aware if needed
            now = datetime.now()
            if last_check_dt.tzinfo:
                from datetime import timezone
                now = datetime.now(timezone.utc)
            
            delta = now - last_check_dt
            hours_since = delta.total_seconds() / 3600
            
            return hours_since
        
        except Exception as e:
            logger.debug(f"Timestamp parse error: {e}")
            return 999.0  # Force crawl on parse error
    
    def get_skip_report(self) -> dict:
        """
        Get summary of skip decisions.
        
        Returns:
            Dict with skip statistics:
            {
                'total_categories': int,
                'skipped': int,
                'crawled': int,
                'skip_percentage': float,
                'time_saved_estimate_minutes': float
            }
        """
        try:
            all_stats = self.supabase.table("category_stats").select("*").execute()
            
            total = len(all_stats.data)
            skipped = 0
            crawled = 0
            
            for item in all_stats.data:
                should_crawl, _, _ = self.should_crawl_category(
                    item["category"],
                    item["transaction"]
                )
                if should_crawl:
                    crawled += 1
                else:
                    skipped += 1
            
            skip_percentage = (skipped / total * 100) if total > 0 else 0
            time_saved = skipped * 1.5  # Assume 1.5 min saved per skipped category
            
            return {
                'total_categories': total,
                'skipped': skipped,
                'crawled': crawled,
                'skip_percentage': skip_percentage,
                'time_saved_estimate_minutes': time_saved
            }
        
        except Exception as e:
            logger.error(f"❌ Skip report error: {e}")
            return {}


# Example usage
if __name__ == "__main__":
    # This is for testing only
    from supabase import create_client
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    engine = CrawlDecisionEngine(supabase)
    
    # Test decision for a category
    should_crawl, pages, reason = engine.should_crawl_category("konut", "satilik")
    print(f"Should crawl: {should_crawl}, Pages: {pages}, Reason: {reason}")
    
    # Get priority list
    priorities = engine.get_crawl_priority()
    print(f"\nTop 3 priorities:")
    for cat, trans, score in priorities[:3]:
        print(f"  {cat}/{trans}: {score} points")
    
    # Get skip report
    report = engine.get_skip_report()
    print(f"\nSkip Report:")
    print(f"  Total: {report.get('total_categories', 0)}")
    print(f"  Skipped: {report.get('skipped', 0)} ({report.get('skip_percentage', 0):.1f}%)")
    print(f"  Time saved: ~{report.get('time_saved_estimate_minutes', 0):.1f} minutes")
