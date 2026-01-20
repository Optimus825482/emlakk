-- ============================================================================
-- DATABASE FIXES & OPTIMIZATIONS
-- ============================================================================
-- Tarih: 2025-01-27
-- Amaç: Eksik tablo/kolonları ekle ve performans optimizasyonları yap
-- ============================================================================

-- ============================================================================
-- 1. EKSIK KOLONLAR
-- ============================================================================

-- mining_jobs.job_type kolonu ekle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mining_jobs' AND column_name = 'job_type'
    ) THEN
        ALTER TABLE mining_jobs 
        ADD COLUMN job_type VARCHAR(50);
        
        -- Mevcut kayıtları güncelle
        UPDATE mining_jobs 
        SET job_type = 'list_crawl' 
        WHERE job_type IS NULL;
        
        -- NOT NULL constraint ekle
        ALTER TABLE mining_jobs 
        ALTER COLUMN job_type SET NOT NULL;
        
        RAISE NOTICE 'mining_jobs.job_type kolonu eklendi';
    ELSE
        RAISE NOTICE 'mining_jobs.job_type kolonu zaten mevcut';
    END IF;
END $$;

-- ============================================================================
-- 2. EKSIK TABLOLAR
-- ============================================================================

-- price_history tablosu oluştur
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id BIGINT NOT NULL REFERENCES sahibinden_liste(id) ON DELETE CASCADE,
    old_price BIGINT,
    new_price BIGINT NOT NULL,
    change_amount BIGINT,
    change_percentage NUMERIC(5,2),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT price_history_change_amount_check 
        CHECK (change_amount = new_price - old_price),
    CONSTRAINT price_history_change_percentage_check 
        CHECK (change_percentage = ROUND(((new_price - old_price)::NUMERIC / NULLIF(old_price, 0)) * 100, 2))
);

-- RLS enable
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "Public read access" ON price_history
FOR SELECT USING (true);

-- Service role full access (crawler için)
CREATE POLICY "Service role full access" ON price_history
FOR ALL USING (
    auth.role() = 'service_role'
);

-- Trigger'dan gelen insertlere izin ver (SECURITY DEFINER ile çalışır)
CREATE POLICY "Allow trigger inserts" ON price_history
FOR INSERT WITH CHECK (true);

COMMENT ON TABLE price_history IS 'İlan fiyat değişiklik geçmişi';
COMMENT ON COLUMN price_history.listing_id IS 'İlan ID (sahibinden_liste.id)';
COMMENT ON COLUMN price_history.old_price IS 'Eski fiyat';
COMMENT ON COLUMN price_history.new_price IS 'Yeni fiyat';
COMMENT ON COLUMN price_history.change_amount IS 'Fiyat değişim miktarı (TL)';
COMMENT ON COLUMN price_history.change_percentage IS 'Fiyat değişim yüzdesi (%)';

-- ============================================================================
-- 3. INDEX'LER - PHASE 1: CRITICAL
-- ============================================================================

-- sahibinden_liste tablosu
CREATE INDEX IF NOT EXISTS idx_sahibinden_liste_category 
    ON sahibinden_liste(category);
    
CREATE INDEX IF NOT EXISTS idx_sahibinden_liste_transaction 
    ON sahibinden_liste(transaction);
    
CREATE INDEX IF NOT EXISTS idx_sahibinden_liste_crawled_at 
    ON sahibinden_liste(crawled_at DESC);
    
CREATE INDEX IF NOT EXISTS idx_sahibinden_liste_cat_trans 
    ON sahibinden_liste(category, transaction);

-- Detay çekilmemiş ilanlar için partial index
CREATE INDEX IF NOT EXISTS idx_sahibinden_liste_detay_pending 
    ON sahibinden_liste(id) 
    WHERE detay_cekildi IS NULL OR detay_cekildi = false;

-- mining_jobs tablosu
CREATE INDEX IF NOT EXISTS idx_mining_jobs_job_type 
    ON mining_jobs(job_type);
    
CREATE INDEX IF NOT EXISTS idx_mining_jobs_status 
    ON mining_jobs(status);
    
CREATE INDEX IF NOT EXISTS idx_mining_jobs_created_at 
    ON mining_jobs(created_at DESC);
    
CREATE INDEX IF NOT EXISTS idx_mining_jobs_status_type 
    ON mining_jobs(status, job_type);
    
CREATE INDEX IF NOT EXISTS idx_mining_jobs_source 
    ON mining_jobs(source);

