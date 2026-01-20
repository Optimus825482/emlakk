-- ============================================================================
-- FIX: RLS POLICY FOR PRICE_HISTORY
-- ============================================================================
-- Tarih: 2025-01-27
-- Amaç: Trigger'dan gelen insertlere izin vermek için RLS policy düzelt
-- Problem: 'new row violates row-level security policy for table "price_history"'
-- ============================================================================

-- ============================================================================
-- 1. MEVCUT POLICY'LERİ KALDIR
-- ============================================================================

DROP POLICY IF EXISTS "Admin write access" ON price_history;
DROP POLICY IF EXISTS "Public read access" ON price_history;
DROP POLICY IF EXISTS "Service role full access" ON price_history;
DROP POLICY IF EXISTS "Allow trigger inserts" ON price_history;

-- ============================================================================
-- 2. YENİ POLICY'LER OLUŞTUR
-- ============================================================================

-- Public read access (herkes okuyabilir)
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

-- ============================================================================
-- 3. TRIGGER FUNCTION'I GÜNCELLE (SECURITY DEFINER EKLE)
-- ============================================================================

-- Mevcut trigger'ı kaldır
DROP TRIGGER IF EXISTS trigger_log_price_change ON sahibinden_liste;

-- Function'ı güncelle (SECURITY DEFINER ekle)
CREATE OR REPLACE FUNCTION log_price_change()
RETURNS TRIGGER
SECURITY DEFINER -- Service role yetkisiyle çalışır, RLS'yi bypass eder
SET search_path = public
LANGUAGE plpgsql
AS $$
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
$$;

-- Trigger'ı yeniden oluştur
CREATE TRIGGER trigger_log_price_change
    AFTER UPDATE ON sahibinden_liste
    FOR EACH ROW
    WHEN (OLD.fiyat IS DISTINCT FROM NEW.fiyat)
    EXECUTE FUNCTION log_price_change();

-- ============================================================================
-- 4. VERIFICATION
-- ============================================================================

-- Policy'leri kontrol et
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'price_history'
ORDER BY policyname;

-- Function'ı kontrol et
SELECT 
    proname,
    prosecdef, -- SECURITY DEFINER mi?
    provolatile,
    prorettype::regtype
FROM pg_proc
WHERE proname = 'log_price_change';

-- ============================================================================
-- MIGRATION TAMAMLANDI
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'RLS POLICY FIX COMPLETED';
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ Eski policy''ler kaldırıldı';
    RAISE NOTICE '✅ Yeni policy''ler oluşturuldu';
    RAISE NOTICE '✅ Trigger function SECURITY DEFINER ile güncellendi';
    RAISE NOTICE '✅ Trigger yeniden oluşturuldu';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Test: Bir ilanın fiyatını güncelle ve price_history''yi kontrol et';
    RAISE NOTICE '============================================';
END $$;
