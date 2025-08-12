@echo off
echo Cloudflare Tunnel Files Created:
echo.
echo 📁 tunnel-api.bat - Tunnel for API (port 3002)
echo 📁 tunnel-frontend.bat - Tunnel for Frontend (port 5173)
echo.
echo Usage:
echo 1. Start your servers first
echo 2. Run tunnel-api.bat in one terminal
echo 3. Run tunnel-frontend.bat in another terminal
echo.
echo Or use these commands directly:
echo   cloudflared tunnel --url http://localhost:3002
echo   cloudflared tunnel --url http://localhost:5173
pause