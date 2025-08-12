import axios from 'axios';
import { API_BASE_URL } from '../constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptors for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🔄 Devices Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Devices Request error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ Devices Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Devices Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Types
export interface Device {
  _id?: string;
  deviceId: string;
  name: string;
  type: string;
  serialPort?: {
    path: string;
    manufacturer?: string;
    serialNumber?: string;
    vendorId?: string;
    productId?: string;
    baudRate: number;
  };
  status: {
    isConnected: boolean;
    lastConnected?: Date;
    bufferSize: number;
  };
  statusHistory: {
    totalConnections: number;
    totalDisconnections: number;
    totalUptime: number;
    lastStatusChange: Date;
    averageConnectionDuration: number;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

class DevicesRepository {
  // Get all devices
  async getAllDevices(): Promise<Device[]> {
    try {
      const response = await api.get<ApiResponse<Device[]>>('/v1/devices');
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.error || 'Error getting devices');
    } catch (error) {
      console.error('Error getting devices:', error);
      throw new Error(
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : 'Connection error when getting devices'
      );
    }
  }

  // Get device by ID
  async getDevice(deviceId: string): Promise<Device> {
    try {
      const response = await api.get<ApiResponse<Device>>(`/v1/devices/${deviceId}`);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.error || 'Error getting device');
    } catch (error) {
      console.error('Error getting device:', error);
      throw new Error(
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : 'Connection error when getting device'
      );
    }
  }

  // Create new device
  async createDevice(deviceData: {
    name: string;
    type?: string;
    port?: string;
    baudRate?: number;
  }): Promise<Device> {
    try {
      const response = await api.post<ApiResponse<Device>>('/v1/devices', deviceData);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.error || 'Error creating device');
    } catch (error) {
      console.error('Error creating device:', error);
      throw new Error(
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : 'Connection error when creating device'
      );
    }
  }

  // Check if devices API is available
  async checkConnection(): Promise<boolean> {
    try {
      const response = await api.get('/v1/devices');
      return response.status === 200;
    } catch (error) {
      console.error('Devices API not available:', error);
      return false;
    }
  }
}

// Export singleton instance
export const devicesRepository = new DevicesRepository();
export default DevicesRepository;