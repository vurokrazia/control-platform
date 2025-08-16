import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { mqttTopicsRepository, MqttTopic, TopicMessage, TopicMessagesResponse } from '../repositories/mqttTopicsRepository';

// Types
interface MqttTopicsState {
  // State
  topics: MqttTopic[];
  selectedTopicId: string | null;
  messages: TopicMessage[];
  loading: boolean;
  error: string | null;
  
  // Computed getters
  selectedTopic: () => MqttTopic | null;
  topicsByDevice: (deviceId: string) => MqttTopic[];
  subscribedTopics: () => MqttTopic[];
  unsubscribedTopics: () => MqttTopic[];
  
  // Actions
  loadTopics: () => Promise<void>;
  loadTopicsByDevice: (deviceId: string) => Promise<void>;
  createTopic: (name: string, deviceId: string, autoSubscribe?: boolean) => Promise<MqttTopic>;
  updateTopic: (topicId: string, autoSubscribe: boolean) => Promise<MqttTopic>;
  deleteTopic: (topicId: string) => Promise<void>;
  publishMessage: (topicName: string, message: string) => Promise<void>;
  loadMessages: (topicId: string) => Promise<void>;
  setSelectedTopic: (topicId: string | null) => void;
  clearError: () => void;
  
  // Optimistic update helpers
  optimisticUpdateTopic: (topicId: string, changes: Partial<MqttTopic>) => void;
  rollbackOptimisticUpdate: (topicId: string, originalTopic: MqttTopic) => void;
}

/**
 * MQTT Topics Store - Manages MQTT topics state and operations
 * Implements granular selectors and async actions with proper error handling
 */
