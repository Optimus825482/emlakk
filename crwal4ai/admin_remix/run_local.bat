@echo off
REM Local'de (Windows) crawler çalıştırma scripti
REM Erkan için hazırlandı - 21 Ocak 2026

echo ========================================
echo CRAWLER LOCAL CALISTIRMA
echo ========================================
echo.

REM .env.local dosyasını .env olarak kopyala (geçici)
echo [1/3] .env.local yukleniyor...
copy /Y .env.local .env.temp
if exist .env (
    del .env
)
ren .env.temp .env
echo ✓ .env.local aktif edildi
echo.

REM Python ve paketleri kontrol et
echo [2/3] Python kontrol ediliyor...
python --version
if errorlevel 1 (
    echo ❌ Python bulunamadi! Python 3.12+ yukleyin.
    pause
    exit /b 1
)
echo ✓ Python bulundu
echo.

REM Crawler'i calistir
echo [3/3] Crawler baslatiliyor...
echo.
echo Komut: python sahibinden_uc_batch_supabase.py --categories konut_satilik --max-pages 5
echo.
python sahibinden_uc_batch_supabase.py --categories konut_satilik --max-pages 5

echo.
echo ========================================
echo CRAWLER TAMAMLANDI
echo ========================================
echo.
echo Sonuclari gormek icin:
echo - Admin Panel: http://localhost:5000
echo - Database: pgAdmin ile 77.42.68.4:5432
echo.
pause
