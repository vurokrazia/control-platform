# Cloudflare Tunnel Setup for Arduino MQTT Dashboard

This guide will help you expose both the API and frontend publicly using Cloudflare Tunnel.

## Two Options Available

### 🚀 Quick Start (No Domain Required)
Use free `*.trycloudflare.com` subdomains - **RECOMMENDED for testing**

### 🏢 Custom Domain (Domain Required)  
Use your own domain with custom subdomains

## Prerequisites

### For Quick Start (Option 1):
- **cloudflared**: Install Cloudflare tunnel client only

### For Custom Domain (Option 2):
1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Domain**: Add your domain to Cloudflare (free plan works)  
3. **cloudflared**: Install Cloudflare tunnel client

## Installation Steps

### 1. Install cloudflared

Download and install from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

Or using package managers:
```bash
# Windows (using Chocolatey)
choco install cloudflared

# Windows (using Scoop)
scoop install cloudflared
```

### 2. Authenticate with Cloudflare

```bash
cloudflared tunnel login
```
This opens your browser to authenticate with Cloudflare.

### 3. Create a Tunnel

```bash
cloudflared tunnel create arduino-mqtt-dashboard
```
This creates a tunnel and generates credentials.

### 4. Update DNS Records

Add these DNS records in your Cloudflare dashboard:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | api-arduino | [tunnel-id].cfargotunnel.com | ✅ Proxied |
| CNAME | frontend-arduino | [tunnel-id].cfargotunnel.com | ✅ Proxied |

Replace `[tunnel-id]` with your actual tunnel ID from step 3.

### 5. Update Configuration

Edit `cloudflare-tunnel.yml` and replace:
- `your-domain.com` with your actual domain
- Update the credentials file path if needed

### 6. Start Services

**🚀 QUICK START (No Domain):**
```bash
start-quick-tunnel.bat
```

**🏢 CUSTOM DOMAIN:**
```bash
start-all.bat
```

**Manual start:**
```bash
# Quick tunnels (free subdomains)
cloudflared tunnel --url http://localhost:3002
cloudflared tunnel --url http://localhost:5173

# Named tunnel (custom domain)
cloudflared tunnel --config cloudflare-tunnel.yml run arduino-mqtt-dashboard
```

## URLs

After setup, your services will be available at:
- **API**: `https://api-arduino.your-domain.com`
- **Frontend**: `https://frontend-arduino.your-domain.com`
- **Local API**: `http://localhost:3002`
- **Local Frontend**: `http://localhost:5173`

## Configuration Files

- `cloudflare-tunnel.yml`: Tunnel configuration
- `start-tunnel.bat`: Start tunnel only
- `start-all.bat`: Start API + Frontend + Tunnel

## Troubleshooting

1. **Tunnel not starting**: Check credentials file path in config
2. **DNS not resolving**: Wait up to 5 minutes for DNS propagation
3. **Service not accessible**: Ensure local services are running first
4. **Port conflicts**: Check if ports 3002 and 5173 are available

## Security Notes

- Tunnel automatically handles SSL/TLS certificates
- All traffic is encrypted between your server and Cloudflare
- No need to open firewall ports
- Consider adding Cloudflare Access for additional security