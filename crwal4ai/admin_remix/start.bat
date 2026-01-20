@echo off
echo ========================================
echo Sahibinden Crawler Admin Panel
echo ========================================
echo.

REM Virtual environment kontrol
if not exist "venv\" (
    echo [!] Virtual environment bulunamadi!
    echo [*] Olusturuluyor...
    python -m venv venv
    echo [+] Virtual environment olusturuldu
    echo.
)

REM Virtual environment aktif et
echo [*] Virtual environment aktif ediliyor...
call venv\Scripts\activate.bat

REM Dependencies kontrol ve yukle
echo [*] Dependencies kontrol ediliyor...
pip install -q -r requirements.txt

echo.
echo ========================================
echo [+] Admin Panel Baslatiliyor...
echo ========================================
echo.
echo URL: http://localhost:5001
echo.
echo Durdurmak icin: Ctrl+C
echo ========================================
echo.

REM Flask uygulamasini baslat
python app.py

pause
