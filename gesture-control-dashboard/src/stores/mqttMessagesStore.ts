import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Types
interface MqttMessagesState {
  // State
  lastMessage: string | null;
  lastTopic: string | null;
  error: string | null;
  
  // Actions
  setLastMessage: (message: string, topic: string) => void;
  clearLastMessage: () => void;
  clearError: () => void;
}

/**
 * MQTT Messages Store - Manages MQTT message state
 * Tracks last sent message and publishing errors
 */
export const useMqttMessagesStore = create<MqttMessagesState>()(
  devtools(
    (set) => ({
      // Initial state
      lastMessage: null,
      lastTopic: null,
      error: null,

      // Actions
      setLastMessage: (message: string, topic: string) => {
        set({ lastMessage: message, lastTopic: topic, error: null });
      },

      clearLastMessage: () => {
        set({ lastMessage: null, lastTopic: null });
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    { name: 'mqtt-messages-store' }
  )
);

// Custom hooks for granular selections
export const useLastMessage = () => useMqttMessagesStore(state => ({
  message: state.lastMessage,
  topic: state.lastTopic
}));
export const useMqttMessagesError = () => useMqttMessagesStore(state => state.error);

// Custom hooks for actions
export const useMqttMessagesActions = () => useMqttMessagesStore(state => ({
  setLastMessage: state.setLastMessage,
  clearLastMessage: state.clearLastMessage,
  clearError: state.clearError
}));