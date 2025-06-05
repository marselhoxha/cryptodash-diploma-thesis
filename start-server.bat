@echo off
echo 🚀 Starting CryptoDash Local Server...
echo.
echo This will start a local HTTP server to avoid CORS issues.
echo The website will open automatically in your browser.
echo.
echo Press Ctrl+C to stop the server when done.
echo.
pause

REM Try Python 3 first
python -m http.server 8000
if %errorlevel% neq 0 (
    REM Try Python 2 if Python 3 fails
    python -m SimpleHTTPServer 8000
)

pause 