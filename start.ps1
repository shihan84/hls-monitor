# HLS Multi-Viewer Launcher
Write-Host "HLS Multi-Viewer Launcher" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host ""

# Check if Python is available
$pythonAvailable = $false
try {
    $pythonVersion = python --version 2>$null
    if ($pythonVersion) {
        $pythonAvailable = $true
        Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Python not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "Choose an option:" -ForegroundColor Yellow
Write-Host "1. Open directly in browser (may have CORS issues)" -ForegroundColor White
Write-Host "2. Start local HTTP server (recommended)" -ForegroundColor White
Write-Host "3. Check system requirements" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1, 2, or 3)"

switch ($choice) {
    "1" {
        Write-Host "Opening index.html in default browser..." -ForegroundColor Cyan
        Start-Process "index.html"
        Write-Host "✓ Application opened!" -ForegroundColor Green
    }
    "2" {
        if ($pythonAvailable) {
            Write-Host "Starting HTTP server on port 8000..." -ForegroundColor Cyan
            Write-Host ""
            Write-Host "Server will be available at: http://localhost:8000" -ForegroundColor Green
            Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
            Write-Host ""
            python -m http.server 8000
        } else {
            Write-Host "✗ Python is required for HTTP server mode" -ForegroundColor Red
            Write-Host "Please install Python from https://python.org" -ForegroundColor Yellow
            Write-Host "Or choose option 1 to open directly in browser" -ForegroundColor Yellow
        }
    }
    "3" {
        Write-Host "System Requirements Check:" -ForegroundColor Cyan
        Write-Host "=========================" -ForegroundColor Cyan
        Write-Host ""
        
        # Check Python
        if ($pythonAvailable) {
            Write-Host "✓ Python: Available" -ForegroundColor Green
        } else {
            Write-Host "✗ Python: Not found (required for HTTP server)" -ForegroundColor Red
        }
        
        # Check if files exist
        $files = @("index.html", "styles.css", "script.js")
        foreach ($file in $files) {
            if (Test-Path $file) {
                        Write-Host "✓ ${file}: Found" -ForegroundColor Green
        } else {
            Write-Host "✗ ${file}: Missing" -ForegroundColor Red
            }
        }
        
        Write-Host ""
        Write-Host "Browser Compatibility:" -ForegroundColor Cyan
        Write-Host "- Chrome: Full support" -ForegroundColor Green
        Write-Host "- Firefox: Full support" -ForegroundColor Green
        Write-Host "- Edge: Full support" -ForegroundColor Green
        Write-Host "- Safari: Full support" -ForegroundColor Green
    }
    default {
        Write-Host "Invalid choice. Please run the script again." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
