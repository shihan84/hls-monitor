@echo off
title ITAssist HLS Multiviewer with Telegram Notifications
echo ========================================================
echo ITAssist HLS Multiviewer with Telegram Notifications
echo ========================================================
echo.

echo Checking Python dependencies...
pip install -r requirements.txt >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing Python dependencies...
    pip install flask flask-cors requests
)

echo.
echo Starting Telegram Notification Relay...
echo This will run on http://localhost:3001
echo.
start "Telegram Relay" cmd /k "python telegram_notify.py"

echo.
echo Waiting 3 seconds for relay to start...
timeout /t 3 /nobreak >nul

echo.
echo Starting Web Server...
echo This will run on http://localhost:8000
echo.
start "Web Server" cmd /k "python -m http.server 8000"

echo.
echo ========================================================
echo Both services are starting...
echo.
echo Web App: http://localhost:8000
echo Telegram Relay: http://localhost:3001
echo.
echo To test notifications:
echo 1. Open Telegram and send a message to your bot
echo 2. Open the web app and click "Test" button
echo 3. You should receive a test message on Telegram
echo.
echo Press any key to open the web app...
pause >nul
start http://localhost:8000

echo.
echo Services are running. Close this window to stop everything.
pause
