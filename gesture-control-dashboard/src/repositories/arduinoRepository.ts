import axios from 'axios';

// Configuración base de axios
const API_BASE_URL = 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para logging
api.interceptors.request.use(
  (config) => {
    console.log(`🔄 Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Tipos
export interface Port {
  path: string;
  manufacturer?: string;
  serialNumber?: string;
  vendorId?: string;
  productId?: string;
}

export interface ArduinoStatus {
  isConnected: boolean;
  port: string | null;
  baudRate: number | null;
  lastData: {
    data: string;
    timestamp: string;
  } | null;
  bufferSize: number;
}

export interface ArduinoData {
  data: string;
  timestamp: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ArduinoRepository {
  // Listar puertos disponibles
  async getPorts(): Promise<Port[]> {
    try {
      const response = await api.get<ApiResponse<Port[]>>('/arduino/ports');
      
      if (response.data.success && response.data.ports) {
        return response.data.ports;
      }
      
      throw new Error(response.data.error || 'Error obteniendo puertos');
    } catch (error) {
      console.error('Error getting ports:', error);
      throw new Error(
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : 'Error de conexión al obtener puertos'
      );
    }
  }

  // Conectar al Arduino
  async connect(port: string, baudRate: number = 9600): Promise<string> {
    try {
      const response = await api.post<ApiResponse>('/arduino/connect', {
        port,
        baudRate,
      });

      if (response.data.success) {
        return response.data.message || 'Conectado exitosamente';
      }

      throw new Error(response.data.error || 'Error conectando al Arduino');
    } catch (error) {
      console.error('Error connecting:', error);
      throw new Error(
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : 'Error de conexión al conectar con Arduino'
      );
    }
  }

  // Desconectar del Arduino
  async disconnect(): Promise<string> {
    try {
      const response = await api.post<ApiResponse>('/arduino/disconnect');

      if (response.data.success) {
        return response.data.message || 'Desconectado exitosamente';
      }

      throw new Error(response.data.error || 'Error desconectando del Arduino');
    } catch (error) {
      console.error('Error disconnecting:', error);
      throw new Error(
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : 'Error de conexión al desconectar'
      );
    }
  }

  // Obtener estado de conexión
  async getStatus(): Promise<ArduinoStatus> {
    try {
      const response = await api.get<ApiResponse<{ status: ArduinoStatus }>>('/arduino/status');

      console.log('📊 Raw status response:', response.data);

      if (response.data.success && response.data.status) {
        console.log('📊 Parsed status:', response.data.status);
        return response.data.status;
      }

      throw new Error(response.data.error || 'Error obteniendo estado');
    } catch (error) {
      console.error('Error getting status:', error);
      throw new Error(
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : 'Error de conexión al obtener estado'
      );
    }
  }

  // Enviar datos al Arduino
  async sendData(data: string): Promise<string> {
    try {
      const response = await api.post<ApiResponse>('/arduino/send', { data });

      if (response.data.success) {
        return response.data.message || 'Datos enviados correctamente';
      }

      throw new Error(response.data.error || 'Error enviando datos');
    } catch (error) {
      console.error('Error sending data:', error);
      throw new Error(
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : 'Error de conexión al enviar datos'
      );
    }
  }

  // Leer último dato recibido
  async readData(): Promise<ArduinoData | null> {
    try {
      const response = await api.get<ApiResponse<ArduinoData>>('/arduino/read');

      if (response.data.success) {
        return response.data.data || null;
      }

      throw new Error(response.data.error || 'Error leyendo datos');
    } catch (error) {
      console.error('Error reading data:', error);
      throw new Error(
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : 'Error de conexión al leer datos'
      );
    }
  }

  // Obtener historial de datos
  async getHistory(limit: number = 10): Promise<ArduinoData[]> {
    try {
      const response = await api.get<ApiResponse<ArduinoData[]>>(
        `/arduino/history?limit=${limit}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.error || 'Error obteniendo historial');
    } catch (error) {
      console.error('Error getting history:', error);
      throw new Error(
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : 'Error de conexión al obtener historial'
      );
    }
  }

  // Enviar comando específico
  async sendCommand(command: string, value?: string | number): Promise<string> {
    try {
      const response = await api.post<ApiResponse>('/arduino/command', {
        command,
        value,
      });

      if (response.data.success) {
        return response.data.message || 'Comando enviado correctamente';
      }

      throw new Error(response.data.error || 'Error enviando comando');
    } catch (error) {
      console.error('Error sending command:', error);
      throw new Error(
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : 'Error de conexión al enviar comando'
      );
    }
  }

  // Verificar si el servidor está disponible
  async checkConnection(): Promise<boolean> {
    try {
      const response = await api.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('Server not available:', error);
      return false;
    }
  }
}

// Exportar instancia singleton
export const arduinoRepository = new ArduinoRepository();
export default ArduinoRepository;