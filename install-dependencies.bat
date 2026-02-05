@echo off
echo Installing all project dependencies...
echo.

echo [1/4] Installing Python dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo Error installing Python dependencies
    pause
    exit /b 1
)
echo.

echo [2/4] Installing pii-scanner-ts dependencies...
cd pii-scanner-ts
npm install
if errorlevel 1 (
    echo Error installing pii-scanner-ts dependencies
    cd ..
    pause
    exit /b 1
)
cd ..
echo.

echo [3/4] Installing calssify dependencies...
cd calssify
npm install
if errorlevel 1 (
    echo Error installing calssify dependencies
    cd ..
    pause
    exit /b 1
)
cd ..
echo.

echo [4/4] Installing backend dependencies...
cd backend
npm install
if errorlevel 1 (
    echo Error installing backend dependencies
    cd ..
    pause
    exit /b 1
)
cd ..
echo.

echo All dependencies installed successfully!
pause
