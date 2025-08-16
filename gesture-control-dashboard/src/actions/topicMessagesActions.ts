import { mqttTopicsRepository, TopicMessage } from '../repositories/mqttTopicsRepository';
import { useTopicMessagesStore } from '../stores/topicMessagesStore';
import { useUiStore } from '../stores/uiStore';

// Consistent return format for all actions
interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * ACTIONS LAYER - Pure business logic functions for Topic Messages
 * These functions handle all message-related logic, API calls, and side effects
 * They access stores directly using getState() and return consistent results
 */
export const topicMessagesActions = {
  /**
   * Load messages for a specific topic
   */
  async loadTopicMessages(topicId: string): Promise<ActionResult<TopicMessage[]>> {
    if (!topicId.trim()) {
      return { success: false, error: 'Topic ID is required' };
    }

    const { setMessagesLoading } = useUiStore.getState();
    const { clearError } = useTopicMessagesStore.getState();
    
    setMessagesLoading(true);
    clearError();
    
    try {
      const response = await mqttTopicsRepository.getTopicMessages(topicId);
      const messages = response.messages || [];
      
      // Update store state
      useTopicMessagesStore.setState({ 
        messages,
        selectedTopicId: topicId
      });
      
      setMessagesLoading(false);
      return { success: true, data: messages };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load topic messages';
      useTopicMessagesStore.setState({ error: errorMessage });
      setMessagesLoading(false);
      
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Set auto-refresh interval for messages
   */
  setRefreshInterval(seconds: number): ActionResult<void> {
    if (seconds < 1) {
      return { success: false, error: 'Refresh interval must be at least 1 second' };
    }
    
    useTopicMessagesStore.setState({ refreshInterval: seconds });
    return { success: true };
  },

  /**
   * Set device auto-refresh setting
   */
  setDeviceAutoRefresh(enabled: boolean): ActionResult<void> {
    useTopicMessagesStore.setState({ deviceAutoRefresh: enabled });
    return { success: true };
  },

  /**
   * Update last device update timestamp
   */
  updateLastDeviceUpdate(): ActionResult<void> {
    useTopicMessagesStore.setState({ lastDeviceUpdate: new Date() });
    return { success: true };
  },

  /**
   * Clear error state
   */
  clearError(): ActionResult<void> {
    useTopicMessagesStore.setState({ error: null });
    return { success: true };
  },

  /**
   * Clear messages when topic changes
   */
  clearMessages(): ActionResult<void> {
    useTopicMessagesStore.setState({ 
      messages: [],
      selectedTopicId: null 
    });
    return { success: true };
  }
};