import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

class ArduinoController {
  constructor() {
    this.port = null;
    this.parser = null;
    this.isConnected = false;
    this.lastData = null;
    this.dataBuffer = [];
    this.maxBufferSize = 100;
  }

  // Inicializar conexión con Arduino
  async init(portName, baudRate = 9600) {
    try {
      console.log(`Intentando conectar al puerto ${portName} a ${baudRate} baud...`);
      
      this.port = new SerialPort({
        path: portName,
        baudRate: baudRate,
        autoOpen: false
      });

      // Parser para leer líneas completas
      this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));

      // Abrir puerto
      await new Promise((resolve, reject) => {
        this.port.open((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Configurar eventos
      this.setupEventHandlers();
      
      this.isConnected = true;
      console.log(`✅ Conectado exitosamente al Arduino en ${portName}`);
      
      return { success: true, message: 'Conectado al Arduino' };
    } catch (error) {
      console.error('❌ Error conectando al Arduino:', error.message);
      return { success: false, error: error.message };
    }
  }

  setupEventHandlers() {
    // Manejar datos recibidos
    this.parser.on('data', (data) => {
      const cleanData = data.toString().trim();
      if (cleanData) {
        this.lastData = {
          data: cleanData,
          timestamp: new Date().toISOString()
        };
        
        // Agregar al buffer
        this.dataBuffer.push(this.lastData);
        if (this.dataBuffer.length > this.maxBufferSize) {
          this.dataBuffer.shift(); // Remover el más antiguo
        }
        
        console.log(`📨 Recibido de Arduino: ${cleanData}`);
      }
    });

    // Manejar errores
    this.port.on('error', (err) => {
      console.error('❌ Error en puerto serial:', err.message);
      this.isConnected = false;
    });

    // Manejar desconexión
    this.port.on('close', () => {
      console.log('🔌 Puerto serial cerrado');
      this.isConnected = false;
    });
  }

  // Enviar datos al Arduino
  async sendData(data) {
    try {
      if (!this.isConnected || !this.port) {
        throw new Error('Arduino no conectado');
      }

      const message = data.toString() + '\n';
      
      await new Promise((resolve, reject) => {
        this.port.write(message, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log(`📤 Enviado a Arduino: ${data}`);
      return { success: true, message: 'Datos enviados correctamente', sent: data };
    } catch (error) {
      console.error('❌ Error enviando datos:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Leer último dato recibido
  getLastData() {
    return {
      success: true,
      data: this.lastData,
      isConnected: this.isConnected
    };
  }

  // Obtener historial de datos
  getDataHistory(limit = 10) {
    const history = this.dataBuffer.slice(-limit);
    return {
      success: true,
      data: history,
      count: history.length,
      isConnected: this.isConnected
    };
  }

  // Obtener estado de conexión
  getStatus() {
    return {
      isConnected: this.isConnected,
      port: this.port?.path || null,
      baudRate: this.port?.baudRate || null,
      lastData: this.lastData,
      bufferSize: this.dataBuffer.length
    };
  }

  // Cerrar conexión
  async disconnect() {
    try {
      if (this.port && this.port.isOpen) {
        await new Promise((resolve) => {
          this.port.close(resolve);
        });
      }
      
      this.isConnected = false;
      console.log('🔌 Desconectado del Arduino');
      return { success: true, message: 'Desconectado correctamente' };
    } catch (error) {
      console.error('❌ Error desconectando:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Listar puertos disponibles
  static async listPorts() {
    try {
      const ports = await SerialPort.list();
      return {
        success: true,
        ports: ports.map(port => ({
          path: port.path,
          manufacturer: port.manufacturer,
          serialNumber: port.serialNumber,
          vendorId: port.vendorId,
          productId: port.productId
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default ArduinoController;
