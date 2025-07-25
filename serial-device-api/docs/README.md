# Control Platform Serial Device API v1 Documentation

## Overview
This documentation provides comprehensive information about the Control Platform Serial Device API v1, which enables communication with Arduino devices through serial connections.

## Features
- 🔌 **Multi-device Support**: Connect multiple Arduino devices simultaneously
- 📡 **Real-time Communication**: Send and receive data in real-time
- 💾 **Data Persistence**: MongoDB integration for session and command history
- 📊 **Session Tracking**: Automatic daily usage tracking
- 🔄 **Connection Management**: Robust connection handling with auto-cleanup
- 📈 **Status Monitoring**: Real-time device status and health monitoring

## Quick Start

### 1. Start the Server
```bash
npm run dev
```

### 2. Access Documentation
- **Interactive Docs**: http://localhost:3001/docs/v1
- **Raw OpenAPI Spec**: http://localhost:3001/docs/v1/openapi.json
- **API Info**: http://localhost:3001/api/v1

### 3. Basic Workflow

#### Connect to Arduino
```bash
curl -X POST http://localhost:3001/api/v1/arduino/connect/arduino1 \
  -H "Content-Type: application/json" \
  -d '{"port": "/dev/cu.usbmodem14101", "baudRate": 9600}'
```

#### Send Data
```bash
curl -X POST http://localhost:3001/api/v1/arduino/send/arduino1 \
  -H "Content-Type: application/json" \
  -d '{"data": "LED_ON"}'
```

#### Check Status
```bash
curl http://localhost:3001/api/v1/arduino/status/arduino1
```

#### Disconnect
```bash
curl -X POST http://localhost:3001/api/v1/arduino/disconnect/arduino1
```

## API Endpoints

### Core Endpoints
- `GET /arduino/ports` - List available serial ports
- `POST /arduino/connect/{deviceId}` - Connect to Arduino
- `POST /arduino/disconnect/{deviceId}` - Disconnect Arduino
- `GET /arduino/status/{deviceId}` - Get device status
- `POST /arduino/send/{deviceId}` - Send data to Arduino

### Data Endpoints
- `GET /arduino/read/{deviceId}` - Read last received data
- `GET /arduino/history/{deviceId}` - Get data history
- `POST /arduino/command/{deviceId}` - Send formatted command

### Management Endpoints
- `GET /arduino/status` - Get all devices status
- `POST /arduino/disconnect-all` - Disconnect all devices
- `GET /arduino/device-history/{deviceId}` - Get complete device history

## Examples

### Multiple Device Management
```bash
# Connect multiple Arduinos
curl -X POST localhost:3001/api/v1/arduino/connect/workshop_arduino \
  -d '{"port": "/dev/cu.usbmodem14101"}'

curl -X POST localhost:3001/api/v1/arduino/connect/lab_arduino \
  -d '{"port": "/dev/cu.usbmodem14102"}'

# Control them independently
curl -X POST localhost:3001/api/v1/arduino/send/workshop_arduino \
  -d '{"data": "LED_ON"}'

curl -X POST localhost:3001/api/v1/arduino/send/lab_arduino \
  -d '{"data": "SERVO_90"}'
```

### Command Examples
```bash
# LED Control
curl -X POST localhost:3001/api/v1/arduino/command/arduino1 \
  -d '{"command": "LED", "value": "ON"}'

# Servo Control
curl -X POST localhost:3001/api/v1/arduino/command/arduino1 \
  -d '{"command": "SERVO", "value": 90}'

# Simple Command
curl -X POST localhost:3001/api/v1/arduino/command/arduino1 \
  -d '{"command": "RESET"}'
```

## Response Format

All responses include versioning information:
```json
{
  "success": true,
  "data": {...},
  "apiVersion": "1.0.0",
  "namespace": "v1"
}
```

## Error Handling

### Common Error Codes
- `400 Bad Request` - Missing required parameters
- `404 Not Found` - Device not connected
- `500 Internal Server Error` - Server or device error

### Error Response Format
```json
{
  "success": false,
  "error": "Device arduino1 not connected",
  "apiVersion": "1.0.0",
  "namespace": "v1"
}
```

## Database Integration

The API automatically tracks:
- **Device Sessions**: Daily usage sessions
- **Command History**: All commands sent to devices
- **Data History**: Incoming/outgoing serial data
- **Connection Statistics**: Connection duration and frequency

## Development

### Testing
Use the Swagger UI at `/docs/v1` to test all endpoints interactively.

### Postman Collection
Export the OpenAPI spec to create a Postman collection:
```bash
curl http://localhost:3001/docs/v1/openapi.json > openapi.json
```

### SDK Generation
Use the OpenAPI spec to generate client SDKs in various languages.

## Support

- **GitHub**: https://github.com/your-repo/control-platform
- **Issues**: https://github.com/your-repo/control-platform/issues
- **Documentation**: http://localhost:3001/docs/v1