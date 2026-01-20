# 🚀 Crawler Performance Optimization Plan (C+E Hybrid)

**Created:** 2026-01-19 23:20  
**Strategy:** Low-Risk, High-Impact  
**Target:** 10 dk → 3-4 dk (60-70% improvement)  
**Effort:** 10-12 hours  
**Risk Level:** 🟢 LOW

---

## 📊 Executive Summary

This plan combines **Hybrid Optimizations (Option C)** and **Delta Sync Strategy (Option E)** to achieve significant performance gains without architectural rewrites.

### Key Metrics

| Metric                 | Before     | After     | Improvement |
| ---------------------- | ---------- | --------- | ----------- |
| **Avg Crawl Time**     | 10 min     | 3-4 min   | **60-70%**  |
| **Unnecessary Crawls** | 100%       | ~30%      | **-70%**    |
| **Page Load Time**     | 3 sec      | 1 sec     | **66%**     |
| **DB Insert Speed**    | 50/batch   | 200/batch | **4x**      |
| **Network I/O**        | Sequential | Optimized | **~40%**    |

---

## 🎯 Optimization Components

### **PART 1: Smart Pagination (Option C.1)**

**Impact:** 🔥🔥🔥 High  
**Effort:** ⏱️ 2 hours  
**Risk:** 🟢 Low

**Problem:**

- Current: Every page = new `driver.get(url)` → full page load (~3 sec)
- Sahibinden has AJAX pagination via JavaScript

**Solution:**

```python
# Instead of: driver.get(f"{base_url}&pagingOffset={offset}")
# Do: Click "next" button via JavaScript

def goto_next_page(self) -> bool:
    """Navigate to next page using JavaScript (faster than HTTP request)"""
    try:
        # Method 1: Click next button
        next_button = self.driver.find_element(By.CSS_SELECTOR, 'a.prevNextBut:not(.prev)')
        if next_button:
            self.driver.execute_script("arguments[0].click();", next_button)
            time.sleep(1)  # 3s → 1s (DOM already loaded)
            return True
        return False
    except:
        return False
```

**Files to Modify:**

- `sahibinden_smart_crawler.py` (line 478-485)
- `sahibinden_uc_batch_supabase.py` (similar logic)

**Expected Gain:** ~2 sec per page × 50 pages = **100 seconds (~1.7 min) per category**

---

### **PART 2: Batch Size Optimization (Option C.3)**

**Impact:** 🔥🔥 Medium  
**Effort:** ⏱️ 1 hour  
**Risk:** 🟢 Low

**Problem:**

- Current batch size: 50 listings
- Supabase limit: 1000 per request
- Network overhead dominates small batches

**Solution:**

```python
# Before
BATCH_SIZE = 50

# After
BATCH_SIZE = 200  # 4x larger batches

# Also: Implement progressive batching
def get_optimal_batch_size(listing_count: int) -> int:
    """Dynamic batch sizing based on volume"""
    if listing_count < 100:
        return 50
    elif listing_count < 500:
        return 100
    else:
        return 200
```

**Files to Modify:**

- `sahibinden_smart_crawler.py` (line 365-426)
- Add constant: `BATCH_SIZE_SMALL = 50, BATCH_SIZE_MEDIUM = 100, BATCH_SIZE_LARGE = 200`

**Expected Gain:** ~0.5 sec per batch × ~20 batches = **10 seconds per category**

---

### **PART 3: Database Connection Pooling (Option C.2)**

**Impact:** 🔥 Low-Medium  
**Effort:** ⏱️ 2 hours  
**Risk:** 🟢 Low

**Problem:**

- Each Supabase operation may open new connections
- No connection reuse strategy

**Solution:**

```python
# Add connection pooling configuration
from supabase import create_client, ClientOptions
from httpx import Limits

# In __init__
def _init_supabase(self):
    limits = Limits(
        max_connections=10,
        max_keepalive_connections=5
    )

    options = ClientOptions(
        postgrest_client_timeout=30,
        storage_client_timeout=30,
        schema="public",
    )

    self.supabase = create_client(
        SUPABASE_URL,
        SUPABASE_KEY,
        options=options
    )

    # Reuse client instance - no recreation
    logger.info("✅ Supabase with connection pooling initialized")
```

**Files to Modify:**

- `sahibinden_smart_crawler.py` (line 192-198)
- `sahibinden_uc_batch_supabase.py` (similar)

**Expected Gain:** ~5-10 sec per category (reduced handshake overhead)

---

### **PART 4: Delta Sync Strategy (Option E)**

**Impact:** 🔥🔥🔥🔥 CRITICAL  
**Effort:** ⏱️ 5-6 hours  
**Risk:** 🟡 Medium

**Problem:**

