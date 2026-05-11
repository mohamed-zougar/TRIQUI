@echo off
echo ========================================
echo TriQI+ Installation ^& Startup
echo ========================================
echo.

REM Check if Node.js is installed
node -v >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

echo [1/4] Installing Backend dependencies...
cd TRIBACK
if not exist node_modules (
    call npm install
) else (
    echo Backend dependencies already installed.
)
cd ..
echo.

echo [2/4] Installing Frontend dependencies...
cd TRIFRONT
if not exist node_modules (
    call npm install
) else (
    echo Frontend dependencies already installed.
)
cd ..
echo.

echo [3/4] Starting Backend Server...
start cmd /k "cd TRIBACK && npm run dev"
timeout /t 2 /nobreak

echo [4/4] Starting Frontend Server...
start cmd /k "cd TRIFRONT && npx next dev --hostname 0.0.0.0"
echo.

REM Get IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4 Address"') do (
    set "IP=%%a"
    goto found_ip
)
:found_ip
set "IP=%IP: =%"

echo ========================================
echo Servers starting...
echo.
echo Frontend:
echo   - Localhost: http://localhost:3000
echo   - Network: http://%IP%:3000
echo.
echo Backend:
echo   - Localhost: http://localhost:5000/api
echo   - Network: http://%IP%:5000/api
echo ========================================
echo.
pause
