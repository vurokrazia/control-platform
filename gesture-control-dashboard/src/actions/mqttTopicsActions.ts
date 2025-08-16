import { mqttTopicsRepository, MqttTopic } from '../repositories/mqttTopicsRepository';
import { useMqttTopicsStore } from '../stores/mqttTopicsStore';
import { useUiStore } from '../stores/uiStore';

// Consistent return format for all actions
interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * ACTIONS LAYER - Pure business logic functions
 * These functions handle all business logic, API calls, validations, and side effects
 * They access stores directly using getState() and return consistent results
 */
export const mqttTopicsActions = {
  /**
   * Load all MQTT topics for authenticated user
   */
  async loadAllTopics(): Promise<ActionResult<MqttTopic[]>> {
    const { setTopicsLoading } = useUiStore.getState();
    const { clearError } = useMqttTopicsStore.getState();
    
    setTopicsLoading(true);
    clearError();
    
    try {
      const topics = await mqttTopicsRepository.getAllTopics();
      
      // Update store state
      useMqttTopicsStore.setState({ topics });
      
      setTopicsLoading(false);
      return { success: true, data: topics };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load topics';
      useMqttTopicsStore.setState({ error: errorMessage });
      setTopicsLoading(false);
      
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Load topics for a specific device
   */
  async loadTopicsByDevice(deviceId: string): Promise<ActionResult<MqttTopic[]>> {
    if (!deviceId.trim()) {
      return { success: false, error: 'Device ID is required' };
    }

    const { setTopicsLoading } = useUiStore.getState();
    
    setTopicsLoading(true);
    useMqttTopicsStore.setState({ error: null });
    
    try {
      const topics = await mqttTopicsRepository.getDeviceTopics(deviceId);
      
      // Simple state update - just replace all topics
      useMqttTopicsStore.setState({ topics });
      
      setTopicsLoading(false);
      return { success: true, data: topics };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load device topics';
      useMqttTopicsStore.setState({ error: errorMessage });
      setTopicsLoading(false);
      
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Create a new MQTT topic with optimistic updates
   */
  async createTopic(name: string, deviceId: string, autoSubscribe: boolean = true): Promise<ActionResult<MqttTopic>> {
    // Validation
    if (!name.trim()) {
      return { success: false, error: 'Topic name is required' };
    }
    if (!deviceId.trim()) {
      return { success: false, error: 'Device ID is required' };
    }

    const { setCreatingLoading } = useUiStore.getState();
    const { clearError } = useMqttTopicsStore.getState();
    
    setCreatingLoading(true);
    clearError();
    
    // Optimistic update - add temporary topic
    const tempId = `temp-${Date.now()}`;
    const tempTopic: MqttTopic = {
      id: tempId,
      name: name.trim(),
      deviceId,
      autoSubscribe,
      createdAt: new Date().toISOString()
    };
    
    const { topics } = useMqttTopicsStore.getState();
    useMqttTopicsStore.setState({ 
      topics: [...topics, tempTopic] 
    });

    try {
      const createdTopic = await mqttTopicsRepository.createTopic(name.trim(), deviceId, autoSubscribe);
      
      // Replace temp topic with real one
      const { topics: currentTopics } = useMqttTopicsStore.getState();
      const updatedTopics = currentTopics.map(t => 
        t.id === tempId ? createdTopic : t
      );
      useMqttTopicsStore.setState({ topics: updatedTopics });
      
      setCreatingLoading(false);
      return { success: true, data: createdTopic };
    } catch (error) {
      // Rollback optimistic update
      const { topics: currentTopics } = useMqttTopicsStore.getState();
      const rolledBackTopics = currentTopics.filter(t => t.id !== tempId);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create topic';
      
      useMqttTopicsStore.setState({ 
        topics: rolledBackTopics,
        error: errorMessage 
      });
      setCreatingLoading(false);
      
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Update topic subscription settings with optimistic updates
   */
  async updateTopic(topicId: string, autoSubscribe: boolean): Promise<ActionResult<MqttTopic>> {
    if (!topicId) {
      return { success: false, error: 'Topic ID is required' };
    }

    const { setUpdatingLoading } = useUiStore.getState();
    const { topics, clearError } = useMqttTopicsStore.getState();
    
    const originalTopic = topics.find(t => t.id === topicId);
    if (!originalTopic) {
      return { success: false, error: 'Topic not found' };
    }

    setUpdatingLoading(true);
    clearError();

    // Optimistic update
    const optimisticTopics = topics.map(topic =>
      topic.id === topicId ? { ...topic, autoSubscribe } : topic
    );
    useMqttTopicsStore.setState({ topics: optimisticTopics });

    try {
      const updatedTopic = await mqttTopicsRepository.updateTopic(topicId, autoSubscribe);
      
      // Update with real data
      const { topics: currentTopics } = useMqttTopicsStore.getState();
      const finalTopics = currentTopics.map(t => 
        t.id === topicId ? updatedTopic : t
      );
      useMqttTopicsStore.setState({ topics: finalTopics });
      
      setUpdatingLoading(false);
      return { success: true, data: updatedTopic };
    } catch (error) {
      // Rollback optimistic update
      const rolledBackTopics = topics.map(topic =>
        topic.id === topicId ? originalTopic : topic
      );
      const errorMessage = error instanceof Error ? error.message : 'Failed to update topic';
      
      useMqttTopicsStore.setState({ 
        topics: rolledBackTopics,
        error: errorMessage 
      });
      setUpdatingLoading(false);
      
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Delete a topic with optimistic updates
   */
  async deleteTopic(topicId: string): Promise<ActionResult<void>> {
    if (!topicId) {
      return { success: false, error: 'Topic ID is required' };
    }

    const { setDeletingLoading } = useUiStore.getState();
    const { topics, clearError } = useMqttTopicsStore.getState();
    
    const originalTopics = [...topics];
    
    setDeletingLoading(true);
    clearError();
    
    // Optimistic update - remove topic
    const optimisticTopics = topics.filter(t => t.id !== topicId);
    useMqttTopicsStore.setState({ topics: optimisticTopics });

    try {
      await mqttTopicsRepository.deleteTopic(topicId);
      
      setDeletingLoading(false);
      return { success: true };
    } catch (error) {
      // Rollback
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete topic';
      useMqttTopicsStore.setState({ 
        topics: originalTopics,
        error: errorMessage 
      });
      setDeletingLoading(false);
      
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Publish message to topic
   */
  async publishMessage(topicName: string, message: string): Promise<ActionResult<void>> {
    // Validation
    if (!topicName.trim()) {
      return { success: false, error: 'Topic name is required' };
    }
    if (!message.trim()) {
      return { success: false, error: 'Message is required' };
    }

    const { setPublishingLoading } = useUiStore.getState();
    const { clearError } = useMqttTopicsStore.getState();
    
    setPublishingLoading(true);
    clearError();

    try {
      await mqttTopicsRepository.publishMessage(topicName.trim(), message.trim());
      
      setPublishingLoading(false);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to publish message';
      useMqttTopicsStore.setState({ error: errorMessage });
      setPublishingLoading(false);
      
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Clear error state
   */
  clearError(): ActionResult<void> {
    useMqttTopicsStore.getState().clearError();
    return { success: true };
  },

  /**
   * Set selected topic
   */
  setSelectedTopic(topicId: string | null): ActionResult<void> {
    useMqttTopicsStore.setState({ selectedTopicId: topicId });
    return { success: true };
  }
};