- Crawler processes ALL categories regardless of change status
- 70% of categories have 0 new listings most of the time
- Wastes ~7 minutes on unchanged categories

**Solution: Smart Crawl Decision Engine**

```python
class CrawlDecisionEngine:
    """Determines which categories need crawling based on stats"""

    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def should_crawl_category(
        self,
        category: str,
        transaction: str
    ) -> tuple[bool, int, str]:
        """
        Returns: (should_crawl, max_pages, reason)

        Logic:
        1. If diff > 0 in category_stats → CRAWL (new listings detected)
        2. If last_checked > 6 hours ago → FULL CRAWL
        3. If last_checked < 6 hours and diff == 0 → SKIP
        4. If category never crawled → FULL CRAWL
        """
        try:
            # Get category stats
            result = self.supabase.table("category_stats")\
                .select("*")\
                .eq("category", category)\
                .eq("transaction", transaction)\
                .execute()

            if not result.data:
                # Never crawled - do full crawl
                return True, 100, "first_crawl"

            stats = result.data[0]
            diff = stats.get("diff", 0)
            last_checked = stats.get("last_checked_at")

            # Parse last check time
            if last_checked:
                last_check_dt = datetime.fromisoformat(last_checked.replace("Z", "+00:00"))
                hours_since = (datetime.now() - last_check_dt).total_seconds() / 3600
            else:
                hours_since = 999  # Force crawl

            # Decision Logic
            if diff > 0:
                # New listings detected on Sahibinden
                estimated_pages = max(1, (diff // 50) + 1)
                return True, min(estimated_pages, 10), f"new_listings_detected ({diff})"

            elif hours_since > 6:
                # Stale data - do periodic refresh
                return True, 20, "periodic_refresh"

            else:
                # Recently checked, no changes
                return False, 0, f"skip (checked {hours_since:.1f}h ago, no changes)"

        except Exception as e:
            logger.warning(f"Decision engine error: {e}, defaulting to crawl")
            return True, 100, "error_fallback"

    def get_crawl_priority(self) -> list[tuple[str, str, int]]:
        """
        Returns prioritized list of (category, transaction, priority_score)
        Higher score = crawl first
        """
        try:
            stats = self.supabase.table("category_stats")\
                .select("*")\
                .order("diff", desc=True)\
                .execute()

            priorities = []
            for item in stats.data:
                cat = item["category"]
                trans = item["transaction"]
                diff = item.get("diff", 0)

                # Priority = diff + time factor
                last_checked = item.get("last_checked_at")
                if last_checked:
                    last_check_dt = datetime.fromisoformat(last_checked.replace("Z", "+00:00"))
                    hours_since = (datetime.now() - last_check_dt).total_seconds() / 3600
                    time_bonus = min(hours_since * 2, 50)  # Max 50 points
                else:
                    time_bonus = 100  # Never checked

                priority = diff + time_bonus
                priorities.append((cat, trans, priority))

            # Sort by priority descending
            priorities.sort(key=lambda x: x[2], reverse=True)
            return priorities

        except Exception as e:
            logger.error(f"Priority calculation error: {e}")
            return []
```

**Integration in Crawler:**

```python
class SmartSahibindenCrawler:
    def __init__(self, job_id: Optional[str] = None):
        # ... existing init ...
        self.decision_engine = CrawlDecisionEngine(self.supabase)

    def crawl(self, categories: List[str], max_pages: int = 100, force: bool = False):
        """
        Enhanced crawl with smart decision engine

        Args:
            force: If True, bypass decision engine and crawl all
        """
        self.stats["started_at"] = datetime.now().isoformat()

        try:
            self._init_driver()

            # Build category list with decisions
            crawl_plan = []

            for cat_key in categories:
                if cat_key not in HENDEK_CATEGORIES:
                    logger.warning(f"⚠️ Unknown category: {cat_key}")
                    continue

                cat_info = HENDEK_CATEGORIES[cat_key]
                category = cat_info["category"]
                transaction = cat_info["transaction"]

                if force:
                    should_crawl, pages, reason = True, max_pages, "forced"
                else:
                    should_crawl, pages, reason = self.decision_engine.should_crawl_category(
                        category, transaction
                    )

                if should_crawl:
                    crawl_plan.append({
                        "key": cat_key,
                        "category": category,
                        "transaction": transaction,
                        "max_pages": pages,
                        "reason": reason
                    })
                    logger.info(f"✅ {cat_key}: CRAWL ({reason}, max {pages} pages)")
                else:
                    logger.info(f"⏭️ {cat_key}: SKIP ({reason})")
                    self.stats["categories_skipped"] = self.stats.get("categories_skipped", 0) + 1

            # Execute crawl plan
            logger.info(f"\n📋 Crawl Plan: {len(crawl_plan)}/{len(categories)} categories")

            for plan_item in crawl_plan:
                cat_stats = self._crawl_category(
                    plan_item["key"],
                    max_pages=plan_item["max_pages"]
                )

                # ... existing stats tracking ...

            # ... rest of method ...
```

