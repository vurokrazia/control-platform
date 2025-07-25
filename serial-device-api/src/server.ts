import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { DatabaseConnection } from './infrastructure/database/connection';
import apiRoutes from './api';
import swaggerOptions from './config/swagger-config';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
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
    const dbConnection = DatabaseConnection.getInstance();
    await dbConnection.connect();
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor Arduino API ejecutándose en puerto ${PORT}`);
      console.log(`📡 Endpoints disponibles en http://localhost:${PORT}`);
      console.log(`🔧 Puerto Arduino configurado: ${process.env.ARDUINO_PORT || 'No configurado'}`);
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

startServer();

process.on('SIGTERM', async () => {
  console.log('🛑 Cerrando servidor...');
  try {
    const dbConnection = DatabaseConnection.getInstance();
    await dbConnection.disconnect();
  } catch (error) {
    console.error('Error cerrando conexión a BD:', error);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Cerrando servidor...');
  try {
    const dbConnection = DatabaseConnection.getInstance();
    await dbConnection.disconnect();
  } catch (error) {
    console.error('Error cerrando conexión a BD:', error);
  }
  process.exit(0);
});