-- mining_logs tablosu
CREATE INDEX IF NOT EXISTS idx_mining_logs_job_id 
    ON mining_logs(job_id);
    
CREATE INDEX IF NOT EXISTS idx_mining_logs_created_at 
    ON mining_logs(created_at DESC);
    
CREATE INDEX IF NOT EXISTS idx_mining_logs_level 
    ON mining_logs(level);
    
CREATE INDEX IF NOT EXISTS idx_mining_logs_job_created 
    ON mining_logs(job_id, created_at DESC);

-- price_history tablosu
CREATE INDEX IF NOT EXISTS idx_price_history_listing_id 
    ON price_history(listing_id);
    
CREATE INDEX IF NOT EXISTS idx_price_history_changed_at 
    ON price_history(changed_at DESC);
    
CREATE INDEX IF NOT EXISTS idx_price_history_listing_date 
    ON price_history(listing_id, changed_at DESC);

-- ============================================================================
-- 4. INDEX'LER - PHASE 2: ANALYTICS
-- ============================================================================

-- new_listings tablosu
CREATE INDEX IF NOT EXISTS idx_new_listings_first_seen 
    ON new_listings(first_seen_at DESC);
    
CREATE INDEX IF NOT EXISTS idx_new_listings_category 
    ON new_listings(category);
    
CREATE INDEX IF NOT EXISTS idx_new_listings_cat_date 
    ON new_listings(category, first_seen_at DESC);

-- listing_views tablosu
CREATE INDEX IF NOT EXISTS idx_listing_views_listing_id 
    ON listing_views(listing_id);
    
CREATE INDEX IF NOT EXISTS idx_listing_views_viewed_at 
    ON listing_views(viewed_at DESC);
    
CREATE INDEX IF NOT EXISTS idx_listing_views_visitor_id 
    ON listing_views(visitor_id);
    
CREATE INDEX IF NOT EXISTS idx_listing_views_listing_date 
    ON listing_views(listing_id, viewed_at DESC);

-- listing_daily_stats tablosu
CREATE INDEX IF NOT EXISTS idx_listing_daily_stats_listing_id 
    ON listing_daily_stats(listing_id);
    
CREATE INDEX IF NOT EXISTS idx_listing_daily_stats_date 
    ON listing_daily_stats(date DESC);
    
CREATE INDEX IF NOT EXISTS idx_listing_daily_stats_listing_date 
    ON listing_daily_stats(listing_id, date DESC);

-- ============================================================================
-- 5. VIEWS
-- ============================================================================

-- new_listings_stats view
CREATE OR REPLACE VIEW new_listings_stats AS
SELECT 
    category,
    transaction,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE first_seen_at >= NOW() - INTERVAL '24 hours') as last_24h,
    COUNT(*) FILTER (WHERE first_seen_at >= NOW() - INTERVAL '7 days') as last_7d,
    COUNT(*) FILTER (WHERE first_seen_at >= NOW() - INTERVAL '30 days') as last_30d,
    MIN(first_seen_at) as oldest_listing,
    MAX(first_seen_at) as newest_listing,
    AVG(fiyat) as avg_price,
    MIN(fiyat) as min_price,
    MAX(fiyat) as max_price
FROM new_listings
GROUP BY category, transaction;

COMMENT ON VIEW new_listings_stats IS 'Yeni ilan istatistikleri (kategori bazlı)';

-- ============================================================================
-- 6. MATERIALIZED VIEWS (OPTIONAL - Performance için)
-- ============================================================================

-- Category stats materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS category_stats AS
SELECT 
    category,
    transaction,
    COUNT(*) as total_listings,
    AVG(fiyat) as avg_price,
    MIN(fiyat) as min_price,
    MAX(fiyat) as max_price,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY fiyat) as median_price,
    COUNT(*) FILTER (WHERE crawled_at >= NOW() - INTERVAL '24 hours') as new_24h,
    COUNT(*) FILTER (WHERE crawled_at >= NOW() - INTERVAL '7 days') as new_7d,
    NOW() as last_updated
FROM sahibinden_liste
WHERE fiyat > 0
GROUP BY category, transaction;

-- Index for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_category_stats_cat_trans 
    ON category_stats(category, transaction);

COMMENT ON MATERIALIZED VIEW category_stats IS 'Kategori bazlı ilan istatistikleri (cache)';

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_category_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY category_stats;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_category_stats() IS 'category_stats materialized view''ı yenile';

-- ============================================================================
-- 7. VACUUM & ANALYZE
-- ============================================================================

