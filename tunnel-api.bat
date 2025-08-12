@echo off
echo Starting API Tunnel (*.trycloudflare.com)
echo API: http://localhost:3001
echo.
npx cloudflared tunnel --url http://localhost:3001