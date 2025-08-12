@echo off
echo Starting Frontend Tunnel (*.trycloudflare.com)
echo Frontend: http://localhost:5173
echo.
npx cloudflared tunnel --url http://localhost:5173