-- Autovacuum ayarları
ALTER TABLE sahibinden_liste SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE listing_views SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE mining_logs SET (
    autovacuum_vacuum_scale_factor = 0.2,
    autovacuum_analyze_scale_factor = 0.1
);

-- Manuel analyze (ilk kez)
ANALYZE sahibinden_liste;
ANALYZE mining_jobs;
ANALYZE mining_logs;
ANALYZE new_listings;
ANALYZE listing_views;
ANALYZE listing_daily_stats;

-- ============================================================================
-- 8. HELPER FUNCTIONS
-- ============================================================================

-- Fiyat değişikliği kaydet
CREATE OR REPLACE FUNCTION log_price_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Sadece fiyat değiştiyse kaydet
    IF OLD.fiyat IS DISTINCT FROM NEW.fiyat THEN
        INSERT INTO price_history (
            listing_id,
            old_price,
            new_price,
            change_amount,
            change_percentage
        ) VALUES (
            NEW.id,
            OLD.fiyat,
            NEW.fiyat,
            NEW.fiyat - OLD.fiyat,
            ROUND(((NEW.fiyat - OLD.fiyat)::NUMERIC / NULLIF(OLD.fiyat, 0)) * 100, 2)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger oluştur
DROP TRIGGER IF EXISTS trigger_log_price_change ON sahibinden_liste;
CREATE TRIGGER trigger_log_price_change
    AFTER UPDATE ON sahibinden_liste
    FOR EACH ROW
    WHEN (OLD.fiyat IS DISTINCT FROM NEW.fiyat)
    EXECUTE FUNCTION log_price_change();

COMMENT ON FUNCTION log_price_change() IS 'İlan fiyat değişikliklerini otomatik kaydet';

-- ============================================================================
-- 9. STATISTICS
-- ============================================================================

-- İstatistik hedeflerini artır (daha iyi query planning)
ALTER TABLE sahibinden_liste ALTER COLUMN category SET STATISTICS 1000;
ALTER TABLE sahibinden_liste ALTER COLUMN transaction SET STATISTICS 1000;
ALTER TABLE sahibinden_liste ALTER COLUMN fiyat SET STATISTICS 1000;

ALTER TABLE mining_jobs ALTER COLUMN status SET STATISTICS 1000;
ALTER TABLE mining_jobs ALTER COLUMN job_type SET STATISTICS 1000;

ALTER TABLE listing_views ALTER COLUMN listing_id SET STATISTICS 1000;
ALTER TABLE listing_views ALTER COLUMN viewed_at SET STATISTICS 1000;

-- ============================================================================
-- 10. VERIFICATION
-- ============================================================================

-- Eksik kolonları kontrol et
DO $$
DECLARE
    missing_columns TEXT[];
BEGIN
    -- mining_jobs.job_type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mining_jobs' AND column_name = 'job_type'
    ) THEN
        missing_columns := array_append(missing_columns, 'mining_jobs.job_type');
    END IF;
    
    -- Sonuç
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE WARNING 'Eksik kolonlar: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ Tüm kolonlar mevcut';
    END IF;
END $$;

-- Eksik tabloları kontrol et
DO $$
DECLARE
    missing_tables TEXT[];
BEGIN
    -- price_history
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'price_history'
    ) THEN
        missing_tables := array_append(missing_tables, 'price_history');
    END IF;
    
    -- Sonuç
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE WARNING 'Eksik tablolar: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE '✅ Tüm tablolar mevcut';
    END IF;
END $$;

-- Index'leri kontrol et
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN (
        'sahibinden_liste', 
        'mining_jobs', 
        'mining_logs', 
        'price_history',
        'new_listings',
        'listing_views',
        'listing_daily_stats'
    )
ORDER BY tablename, indexname;

-- ============================================================================
-- MIGRATION TAMAMLANDI
-- ============================================================================

-- Özet rapor
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'DATABASE MIGRATION COMPLETED';
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ Eksik kolonlar eklendi';
    RAISE NOTICE '✅ Eksik tablolar oluşturuldu';
    RAISE NOTICE '✅ Index''ler eklendi';
    RAISE NOTICE '✅ View''lar oluşturuldu';
    RAISE NOTICE '✅ Materialized view''lar oluşturuldu';
    RAISE NOTICE '✅ Trigger''lar eklendi';
    RAISE NOTICE '✅ Performans optimizasyonları yapıldı';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Sonraki adım: REFRESH MATERIALIZED VIEW category_stats;';
    RAISE NOTICE '============================================';
END $$;
