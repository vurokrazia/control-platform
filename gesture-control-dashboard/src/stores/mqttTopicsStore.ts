import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { MqttTopic, TopicMessage } from '../repositories/mqttTopicsRepository';

// Types - SIMPLIFIED for 3-layer architecture
interface MqttTopicsState {
  // State only - no actions or computed values
  topics: MqttTopic[];
  selectedTopicId: string | null;
  messages: TopicMessage[];
  error: string | null;
  lastLoadedDeviceId: string | null;
  lastLoadedTime: Date | null;
  
  // Simple state setters only
  clearError: () => void;
}

/**
 * MQTT Topics Store - SIMPLIFIED for 3-layer architecture
 * Only contains state, no business logic (moved to actions layer)
 */
export const useMqttTopicsStore = create<MqttTopicsState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        topics: [],
        selectedTopicId: null,
        messages: [],
        error: null,
        lastLoadedDeviceId: null,
        lastLoadedTime: null,

        // Simple state setters only
        clearError: () => {
          set({ error: null });
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