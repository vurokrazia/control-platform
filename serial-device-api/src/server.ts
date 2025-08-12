import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { DatabaseConnection } from './infrastructure/database/connection';
import { RedisClient } from './infrastructure/cache/redis-client';
import apiRoutes from './api';
import swaggerOptions from './config/swagger-config';
import { mqttServiceInstance } from './shared/MqttServiceInstance';
import { MqttTopicRepository } from './infrastructure/database/repositories/MqttTopicRepository';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize MQTT topic repository
const mqttTopicRepository = new MqttTopicRepository();

app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000',
    /^https:\/\/.*\.trycloudflare\.com$/
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Generate Swagger specs
const specs = swaggerJsdoc(swaggerOptions);

// Swagger UI setup
app.use('/docs/v1', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Control Platform API v1 Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true
  }
}));

// Serve raw OpenAPI spec
app.get('/docs/v1/openapi.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

app.use('/api', apiRoutes);

app.get('/', (_req: Request, res: Response) => {
  res.json({ 
    message: 'Control Platform Serial Device API Server', 
    version: '1.0.0',
    api: {
      baseUrl: '/api',
      currentVersion: 'v1',
      versionsAvailable: ['v1']
    },
    endpoints: {
      'GET /api': 'API information and versions',
      'GET /api/v1': 'v1 API endpoints',
      'GET /health': 'Server health check',
      'GET /docs/v1': 'Interactive API documentation (Swagger UI)',
      'GET /docs/v1/openapi.json': 'Raw OpenAPI specification'
    },
    quickStart: {
      listPorts: 'GET /api/v1/arduino/ports',
      connect: 'POST /api/v1/arduino/connect/:deviceId',
      send: 'POST /api/v1/arduino/send/:deviceId',
      status: 'GET /api/v1/arduino/status'
    }
  });
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint no encontrado' 
  });
});

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error no manejado:', error);
  res.status(500).json({ 
    success: false, 
    error: 'Error interno del servidor' 
  });
});

async function startServer() {
  try {
    // Connect to MongoDB
    const dbConnection = DatabaseConnection.getInstance();
    await dbConnection.connect();
    console.log('✅ MongoDB connected successfully');
    
    // Connect to Redis (optional for demo)
    try {
      const redisClient = RedisClient.getInstance();
      await redisClient.connect();
      console.log('✅ Redis connected successfully');
    } catch (error) {
      console.log('⚠️  Redis connection failed - authentication will use fallback mode');
      console.log('💡 For full session management, set up Redis using:');
      console.log('   - Upstash: https://upstash.com/');
      console.log('   - Docker: docker run -d -p 6379:6379 redis:alpine');
    }
    
    // Load and subscribe to MQTT topics from database
    const topics = await mqttTopicRepository.findAll();
    const topicNames = topics.map(topic => topic.name);
    
    if (topicNames.length > 0) {
      mqttServiceInstance.subscribeToTopics(topicNames);
      console.log(`📨 MQTT subscriptions loaded from database: ${topicNames.join(', ')}`);
    } else {
      console.log('📭 No MQTT topics found in database');
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Arduino MQTT Control Platform API running on port ${PORT}`);
      console.log(`📡 API endpoints available at http://localhost:${PORT}`);
      console.log(`📚 Documentation available at http://localhost:${PORT}/docs/v1`);
      console.log(`🔐 Authentication system enabled`);
      console.log(`🗄️  Session management with Redis enabled`);
      console.log(`🔧 Arduino port configured: ${process.env.ARDUINO_PORT || 'Not configured'}`);
    });
  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
}

startServer();

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down server...');
  try {
    // Disconnect MQTT
    mqttServiceInstance.disconnect();
    
    // Disconnect Redis (if connected)
    try {
      const redisClient = RedisClient.getInstance();
      if (redisClient.isClientConnected()) {
        await redisClient.disconnect();
        console.log('✅ Redis disconnected');
      }
    } catch (error) {
      // Redis was not connected, ignore
    }
    
    // Disconnect MongoDB
    const dbConnection = DatabaseConnection.getInstance();
    await dbConnection.disconnect();
    console.log('✅ MongoDB disconnected');
  } catch (error) {
    console.error('Error closing connections:', error);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Shutting down server...');
  try {
    // Disconnect MQTT
    mqttServiceInstance.disconnect();
    
    // Disconnect Redis (if connected)
    try {
      const redisClient = RedisClient.getInstance();
      if (redisClient.isClientConnected()) {
        await redisClient.disconnect();
        console.log('✅ Redis disconnected');
      }
    } catch (error) {
      // Redis was not connected, ignore
    }
    
    // Disconnect MongoDB
    const dbConnection = DatabaseConnection.getInstance();
    await dbConnection.disconnect();
    console.log('✅ MongoDB disconnected');
  } catch (error) {
    console.error('Error closing connections:', error);
  }
  process.exit(0);
});