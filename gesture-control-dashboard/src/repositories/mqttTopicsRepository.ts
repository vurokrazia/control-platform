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
    console.log(`🔄 MQTT Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ MQTT Request error:', error);
    return Promise.reject(error);
  }
);


api.interceptors.response.use(
  (response) => {
    console.log(`✅ MQTT Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ MQTT Response error:', error.response?.data || error.message);
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      console.error('🔒 Authentication failed - redirecting to login');
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    
    // Handle validation errors
    if (error.response?.status === 400 && error.response?.data?.details) {
      console.error('⚠️ Validation error:', error.response.data.details);
    }
    
    return Promise.reject(error);
  }
);

// Types
export interface MqttTopic {
  id?: string;
  name: string;
  deviceId: string;
  autoSubscribe: boolean;
  createdAt: Date | string;
}

export interface TopicMessage {
  id: string;
  payload: string;
  topicOwner: string;
  createdAt: Date | string;
}

export interface TopicMessagesResponse {
  topic: {
    id: string;
    name: string;
    createdAt: Date | string;
  };
  messages: TopicMessage[];
  messageCount: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class MqttTopicsRepository {
  // Get all MQTT topics
  async getAllTopics(): Promise<MqttTopic[]> {
    try {
      const response = await api.get<ApiResponse<MqttTopic[]>>('/v1/mqtt-topics');
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.error || 'Error getting MQTT topics');
    } catch (error) {
      console.error('Error getting MQTT topics:', error);
      throw new Error(
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : 'Connection error when getting MQTT topics'
      );
    }
  }

  // Create new MQTT topic
  async createTopic(name: string, deviceId: string, autoSubscribe: boolean = true): Promise<MqttTopic> {
    try {
      const response = await api.post<ApiResponse<MqttTopic>>('/v1/mqtt-topics', { name, deviceId, autoSubscribe });

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.error || 'Error creating MQTT topic');
    } catch (error) {
      console.error('Error creating MQTT topic:', error);
      throw new Error(
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : 'Connection error when creating MQTT topic'
      );
    }
  }

  // Update MQTT topic
  async updateTopic(topicId: string, autoSubscribe: boolean): Promise<MqttTopic> {
    try {
      const response = await api.put<ApiResponse<MqttTopic>>(`/v1/mqtt-topics/${topicId}`, { autoSubscribe });

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.error || 'Error updating MQTT topic');
    } catch (error) {
      console.error('Error updating MQTT topic:', error);
      throw new Error(
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : 'Connection error when updating MQTT topic'
      );
    }
  }

  // Delete MQTT topic by ID
  async deleteTopic(topicId: string): Promise<string> {
    try {
      const response = await api.delete<ApiResponse>(`/v1/mqtt-topics/${topicId}`);

      if (response.data.success) {
        return response.data.message || 'Topic deleted successfully';
      }

      throw new Error(response.data.error || 'Error deleting MQTT topic');
    } catch (error) {
      console.error('Error deleting MQTT topic:', error);
      throw new Error(
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : 'Connection error when deleting MQTT topic'
      );
    }
  }

  // Publish message to MQTT topic
  async publishMessage(topicName: string, message: string): Promise<string> {
    try {
      const response = await api.post<ApiResponse<any>>('/v1/mqtt-topics/publish', { 
        topic: topicName,
        message 
      });

      if (response.data.success) {
        return response.data.message || 'Message published successfully';
      }

      throw new Error(response.data.error || 'Error publishing message');
    } catch (error) {
      console.error('Error publishing message:', error);
      throw new Error(
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : 'Connection error when publishing message'
      );
    }
  }

  // Get messages for a topic
  async getTopicMessages(topicId: string): Promise<TopicMessagesResponse> {
    try {
      const response = await api.get<ApiResponse<TopicMessagesResponse>>(`/v1/topics/${topicId}/topicMessages`);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.error || 'Error getting topic messages');
    } catch (error) {
      console.error('Error getting topic messages:', error);
      throw new Error(
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : 'Connection error when getting topic messages'
      );
    }
  }

  // Get topics for a specific device
  async getDeviceTopics(deviceId: string): Promise<MqttTopic[]> {
    try {
      const response = await api.get<ApiResponse<MqttTopic[]>>(`/v1/devices/${deviceId}/topics`);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.error || 'Error getting device topics');
    } catch (error) {
      console.error('Error getting device topics:', error);
      throw new Error(
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : 'Connection error when getting device topics'
      );
    }
  }

  // Check if MQTT API is available
  async checkConnection(): Promise<boolean> {
    try {
      const response = await api.get('/v1/mqtt-topics');
      return response.status === 200;
    } catch (error) {
      console.error('MQTT API not available:', error);
      return false;
    }
  }
}

// Export singleton instance
export const mqttTopicsRepository = new MqttTopicsRepository();
export default MqttTopicsRepository;