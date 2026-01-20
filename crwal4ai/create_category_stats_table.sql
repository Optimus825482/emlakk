-- Kategori İstatistikleri Tablosu
-- Sahibinden'deki kategori sayılarını ve güncelleme tarihlerini saklar

CREATE TABLE IF NOT EXISTS category_stats (
    id BIGSERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    sahibinden_count INTEGER NOT NULL DEFAULT 0,
    database_count INTEGER NOT NULL DEFAULT 0,
    diff INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'synced', -- 'new', 'removed', 'synced'
    last_checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_category_stats_category ON category_stats(category);
CREATE INDEX IF NOT EXISTS idx_category_stats_last_checked ON category_stats(last_checked_at DESC);

-- Unique constraint - her kategori için sadece 1 kayıt
CREATE UNIQUE INDEX IF NOT EXISTS idx_category_stats_unique_category ON category_stats(category);

-- RLS (Row Level Security) - Public read
ALTER TABLE category_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON category_stats
    FOR SELECT USING (true);

CREATE POLICY "Allow service role all access" ON category_stats
    FOR ALL USING (true);

-- Trigger - updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_category_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_category_stats_updated_at
    BEFORE UPDATE ON category_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_category_stats_updated_at();

COMMENT ON TABLE category_stats IS 'Sahibinden kategori sayıları ve veritabanı karşılaştırması';
COMMENT ON COLUMN category_stats.category IS 'Kategori adı (konut, arsa, isyeri, bina)';
COMMENT ON COLUMN category_stats.sahibinden_count IS 'Sahibinden.com''daki ilan sayısı';
COMMENT ON COLUMN category_stats.database_count IS 'Veritabanımızdaki ilan sayısı';
COMMENT ON COLUMN category_stats.diff IS 'Fark (sahibinden - database)';
COMMENT ON COLUMN category_stats.status IS 'Durum: new (yeni ilanlar var), removed (ilanlar kaldırılmış), synced (senkron)';
COMMENT ON COLUMN category_stats.last_checked_at IS 'Son kontrol zamanı';
