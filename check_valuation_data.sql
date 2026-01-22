-- Değerleme Sistemi Veri Analizi

-- 1. Hendek'te kaç konut ilanı var?
SELECT COUNT(*) as total_listings
FROM sahibinden_liste
WHERE category = 'konut' 
  AND transaction = 'satilik'
  AND ilce LIKE '%Hendek%';

-- 2. Koordinatlı ilan oranı
SELECT 
  COUNT(*) as total,
  COUNT(koordinatlar) as with_coords,
  ROUND(COUNT(koordinatlar)::numeric / COUNT(*) * 100, 2) as coord_percentage
FROM sahibinden_liste
WHERE category = 'konut' 
  AND transaction = 'satilik'
  AND ilce LIKE '%Hendek%';

-- 3. Alan dağılımı (130 m² civarı)
SELECT 
  CASE 
    WHEN CAST(REGEXP_REPLACE(m2, '[^0-9]', '', 'g') AS INTEGER) BETWEEN 100 AND 160 THEN '100-160 m²'
    WHEN CAST(REGEXP_REPLACE(m2, '[^0-9]', '', 'g') AS INTEGER) BETWEEN 65 AND 195 THEN '65-195 m²'
    ELSE 'Diğer'
  END as area_range,
  COUNT(*) as count
FROM sahibinden_liste
WHERE category = 'konut' 
  AND transaction = 'satilik'
  AND ilce LIKE '%Hendek%'
  AND m2 IS NOT NULL
GROUP BY area_range;

-- 4. Fiyat dağılımı (outlier tespiti)
SELECT 
  MIN(CAST(fiyat AS BIGINT)) as min_price,
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY CAST(fiyat AS BIGINT)) as q1,
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY CAST(fiyat AS BIGINT)) as median,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY CAST(fiyat AS BIGINT)) as q3,
  MAX(CAST(fiyat AS BIGINT)) as max_price,
  AVG(CAST(fiyat AS BIGINT)) as avg_price
FROM sahibinden_liste
WHERE category = 'konut' 
  AND transaction = 'satilik'
  AND ilce LIKE '%Hendek%'
  AND fiyat IS NOT NULL;

-- 5. m² fiyat dağılımı
SELECT 
  ROUND(AVG(CAST(fiyat AS BIGINT) / CAST(REGEXP_REPLACE(m2, '[^0-9]', '', 'g') AS INTEGER))) as avg_price_per_m2,
  ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY CAST(fiyat AS BIGINT) / CAST(REGEXP_REPLACE(m2, '[^0-9]', '', 'g') AS INTEGER))) as median_price_per_m2,
  MIN(CAST(fiyat AS BIGINT) / CAST(REGEXP_REPLACE(m2, '[^0-9]', '', 'g') AS INTEGER)) as min_price_per_m2,
  MAX(CAST(fiyat AS BIGINT) / CAST(REGEXP_REPLACE(m2, '[^0-9]', '', 'g') AS INTEGER)) as max_price_per_m2
FROM sahibinden_liste
WHERE category = 'konut' 
  AND transaction = 'satilik'
  AND ilce LIKE '%Hendek%'
  AND fiyat IS NOT NULL
  AND m2 IS NOT NULL
  AND CAST(REGEXP_REPLACE(m2, '[^0-9]', '', 'g') AS INTEGER) > 0;

-- 6. En pahalı 10 ilan (outlier'lar)
SELECT 
  baslik,
  fiyat,
  m2,
  ROUND(CAST(fiyat AS BIGINT) / CAST(REGEXP_REPLACE(m2, '[^0-9]', '', 'g') AS INTEGER)) as price_per_m2,
  konum
FROM sahibinden_liste
WHERE category = 'konut' 
  AND transaction = 'satilik'
  AND ilce LIKE '%Hendek%'
  AND fiyat IS NOT NULL
  AND m2 IS NOT NULL
ORDER BY CAST(fiyat AS BIGINT) DESC
LIMIT 10;
