@echo off
title HLS Multi-Viewer
echo Starting HLS Multi-Viewer...
echo.
echo Choose an option:
echo 1. Open directly in browser (may have CORS issues)
echo 2. Start local HTTP server (recommended)
echo.
set /p choice="Enter your choice (1 or 2): "

if "%choice%"=="1" (
    echo Opening index.html in default browser...
    start index.html
) else if "%choice%"=="2" (
    echo Starting HTTP server on port 8000...
    echo.
    echo Server will be available at: http://localhost:8000
    echo Press Ctrl+C to stop the server
    echo.
    python -m http.server 8000
) else (
    echo Invalid choice. Please run the script again.
    pause
)
