
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import arduinoRoutes from './routes/arduino.js';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Vite y CRA
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rutas
app.use('/arduino', arduinoRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: 'Arduino API Server', 
    version: '1.0.0',
    endpoints: {
      'GET /arduino/ports': 'Listar puertos disponibles',
      'POST /arduino/connect': 'Conectar al Arduino',
      'POST /arduino/disconnect': 'Desconectar del Arduino',
      'GET /arduino/status': 'Estado de conexión',
      'POST /arduino/send': 'Enviar datos al Arduino',
      'GET /arduino/read': 'Leer último dato',
      'GET /arduino/history': 'Historial de datos',
      'POST /arduino/command': 'Enviar comando específico'
    }
  });
});

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint no encontrado' 
  });
});

// Manejo global de errores
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  res.status(500).json({ 
    success: false, 
    error: 'Error interno del servidor' 
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor Arduino API ejecutándose en puerto ${PORT}`);
  console.log(`📡 Endpoints disponibles en http://localhost:${PORT}`);
  console.log(`🔧 Puerto Arduino configurado: ${process.env.ARDUINO_PORT || 'No configurado'}`);
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('🛑 Cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Cerrando servidor...');
  process.exit(0);
});
