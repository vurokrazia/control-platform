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
    // Temporarily disable logging
    // console.log(`🔄 MQTT Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ MQTT Request error:', error);
    return Promise.reject(error);
  }
);


api.interceptors.response.use(
  (response) => {
    // Temporarily disable logging
    // console.log(`✅ MQTT Response: ${response.status} ${response.config.url}`);
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
  // Cache for topics data
  private topicsCache: {
    topics: MqttTopic[];
    timestamp: number;
    ttl: number; // 15 seconds
  } | null = null;

  // Cache for connection check
  private connectionCache: {
    isConnected: boolean;
    timestamp: number;
    ttl: number; // 30 seconds
  } | null = null;

  // Get all MQTT topics
  async getAllTopics(): Promise<MqttTopic[]> {
    // Check cache first
    const now = Date.now();
    if (this.topicsCache && (now - this.topicsCache.timestamp) < this.topicsCache.ttl) {
      console.log('📦 Using cached MQTT topics data');
      return this.topicsCache.topics;
    }

    try {
      console.log('🔄 Fetching fresh MQTT topics from API');
      const response = await api.get<ApiResponse<MqttTopic[]>>('/v1/mqtt-topics');
      
      if (response.data.success && response.data.data) {
        // Update cache
        this.topicsCache = {
          topics: response.data.data,
          timestamp: now,
          ttl: 15000 // 15 seconds
        };
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
        // Clear cache since data changed
        this.clearTopicsCache();
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
        // Clear cache since data changed
        this.clearTopicsCache();
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
        // Clear cache since data changed
        this.clearTopicsCache();
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
    const requestStartTime = Date.now();
    console.log(`🚀 [${new Date().toISOString()}] FRONTEND API REQUEST START - Topic: ${topicName}`);
    
    try {
      // COMMENTED OUT REAL API CALL FOR FRONTEND PERFORMANCE TESTING
      const response = await api.post<ApiResponse<any>>('/v1/mqtt-topics/publish', { 
        topic: topicName,
        message 
      });

      // DUMMY RESPONSE - SIMULATE FAST API
      // await new Promise(resolve => setTimeout(resolve, 5)); // Simulate 5ms network delay
      // const response = {
      //   data: {
      //     success: true,
      //     message: `DUMMY: Message published to topic '${topicName}'`
      //   }
      // };

      const requestEndTime = Date.now();
      const duration = requestEndTime - requestStartTime;
      console.log(`🏁 [${new Date().toISOString()}] FRONTEND API REQUEST FINISH - Topic: ${topicName} - Duration: ${duration}ms`);

      if (response.data.success) {
        return response.data.message || 'Message published successfully';
      }

      throw new Error(response.data.error || 'Error publishing message');
    } catch (error) {
      const requestEndTime = Date.now();
      const duration = requestEndTime - requestStartTime;
      console.error(`❌ [${new Date().toISOString()}] FRONTEND API REQUEST ERROR - Topic: ${topicName} - Duration: ${duration}ms`, error);
      
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
    // Check cache first
    const now = Date.now();
    if (this.connectionCache && (now - this.connectionCache.timestamp) < this.connectionCache.ttl) {
      console.log('📦 Using cached MQTT connection status:', this.connectionCache.isConnected);
      return this.connectionCache.isConnected;
    }

    try {
      console.log('🔄 Checking MQTT API connection');
      const response = await api.get('/v1/mqtt-topics');
      const isConnected = response.status === 200;
      
      // Update cache
      this.connectionCache = {
        isConnected,
        timestamp: now,
        ttl: 30000 // 30 seconds
      };
      
      console.log('📡 MQTT API connection result:', isConnected);
      return isConnected;
    } catch (error) {
      console.error('MQTT API not available:', error);
      
      // Cache negative result for shorter time
      this.connectionCache = {
        isConnected: false,
        timestamp: now,
        ttl: 5000 // 5 seconds for failures
      };
      
      return false;
    }
  }

  // Clear caches when data changes
  clearTopicsCache(): void {
    this.topicsCache = null;
    console.log('🗑️ MQTT topics cache cleared');
  }

  clearConnectionCache(): void {
    this.connectionCache = null;
    console.log('🗑️ MQTT connection cache cleared');
  }

  clearAllCaches(): void {
    this.clearTopicsCache();
    this.clearConnectionCache();
  }
}

// Export singleton instance
export const mqttTopicsRepository = new MqttTopicsRepository();
export default MqttTopicsRepository;