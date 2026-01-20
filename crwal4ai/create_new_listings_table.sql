-- Yeni eklenen ilanları takip etmek için tablo
-- 2 gün boyunca "yeni" olarak işaretlenecek

CREATE TABLE IF NOT EXISTS new_listings (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL UNIQUE,
    baslik TEXT,
    link TEXT,
    fiyat BIGINT,
    konum TEXT,
    category TEXT NOT NULL,
    transaction TEXT NOT NULL,
    resim TEXT,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Foreign key (opsiyonel - eğer sahibinden_liste tablosu varsa)
    CONSTRAINT fk_listing FOREIGN KEY (listing_id) 
        REFERENCES sahibinden_liste(id) 
        ON DELETE CASCADE
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_new_listings_listing_id ON new_listings(listing_id);
CREATE INDEX IF NOT EXISTS idx_new_listings_category ON new_listings(category);
CREATE INDEX IF NOT EXISTS idx_new_listings_transaction ON new_listings(transaction);
CREATE INDEX IF NOT EXISTS idx_new_listings_first_seen ON new_listings(first_seen_at);
CREATE INDEX IF NOT EXISTS idx_new_listings_created ON new_listings(created_at);

-- Composite index - kategori ve tarih bazlı sorgular için
CREATE INDEX IF NOT EXISTS idx_new_listings_cat_date 
    ON new_listings(category, transaction, first_seen_at DESC);

-- View: Son 2 gündeki yeni ilanlar
CREATE OR REPLACE VIEW recent_new_listings AS
SELECT 
    nl.*,
    sl.crawled_at,
    EXTRACT(EPOCH FROM (NOW() - nl.first_seen_at)) / 3600 AS hours_since_added
FROM new_listings nl
LEFT JOIN sahibinden_liste sl ON nl.listing_id = sl.id
WHERE nl.first_seen_at >= NOW() - INTERVAL '2 days'
ORDER BY nl.first_seen_at DESC;

-- View: Kategori bazlı yeni ilan istatistikleri
CREATE OR REPLACE VIEW new_listings_stats AS
SELECT 
    category,
    transaction,
    COUNT(*) as total_new,
    COUNT(*) FILTER (WHERE first_seen_at >= NOW() - INTERVAL '24 hours') as last_24h,
    COUNT(*) FILTER (WHERE first_seen_at >= NOW() - INTERVAL '48 hours') as last_48h,
    MIN(first_seen_at) as oldest_new,
    MAX(first_seen_at) as newest_new
FROM new_listings
WHERE first_seen_at >= NOW() - INTERVAL '2 days'
GROUP BY category, transaction
ORDER BY category, transaction;

-- Function: 2 günden eski yeni ilanları temizle (otomatik cleanup)
CREATE OR REPLACE FUNCTION cleanup_old_new_listings()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM new_listings
    WHERE first_seen_at < NOW() - INTERVAL '2 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Her gün otomatik cleanup (pg_cron gerektirir - opsiyonel)
-- Eğer pg_cron extension'ı varsa:
-- SELECT cron.schedule('cleanup-old-new-listings', '0 3 * * *', 'SELECT cleanup_old_new_listings()');

COMMENT ON TABLE new_listings IS 'Yeni eklenen ilanları 2 gün boyunca takip eder';
COMMENT ON COLUMN new_listings.first_seen_at IS 'İlanın ilk kez görüldüğü tarih';
COMMENT ON VIEW recent_new_listings IS 'Son 2 gündeki yeni ilanlar';
COMMENT ON VIEW new_listings_stats IS 'Kategori bazlı yeni ilan istatistikleri';
COMMENT ON FUNCTION cleanup_old_new_listings IS '2 günden eski yeni ilanları temizler';
