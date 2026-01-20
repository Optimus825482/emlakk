# PLAN: Sahibinden Crawler Optimization & Fix

## 🎯 Objective

Fix the broken "Live Comparison" feature, optimize database queries, and robustify the crawler architecture by moving scraping logic to the reliable Python service.

## 🛑 Current Issues

1.  **Fragile Scraping**: `sahibinden-counts` tries to scrape `sahibinden.com` directly from Next.js, which gets blocked (403/429).
2.  **Incorrect Stats**: `new-listings` and `removed-listings` calculate "last 24h" stats in-memory _after_ limiting results to 50. This yields incorrect numbers.
3.  **Inefficient DB**: API routes create new Supabase clients on every request.
4.  **Internal API Calls**: `live-comparison` calls `sahibinden-counts` via `fetch(localhost)`, adding latency and fragility.

## 🛠️ Architecture Changes

- **Mining API (Python)**: Add `/live-counts` endpoint to execute `get_category_counts.py` via Selenium (UC).
- **Next.js Backend**: Redirect `sahibinden-counts` to use Mining API.
- **Next.js Backend**: Implement Singleton Supabase client.
- **Next.js Backend**: Use SQL `count()` queries for accurate statistics.

## 📋 Implementation Tasks

### Phase 1: Python Backend (Mining API)

- [ ] **Modify `mining_api.py`**:
  - Add `POST /jobs/live-counts` endpoint.
  - Implement synchronous execution of `get_category_counts.py` (or wrapper).
  - Return structured JSON compatible with frontend needs.

### Phase 2: Next.js Backend Optimization

- [ ] **Create `src/lib/supabase/client.ts`**:
  - Implement Singleton pattern for Supabase client to reuse connections.
- [ ] **Refactor `sahibinden-counts/route.ts`**:
  - Call `http://localhost:8765/live-counts` instead of direct fetch.
  - Map response to expected format.
- [ ] **Refactor `live-comparison/route.ts`**:
  - Use Singleton DB client.
  - Simplify logic (remove huge `Promise.all` loop if API returns all data).
- [ ] **Fix `new-listings/route.ts` & `removed-listings/route.ts`**:
  - Remove in-memory filtering.
  - Use `count` queries (e.g. `head: true`) for accurate total/24h stats.

### Phase 3: Frontend Enhancement

- [ ] **Update `page.tsx`**:
  - Improve error handling for "Service Unavailable" (if Python API is down).
  - Add "Retry" mechanism for live counts specifically.

## 🧪 Verification

- `live-comparison` should return real numbers without 403 errors.
- "Last 24h" stats should match DB actuals, not just the first 50 items.
- No "Connection limit exceeded" errors from Supabase.
