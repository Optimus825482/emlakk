@echo off
echo Stopping existing dev server...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Starting dev server...
cd /d "%~dp0"
npm run dev