**Files to Create:**

- `crawl_decision_engine.py` (new file, 200 lines)

**Files to Modify:**

- `sahibinden_smart_crawler.py` (line 548-594)
- Add `--force` flag to argparse

**Expected Gain:** Skip ~5 categories × ~2 min each = **~10 minutes saved**

---

### **PART 5: Early Exit Optimization**

**Impact:** 🔥 Low  
**Effort:** ⏱️ 1 hour  
**Risk:** 🟢 Low

**Problem:**

- Current: 3 consecutive old pages → stop
- Better: Dynamic threshold based on category size

**Solution:**

```python
def get_early_exit_threshold(self, total_listings: int) -> int:
    """Calculate optimal early exit threshold"""
    if total_listings < 50:
        return 1  # Small category: exit after 1 old page
    elif total_listings < 200:
        return 2
    else:
        return 3  # Large category: exit after 3 old pages
```

**Files to Modify:**

- `sahibinden_smart_crawler.py` (line 476, 522-525)

**Expected Gain:** ~30 sec per category (marginal)

---

## 📁 Implementation Checklist

### Phase A: Quick Wins (4 hours)

- [ ] **A1**: Implement Smart Pagination (Part 1)
  - [ ] Add `goto_next_page()` method
  - [ ] Replace `driver.get()` with JS click in loop
  - [ ] Test on single category
  - [ ] Verify no missed pages

- [ ] **A2**: Batch Size Optimization (Part 2)
  - [ ] Change `BATCH_SIZE` constant
  - [ ] Add dynamic batch sizing
  - [ ] Test with 200-item batch
  - [ ] Check Supabase logs for errors

- [ ] **A3**: Early Exit Optimization (Part 5)
  - [ ] Add `get_early_exit_threshold()`
  - [ ] Update consecutive old pages logic
  - [ ] Test on small/large categories

### Phase B: Database Optimization (2 hours)

- [ ] **B1**: Connection Pooling (Part 3)
  - [ ] Update `_init_supabase()` method
  - [ ] Add httpx Limits config
  - [ ] Test connection reuse
  - [ ] Monitor connection count

### Phase C: Delta Sync (5-6 hours)

- [ ] **C1**: Create Decision Engine
  - [ ] Create `crawl_decision_engine.py`
  - [ ] Implement `CrawlDecisionEngine` class
  - [ ] Add `should_crawl_category()` logic
  - [ ] Add `get_crawl_priority()` method
  - [ ] Unit tests for decision logic

- [ ] **C2**: Integrate Decision Engine
  - [ ] Import in `sahibinden_smart_crawler.py`
  - [ ] Update `crawl()` method signature (add `force` param)
  - [ ] Build crawl plan before execution
  - [ ] Add skip tracking to stats
  - [ ] Update argparse (add `--force` flag)

- [ ] **C3**: Admin Panel Integration
  - [ ] Update `app.py` crawler start endpoint
  - [ ] Add "Force Full Crawl" checkbox in UI
  - [ ] Display skip reasons in job stats
  - [ ] Show crawl plan in logs

### Phase D: Testing & Validation (2 hours)

- [ ] **D1**: Unit Tests
  - [ ] Test decision engine logic
  - [ ] Test batch sizing logic
  - [ ] Test pagination navigation

- [ ] **D2**: Integration Tests
  - [ ] Run full crawl with optimizations
  - [ ] Measure time per category
  - [ ] Compare before/after stats
  - [ ] Verify data accuracy (no missing listings)

- [ ] **D3**: Performance Profiling
  - [ ] Add timing logs for each optimization
  - [ ] Measure network I/O reduction
  - [ ] Confirm 60-70% improvement

---

## 🧪 Testing Strategy

### Test Cases

| Test ID | Description                        | Expected Result                           |
| ------- | ---------------------------------- | ----------------------------------------- |
| TC-01   | **Pagination Test**                | Next page loads in <1.5s (vs 3s before)   |
| TC-02   | **Batch Insert Test**              | 200 listings save without error           |
| TC-03   | **Decision Engine - New Listings** | Category with diff>0 gets crawled         |
| TC-04   | **Decision Engine - No Change**    | Category checked <6h ago gets skipped     |
| TC-05   | **Decision Engine - Stale**        | Category checked >6h ago gets crawled     |
| TC-06   | **Force Flag**                     | `--force` bypasses decision engine        |
| TC-07   | **End-to-End**                     | Full 7-category crawl completes in <5 min |

### Performance Benchmarks

