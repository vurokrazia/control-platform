@echo off
echo Starting Arduino MQTT Dashboard - Full Stack
echo.

REM Start API server
echo [1/3] Starting API server on port 3002...
cd serial-device-api
start "API Server" cmd /k "npm run dev"
cd ..

REM Wait a moment for API to start
timeout /t 3 /nobreak > nul

REM Start Frontend
echo [2/3] Starting Frontend on port 5173...
cd gesture-control-dashboard
start "Frontend" cmd /k "npm run dev"
cd ..

REM Wait a moment for frontend to start
timeout /t 3 /nobreak > nul

REM Start Cloudflare Tunnel
echo [3/3] Starting Cloudflare Tunnel...
echo Make sure you have configured cloudflared first!
start "Cloudflare Tunnel" cmd /k "cloudflared tunnel --config cloudflare-tunnel.yml run arduino-mqtt-dashboard"

echo.
echo All services started!
echo - API: http://localhost:3002
echo - Frontend: http://localhost:5173
echo - Public URLs: Check your Cloudflare dashboard
pause