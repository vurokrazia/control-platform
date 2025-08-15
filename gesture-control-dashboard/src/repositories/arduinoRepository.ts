import axios from 'axios';
import { API_BASE_URL } from '../constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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
      const response = await api.get<ApiResponse<Port[]>>('/v1/serial-ports');
      
      if (response.data.success && response.data.data) {
        return response.data.data;
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
  async connect(port: string, baudRate: number = 9600): Promise<{ message: string; deviceId: string }> {
    try {
      // Generate a unique device ID based on port and timestamp
      const deviceId = `device-${port.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}`;
      
      const response = await api.post<ApiResponse<{ deviceId: string; port: string; baudRate: number }>>(`/v1/devices/${deviceId}/connect`, {
        port,
        baudRate,
      });

      if (response.data.success && response.data.data) {
        return {
          message: response.data.message || 'Conectado exitosamente',
          deviceId: response.data.data.deviceId
        };
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
  async disconnect(deviceId: string): Promise<string> {
    try {
      const response = await api.post<ApiResponse>(`/v1/devices/${deviceId}/disconnect`);

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
  async getStatus(deviceId: string): Promise<ArduinoStatus> {
    try {
      const response = await api.get<ApiResponse<{ status: ArduinoStatus }>>(`/v1/devices/${deviceId}/status`);

      console.log('📊 Raw status response:', response.data);

      if (response.data.success && response.data.data) {
        console.log('📊 Parsed status:', response.data.data.status);
        return response.data.data.status;
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
  async sendData(deviceId: string, data: string): Promise<string> {
    try {
      const response = await api.post<ApiResponse>(`/v1/devices/${deviceId}/data`, { data });

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
  async readData(deviceId: string): Promise<ArduinoData | null> {
    try {
      const response = await api.get<ApiResponse<ArduinoData>>(`/v1/devices/${deviceId}/data/latest`);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return null;
    } catch (error) {
      console.error('Error reading data:', error);
      throw new Error(
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : 'Error de conexión al leer datos'
      );
    }
  }


  // Verificar si el servidor está disponible
  async checkConnection(): Promise<boolean> {
    try {
      const response = await api.get('/v1/');
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