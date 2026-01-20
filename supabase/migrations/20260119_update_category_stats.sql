-- Category Stats tablosuna transaction kolonu ekle
-- Her kategori + transaction kombinasyonu için ayrı kayıt tutulacak

-- Önce unique constraint'i kaldır
DROP INDEX IF EXISTS idx_category_stats_unique_category;

-- Transaction kolonu ekle
ALTER TABLE category_stats 
ADD COLUMN IF NOT EXISTS transaction VARCHAR(20) NOT NULL DEFAULT 'satilik';

-- Yeni unique constraint - category + transaction
CREATE UNIQUE INDEX IF NOT EXISTS idx_category_stats_unique_cat_trans 
ON category_stats(category, transaction);

-- Index güncelle
CREATE INDEX IF NOT EXISTS idx_category_stats_cat_trans ON category_stats(category, transaction);

COMMENT ON COLUMN category_stats.transaction IS 'İşlem tipi: satilik, kiralik';
