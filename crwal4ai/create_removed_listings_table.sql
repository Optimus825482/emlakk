-- Kaldırılan İlanlar Tablosu
-- Sahibinden'den kaldırılan ilanları takip eder

CREATE TABLE IF NOT EXISTS removed_listings (
    id BIGSERIAL PRIMARY KEY,
    listing_id INTEGER NOT NULL, -- sahibinden_liste.id
    baslik VARCHAR(255),
    link VARCHAR(500),
    fiyat INTEGER,
    konum VARCHAR(255),
    category VARCHAR(50),
    transaction VARCHAR(50),
    resim VARCHAR(500),
    
    -- Kaldırılma bilgileri
    last_seen_at TIMESTAMPTZ, -- Son görüldüğü zaman
    removed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Kaldırıldığı tespit edildiği zaman
    removal_reason VARCHAR(100) DEFAULT 'not_found_in_crawl', -- 'not_found_in_crawl', 'manual', 'expired'
    
    -- İstatistikler
    days_active INTEGER, -- Kaç gün aktif kaldı
    price_changes INTEGER DEFAULT 0, -- Kaç kez fiyat değişti
    last_price INTEGER, -- Son fiyatı
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_removed_listings_listing_id ON removed_listings(listing_id);
CREATE INDEX IF NOT EXISTS idx_removed_listings_category ON removed_listings(category);
CREATE INDEX IF NOT EXISTS idx_removed_listings_removed_at ON removed_listings(removed_at DESC);
CREATE INDEX IF NOT EXISTS idx_removed_listings_days_active ON removed_listings(days_active DESC);

-- RLS (Row Level Security) - Public read
ALTER TABLE removed_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON removed_listings
    FOR SELECT USING (true);

CREATE POLICY "Allow service role all access" ON removed_listings
    FOR ALL USING (true);

-- View: Son 30 günde kaldırılan ilanlar
CREATE OR REPLACE VIEW recent_removed_listings AS
SELECT 
    rl.*,
    CASE 
        WHEN days_active <= 7 THEN 'quick_removal'
        WHEN days_active <= 30 THEN 'normal'
        WHEN days_active <= 90 THEN 'long_term'
        ELSE 'very_long_term'
    END as listing_duration_category
FROM removed_listings rl
WHERE removed_at >= NOW() - INTERVAL '30 days'
ORDER BY removed_at DESC;

-- View: Kategori bazında kaldırılma istatistikleri
CREATE OR REPLACE VIEW removed_listings_stats AS
SELECT 
    category,
    transaction,
    COUNT(*) as total_removed,
    AVG(days_active) as avg_days_active,
    AVG(last_price) as avg_price,
    MIN(removed_at) as first_removal,
    MAX(removed_at) as last_removal
FROM removed_listings
GROUP BY category, transaction
ORDER BY total_removed DESC;

COMMENT ON TABLE removed_listings IS 'Sahibinden''den kaldırılan ilanların geçmişi';
COMMENT ON COLUMN removed_listings.listing_id IS 'Orijinal ilan ID''si (sahibinden_liste.id)';
COMMENT ON COLUMN removed_listings.last_seen_at IS 'İlanın son görüldüğü tarih';
COMMENT ON COLUMN removed_listings.removed_at IS 'İlanın kaldırıldığının tespit edildiği tarih';
COMMENT ON COLUMN removed_listings.days_active IS 'İlanın kaç gün aktif kaldığı';
COMMENT ON COLUMN removed_listings.removal_reason IS 'Kaldırılma nedeni: not_found_in_crawl (crawl''da bulunamadı), manual (manuel), expired (süresi doldu)';
