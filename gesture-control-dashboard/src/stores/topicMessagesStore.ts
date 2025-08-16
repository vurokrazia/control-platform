import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { TopicMessage } from '../repositories/mqttTopicsRepository';

// Types
interface TopicMessagesState {
  // State
  messages: TopicMessage[];
  selectedTopicId: string | null;
  refreshInterval: number;
  deviceAutoRefresh: boolean;
  lastDeviceUpdate: Date;
  error: string | null;
  
  // Actions
  setMessages: (messages: TopicMessage[]) => void;
  setSelectedTopicId: (topicId: string | null) => void;
  setRefreshInterval: (seconds: number) => void;
  setDeviceAutoRefresh: (enabled: boolean) => void;
  updateLastDeviceUpdate: () => void;
  clearError: () => void;
  clearMessages: () => void;
}

/**
 * Topic Messages Store - Manages MQTT topic messages state
 * Tracks messages, refresh settings, and auto-refresh configurations
 */
export const useTopicMessagesStore = create<TopicMessagesState>()(
  devtools(
    (set) => ({
      // Initial state
      messages: [],
      selectedTopicId: null,
      refreshInterval: 5, // Default 5 seconds
      deviceAutoRefresh: false,
      lastDeviceUpdate: new Date(),
      error: null,

      // Actions
      setMessages: (messages: TopicMessage[]) => {
        set({ messages, error: null });
      },

      setSelectedTopicId: (topicId: string | null) => {
        set({ selectedTopicId: topicId });
      },

      setRefreshInterval: (seconds: number) => {
        set({ refreshInterval: seconds });
      },

      setDeviceAutoRefresh: (enabled: boolean) => {
        set({ deviceAutoRefresh: enabled });
      },

      updateLastDeviceUpdate: () => {
        set({ lastDeviceUpdate: new Date() });
      },

      clearError: () => {
        set({ error: null });
      },

      clearMessages: () => {
        set({ messages: [], selectedTopicId: null });
      }
    }),
    { name: 'topic-messages-store' }
  )
);

// Custom hooks for granular selections
export const useTopicMessages = () => useTopicMessagesStore(state => state.messages);
export const useSelectedTopicId = () => useTopicMessagesStore(state => state.selectedTopicId);
export const useRefreshInterval = () => useTopicMessagesStore(state => state.refreshInterval);
export const useDeviceAutoRefresh = () => useTopicMessagesStore(state => state.deviceAutoRefresh);
export const useLastDeviceUpdate = () => useTopicMessagesStore(state => state.lastDeviceUpdate);
export const useTopicMessagesError = () => useTopicMessagesStore(state => state.error);

// Custom hooks for actions
export const useTopicMessagesActions = () => useTopicMessagesStore(state => ({
  setMessages: state.setMessages,
  setSelectedTopicId: state.setSelectedTopicId,
  setRefreshInterval: state.setRefreshInterval,
  setDeviceAutoRefresh: state.setDeviceAutoRefresh,
  updateLastDeviceUpdate: state.updateLastDeviceUpdate,
  clearError: state.clearError,
  clearMessages: state.clearMessages
}));