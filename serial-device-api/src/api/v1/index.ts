import express from 'express';
import devicesRoutes from './routes/devices';
import deviceDataRoutes from './routes/deviceData';
import commandsRoutes from './routes/commands';
import sessionsRoutes from './routes/sessions';
import serialPortsRoutes from './routes/serialPorts';
import mqttTopicsRoutes from './routes/mqttTopics';
import topicMessagesRoutes from './routes/topicMessages';
import authRoutes from './routes/auth';

const router = express.Router();

// Authentication routes (public access)
router.use('/auth', authRoutes);

// Mount RESTful resource routes
router.use('/devices', devicesRoutes);
router.use('/devices/:deviceId/data', deviceDataRoutes);
router.use('/devices/:deviceId/commands', commandsRoutes);
router.use('/devices/:deviceId/sessions', sessionsRoutes);
router.use('/serial-ports', serialPortsRoutes);
router.use('/mqtt-topics', mqttTopicsRoutes);
router.use('/topics/:topicId/topicMessages', topicMessagesRoutes);

// V1 API info endpoint
router.get('/', (_req, res) => {
  res.json({
    version: '1.0.0',
    namespace: 'v1',
    description: 'Control Platform Serial Device API v1',
    endpoints: {
      // Authentication
      'POST /api/v1/auth/register': 'Register new user',
      'POST /api/v1/auth/login': 'User login',
      'POST /api/v1/auth/logout': 'User logout',
      'GET /api/v1/auth/me': 'Get user profile',
      'POST /api/v1/auth/sessions/revoke': 'Revoke all user sessions',
      'POST /api/v1/auth/password/change': 'Change user password',
      
      // Device Management
      'GET /api/v1/devices': 'List all devices',
      'GET /api/v1/devices/{id}': 'Get device details',
      'POST /api/v1/devices/{id}/connect': 'Connect to device',
      'POST /api/v1/devices/{id}/disconnect': 'Disconnect device',
      'GET /api/v1/devices/{id}/status': 'Get device status',
      'PUT /api/v1/devices/{id}': 'Update device',
      'DELETE /api/v1/devices/{id}': 'Delete device',
      
      // Device Data
      'GET /api/v1/devices/{id}/data': 'Get device data',
      'POST /api/v1/devices/{id}/data': 'Send data to device',
      'GET /api/v1/devices/{id}/data/latest': 'Get latest data',
      'GET /api/v1/devices/{id}/data/stats': 'Get data statistics',
      
      // Commands
      'GET /api/v1/devices/{id}/commands': 'Get device commands',
      'POST /api/v1/devices/{id}/commands': 'Send command to device',
      'POST /api/v1/devices/{id}/commands/batch': 'Send multiple commands',
      'GET /api/v1/devices/{id}/commands/stats': 'Get command statistics',
      
      // Sessions
      'GET /api/v1/devices/{id}/sessions': 'Get device sessions',
      'GET /api/v1/devices/{id}/sessions/active': 'Get active session',
      'GET /api/v1/devices/{id}/sessions/today': 'Get todays session',
      'GET /api/v1/devices/{id}/sessions/stats': 'Get session statistics',
      
      // Serial Ports
      'GET /api/v1/serial-ports': 'List available serial ports'
    },
    features: [
      'JWT-based authentication',
      'Redis session management',
      'RESTful API design',
      'Multi-device support',
      'Resource-based endpoints',
      'Real-time serial communication',
      'MongoDB persistence',
      'MQTT integration',
      'Session tracking',
      'Command history',
      'Data analytics'
    ],
    documentation: '/docs/v1'
  });
});

export default router;