**Before Optimizations:**

```
Category: konut_satilik
- Pages: 10
- Time: ~2 min
- Listings: 500

Total (7 categories): ~10-12 min
```

**After Optimizations (Expected):**

```
Category: konut_satilik
- Pages: 10
- Time: ~1 min (smart pagination)
- Listings: 500

Skipped: 5 categories (no changes)
Crawled: 2 categories
Total: ~3-4 min (60-70% improvement)
```

---

## 🚨 Risk Mitigation

| Risk                                   | Impact | Mitigation                             |
| -------------------------------------- | ------ | -------------------------------------- |
| **Pagination JS fails**                | High   | Fallback to HTTP `driver.get()`        |
| **Large batch fails**                  | Medium | Progressive retry with smaller batches |
| **Decision engine bug**                | High   | Add `--force` flag to bypass           |
| **Category stats desync**              | Medium | Periodic full refresh (every 24h)      |
| **Supabase connection pool exhausted** | Low    | Monitor pool size, adjust limits       |

---

## 📊 Success Metrics

### Must Have (P0)

- ✅ Total crawl time reduced by ≥50%
- ✅ No data loss (all listings captured)
- ✅ Zero new errors/exceptions

### Should Have (P1)

- ✅ 60-70% time reduction
- ✅ Skip ≥60% of unchanged categories
- ✅ Admin panel shows crawl plan

### Nice to Have (P2)

- ✅ ≥70% time reduction
- ✅ Dynamic batch sizing works perfectly
- ✅ Performance dashboard in admin

---

## 📝 Code Files Summary

### New Files (1)

| File                       | Lines | Purpose                   |
| -------------------------- | ----- | ------------------------- |
| `crawl_decision_engine.py` | ~200  | Delta sync decision logic |

### Modified Files (3)

| File                              | Changes                               | Lines Modified |
| --------------------------------- | ------------------------------------- | -------------- |
| `sahibinden_smart_crawler.py`     | Pagination, batching, decision engine | ~150           |
| `sahibinden_uc_batch_supabase.py` | Similar optimizations                 | ~100           |
| `admin_remix/app.py`              | Force flag, UI updates                | ~20            |

**Total Code Change:** ~470 lines  
**Complexity:** Medium  
**Reversibility:** High (all changes can be feature-flagged)

---

## 🎯 Deployment Plan

### Day 1 (4 hours)

```bash
# Morning: Quick wins
git checkout -b feature/crawler-optimization-phase-a
# Implement Part 1, 2, 5
python sahibinden_smart_crawler.py --categories konut_satilik --max-pages 10
# Verify results
git commit -m "feat: add pagination optimization and batch sizing"
```

### Day 2 (6 hours)

```bash
# Morning: Delta sync
git checkout -b feature/crawler-optimization-phase-c
# Implement Part 4 (decision engine)
# Write unit tests
pytest tests/test_decision_engine.py
git commit -m "feat: add delta sync decision engine"

# Afternoon: Integration
# Update crawler to use decision engine
# Test full crawl
python sahibinden_smart_crawler.py --categories konut_satilik arsa_satilik
git commit -m "feat: integrate decision engine into crawler"
```

### Day 3 (2 hours)

```bash
# Testing & Polish
# Run full benchmark
./benchmark_crawler.sh
# Update admin panel
# Merge to main
git merge feature/crawler-optimization-phase-c
```

---

## 📈 Expected Results

### Timeline

- **Week 1:** Deploy to staging, validate
- **Week 2:** Monitor production, fine-tune thresholds
- **Week 3:** Measure performance over 7 days

### KPIs

| Metric             | Baseline | Target  | Actual (TBD) |
| ------------------ | -------- | ------- | ------------ |
| Avg Crawl Time     | 10 min   | 3-4 min | \_\_\_       |
| Categories Skipped | 0%       | 60-70%  | \_\_\_       |
| Page Load Time     | 3 sec    | 1 sec   | \_\_\_       |
| DB Operations/sec  | 1        | 4       | \_\_\_       |
| Error Rate         | <1%      | <1%     | \_\_\_       |

---

## 🔄 Future Enhancements (Out of Scope)

If this implementation succeeds, consider:

1. **Option A**: Multi-process parallel crawling (5x speedup)
2. **Option B**: Async Playwright migration (7x speedup)
3. **Intelligent Scheduling**: Crawl high-traffic categories during off-peak hours
4. **ML-Based Prediction**: Predict which categories will have new listings

---

**PLAN STATUS:** ⏸️ **AWAITING USER APPROVAL**

Onaylıyor musunuz? (Y/N)

- ✅ **Y**: Implementation başlatılır (backend-specialist + performance-optimizer + test-engineer)
- ❌ **N**: Planı revize edeyim
