-- Tüm draft ilanları aktif yap
UPDATE listings 
SET status = 'active', 
    published_at = NOW()
WHERE status = 'draft';

-- Sonucu kontrol et
SELECT id, title, status, published_at 
FROM listings 
ORDER BY created_at DESC;
