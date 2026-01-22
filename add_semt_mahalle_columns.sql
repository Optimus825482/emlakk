-- Sahibinden Liste - Semt ve Mahalle Sütunları Ekleme
-- =====================================================
-- Bu migration, konum verisini daha detaylı hale getirir:
-- konum (eski) -> semt + mahalle (yeni)

-- 1. Yeni sütunları ekle
ALTER TABLE sahibinden_liste 
ADD COLUMN IF NOT EXISTS semt VARCHAR(100),
ADD COLUMN IF NOT EXISTS mahalle VARCHAR(200);

-- 2. Index'ler ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_sahibinden_liste_semt ON sahibinden_liste(semt);
CREATE INDEX IF NOT EXISTS idx_sahibinden_liste_mahalle ON sahibinden_liste(mahalle);
CREATE INDEX IF NOT EXISTS idx_sahibinden_liste_ilce_semt ON sahibinden_liste(ilce, semt);

-- 3. Yorum ekle
COMMENT ON COLUMN sahibinden_liste.semt IS 'Semt/Bölge adı (Merkez, Köyler, İstiklal, vb.)';
COMMENT ON COLUMN sahibinden_liste.mahalle IS 'Mahalle adı (Yeni Mah., Kemaliye Mah., vb.)';

-- Not: konum sütunu şimdilik kalacak (backward compatibility için)
-- Gelecekte kaldırılabilir
