import express from 'express';
import ArduinoController from '../controllers/arduinoController.js';

const router = express.Router();

// Instancia global del controlador
let arduinoController = new ArduinoController();

// GET /arduino/ports - Listar puertos disponibles
router.get('/ports', async (req, res) => {
  try {
    const result = await ArduinoController.listPorts();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /arduino/connect - Conectar al Arduino
router.post('/connect', async (req, res) => {
  try {
    const { port, baudRate = 9600 } = req.body;
    
    if (!port) {
      return res.status(400).json({ 
        success: false, 
        error: 'Puerto requerido' 
      });
    }

    // Si ya está conectado, desconectar primero
    if (arduinoController.isConnected) {
      await arduinoController.disconnect();
    }

    const result = await arduinoController.init(port, parseInt(baudRate));
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /arduino/disconnect - Desconectar del Arduino
router.post('/disconnect', async (req, res) => {
  try {
    const result = await arduinoController.disconnect();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /arduino/status - Estado de la conexión
router.get('/status', (req, res) => {
  try {
    const status = arduinoController.getStatus();
    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /arduino/send - Enviar datos al Arduino
router.post('/send', async (req, res) => {
  try {
    const { data } = req.body;
    
    if (data === undefined || data === null) {
      return res.status(400).json({ 
        success: false, 
        error: 'Datos requeridos' 
      });
    }

    const result = await arduinoController.sendData(data);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /arduino/read - Leer último dato recibido
router.get('/read', (req, res) => {
  try {
    const result = arduinoController.getLastData();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /arduino/history - Historial de datos recibidos
router.get('/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const result = arduinoController.getDataHistory(limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /arduino/command - Enviar comandos específicos
router.post('/command', async (req, res) => {
  try {
    const { command, value } = req.body;
    
    if (!command) {
      return res.status(400).json({ 
        success: false, 
        error: 'Comando requerido' 
      });
    }

    // Formatear comando
    const commandString = value !== undefined ? `${command}:${value}` : command;
    const result = await arduinoController.sendData(commandString);
    
    if (result.success) {
      res.json({ ...result, command: commandString });
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
