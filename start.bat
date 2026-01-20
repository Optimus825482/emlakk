@echo off
echo Starting Demir Gayrimenkul Services...

start "Next.js Frontend" cmd /k "npm run dev"
timeout /t 2 /nobreak >nul

start "Python API" cmd /k "cd social-media\demir_crew\src\demir_crew && python api_server.py"

echo All services started!
pause