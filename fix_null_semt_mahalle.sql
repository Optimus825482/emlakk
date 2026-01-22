-- Semt ve Mahalle NULL Değerlerini Düzelt
-- ==========================================
-- Kural 1: Semt NULL ise → İlçe adını kopyala
-- Kural 2: Mahalle NULL ise → Semt adını kopyala

-- 1. Semt NULL olanları düzelt (İlçe adını kopyala)
UPDATE sahibinden_liste
SET semt = ilce
WHERE semt IS NULL 
AND ilce IS NOT NULL;

-- 2. Mahalle NULL olanları düzelt (Semt adını kopyala)
UPDATE sahibinden_liste
SET mahalle = semt
WHERE mahalle IS NULL 
AND semt IS NOT NULL;

-- Sonuç kontrolü
SELECT 
    COUNT(*) FILTER (WHERE semt IS NULL) as semt_null_count,
    COUNT(*) FILTER (WHERE mahalle IS NULL) as mahalle_null_count,
    COUNT(*) FILTER (WHERE semt IS NOT NULL AND mahalle IS NOT NULL) as both_filled_count,
    COUNT(*) as total_count
FROM sahibinden_liste
WHERE konum IS NOT NULL;
