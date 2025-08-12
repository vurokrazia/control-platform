@echo off
echo Starting Cloudflare Tunnel for Arduino MQTT Dashboard...
echo.
echo Make sure you have:
echo 1. Installed cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
echo 2. Authenticated: cloudflared tunnel login
echo 3. Created tunnel: cloudflared tunnel create arduino-mqtt-dashboard
echo 4. Updated DNS records in Cloudflare dashboard
echo.
echo Starting tunnel...
cloudflared tunnel --config cloudflare-tunnel.yml run arduino-mqtt-dashboard