export const useMqttTopicsStore = create<MqttTopicsState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        topics: [],
        selectedTopicId: null,
        messages: [],
        loading: false,
        error: null,

        // Computed getters - automatically memoized
        selectedTopic: () => {
          const { topics, selectedTopicId } = get();
          return topics.find(topic => topic.id === selectedTopicId) || null;
        },

        topicsByDevice: (deviceId: string) => {
          const { topics } = get();
          return topics.filter(topic => topic.deviceId === deviceId);
        },

        subscribedTopics: () => {
          const { topics } = get();
          return topics.filter(topic => topic.autoSubscribe === true);
        },

        unsubscribedTopics: () => {
          const { topics } = get();
          return topics.filter(topic => topic.autoSubscribe === false);
        },

        // Actions
        /**
         * Load all MQTT topics for the authenticated user
         */
        loadTopics: async () => {
          set({ loading: true, error: null });
          try {
            const topics = await mqttTopicsRepository.getAllTopics();
            set({ topics, loading: false });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to load topics',
              loading: false 
            });
          }
        },

        /**
         * Load topics for a specific device
         */
        loadTopicsByDevice: async (deviceId: string) => {
          set({ loading: true, error: null });
          try {
            const topics = await mqttTopicsRepository.getDeviceTopics(deviceId);
            set(state => ({
              topics: [
                ...state.topics.filter(t => t.deviceId !== deviceId),
                ...topics
              ],
              loading: false
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to load device topics',
              loading: false 
            });
          }
        },

        /**
         * Create a new MQTT topic with optimistic updates
         */
        createTopic: async (name: string, deviceId: string, autoSubscribe: boolean = true) => {
          set({ loading: true, error: null });
          
          // Optimistic update - add temporary topic
          const tempId = `temp-${Date.now()}`;
          const tempTopic: MqttTopic = {
            id: tempId,
            name,
            deviceId,
            autoSubscribe,
            createdAt: new Date().toISOString()
          };
          
          set(state => ({
            topics: [...state.topics, tempTopic]
          }));

          try {
            const createdTopic = await mqttTopicsRepository.createTopic(name, deviceId, autoSubscribe);
            
            // Replace temp topic with real one
            set(state => ({
              topics: state.topics.map(t => t.id === tempId ? createdTopic : t),
              loading: false
            }));
            
            return createdTopic;
          } catch (error) {
            // Rollback optimistic update
            set(state => ({
              topics: state.topics.filter(t => t.id !== tempId),
              error: error instanceof Error ? error.message : 'Failed to create topic',
              loading: false
            }));
            throw error;
          }
        },

        /**
         * Update topic subscription settings with optimistic updates
         */
        updateTopic: async (topicId: string, autoSubscribe: boolean) => {
          const originalTopic = get().topics.find(t => t.id === topicId);
          if (!originalTopic) throw new Error('Topic not found');

          // Optimistic update
          get().optimisticUpdateTopic(topicId, { autoSubscribe });

          try {
            const updatedTopic = await mqttTopicsRepository.updateTopic(topicId, autoSubscribe);
            
            set(state => ({
              topics: state.topics.map(t => t.id === topicId ? updatedTopic : t)
            }));
            
            return updatedTopic;
          } catch (error) {
            // Rollback optimistic update
            get().rollbackOptimisticUpdate(topicId, originalTopic);
            set({ error: error instanceof Error ? error.message : 'Failed to update topic' });
            throw error;
          }
        },

        /**
         * Delete a topic
         */
        deleteTopic: async (topicId: string) => {
          set({ loading: true, error: null });
          
          const originalTopics = get().topics;
          
          // Optimistic update - remove topic
          set(state => ({
            topics: state.topics.filter(t => t.id !== topicId)
          }));

          try {
            await mqttTopicsRepository.deleteTopic(topicId);
            set({ loading: false });
          } catch (error) {
            // Rollback
            set({ 
              topics: originalTopics,
              error: error instanceof Error ? error.message : 'Failed to delete topic',
              loading: false 
            });
            throw error;
          }
        },

        /**
         * Publish message to topic
         */
        publishMessage: async (topicName: string, message: string) => {
          set({ error: null });
          try {
            await mqttTopicsRepository.publishMessage(topicName, message);
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to publish message' });
            throw error;
          }
        },

        /**
         * Load messages for a specific topic
         */
        loadMessages: async (topicId: string) => {
          set({ loading: true, error: null });
          try {
            const response = await mqttTopicsRepository.getTopicMessages(topicId);
            set({ messages: response.messages, loading: false });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to load messages',
              loading: false 
            });
          }
        },

        /**
         * Set selected topic
         */
        setSelectedTopic: (topicId: string | null) => {
          set({ selectedTopicId: topicId });
        },

        /**
         * Clear error state
         */
        clearError: () => {
          set({ error: null });
        },

        // Optimistic update helpers
        optimisticUpdateTopic: (topicId: string, changes: Partial<MqttTopic>) => {
          set(state => ({
            topics: state.topics.map(topic =>
              topic.id === topicId ? { ...topic, ...changes } : topic
            )
          }));
        },

        rollbackOptimisticUpdate: (topicId: string, originalTopic: MqttTopic) => {
          set(state => ({
            topics: state.topics.map(topic =>
              topic.id === topicId ? originalTopic : topic
            )
          }));
        }
      }),
      {
        name: 'mqtt-topics-store',
        partialize: (state) => ({ 
          selectedTopicId: state.selectedTopicId 
        }) // Only persist selected topic, not all data
      }
    ),
    { name: 'mqtt-topics-store' }
  )
);

// Custom hooks for granular selections
export const useMqttTopics = () => useMqttTopicsStore(state => state.topics);
export const useSelectedTopic = () => useMqttTopicsStore(state => state.selectedTopic());
export const useMqttTopicsLoading = () => useMqttTopicsStore(state => state.loading);
export const useMqttTopicsError = () => useMqttTopicsStore(state => state.error);
export const useTopicsByDevice = (deviceId: string) => 
  useMqttTopicsStore(state => state.topicsByDevice(deviceId));
export const useSubscribedTopics = () => 
  useMqttTopicsStore(state => state.subscribedTopics());

// Custom hooks for actions
export const useMqttTopicsActions = () => useMqttTopicsStore(state => ({
  loadTopics: state.loadTopics,
  loadTopicsByDevice: state.loadTopicsByDevice,
  createTopic: state.createTopic,
  updateTopic: state.updateTopic,
  deleteTopic: state.deleteTopic,
  publishMessage: state.publishMessage,
  loadMessages: state.loadMessages,
  setSelectedTopic: state.setSelectedTopic,
  clearError: state.clearError
}));