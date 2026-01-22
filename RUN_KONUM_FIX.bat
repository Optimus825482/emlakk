@echo off
REM Konum Field Fixer - Quick Start Script
REM Windows için hızlı başlatma scripti

echo ======================================================================
echo Konum Field Fixer - Quick Start
echo ======================================================================
echo.

REM Python kontrolü
python --version >nul 2>&1
if errorlevel 1 (
    echo [HATA] Python bulunamadi! Lutfen Python yukleyin.
    pause
    exit /b 1
)

echo [OK] Python bulundu
echo.

REM Gerekli paketleri kontrol et
echo Gerekli paketler kontrol ediliyor...
pip show psycopg2-binary >nul 2>&1
if errorlevel 1 (
    echo [UYARI] psycopg2-binary bulunamadi, yukleniyor...
    pip install psycopg2-binary python-dotenv
)

pip show python-dotenv >nul 2>&1
if errorlevel 1 (
    echo [UYARI] python-dotenv bulunamadi, yukleniyor...
    pip install python-dotenv
)

echo [OK] Tum paketler hazir
echo.

REM .env kontrolü
if not exist .env (
    echo [HATA] .env dosyasi bulunamadi!
    echo Lutfen .env dosyasini olusturun ve DATABASE_URL ekleyin
    pause
    exit /b 1
)

echo [OK] .env dosyasi bulundu
echo.

REM Kullanıcıya seçenek sun
echo ======================================================================
echo Ne yapmak istiyorsunuz?
echo ======================================================================
echo.
echo 1. TEST MODU (Dry-Run) - Sadece goster, guncelleme yapma
echo 2. GERCEK GUNCELLEME - 6000+ kayit guncellenecek
echo 3. Iptal
echo.
set /p choice="Seciminiz (1/2/3): "

if "%choice%"=="1" (
    echo.
    echo [TEST MODU] Baslatiiliyor...
    echo.
    python fix_konum_field.py
) else if "%choice%"=="2" (
    echo.
    echo [UYARI] GERCEK GUNCELLEME MODU!
    echo.
    echo Script icinde DRY_RUN = False yapmaniz gerekiyor!
    echo.
    echo Adimlar:
    echo 1. fix_konum_field.py dosyasini acin
    echo 2. DRY_RUN = True satirini DRY_RUN = False yapin
    echo 3. Kaydedin ve bu scripti tekrar calistirin
    echo.
    pause
) else (
    echo.
    echo Islem iptal edildi
)

echo.
pause
