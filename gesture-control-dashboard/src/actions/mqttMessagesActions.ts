import { mqttTopicsRepository } from '../repositories/mqttTopicsRepository';
import { useMqttMessagesStore } from '../stores/mqttMessagesStore';
import { useMqttTopicsStore } from '../stores/mqttTopicsStore';
import { useUiStore } from '../stores/uiStore';

// Consistent return format for all actions
interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * ACTIONS LAYER - Pure business logic functions for MQTT Messages
 * These functions handle all MQTT message logic, API calls, validations, and side effects
 * They access stores directly using getState() and return consistent results
 */
export const mqttMessagesActions = {
  /**
   * Publish message to MQTT topic
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
    const { clearError } = useMqttMessagesStore.getState();
    
    setPublishingLoading(true);
    clearError();

    try {
      await mqttTopicsRepository.publishMessage(topicName.trim(), message.trim());
      
      // Store the last sent message
      useMqttMessagesStore.setState({ 
        lastMessage: message.trim(),
        lastTopic: topicName.trim()
      });
      
      setPublishingLoading(false);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to publish message';
      useMqttMessagesStore.setState({ error: errorMessage });
      setPublishingLoading(false);
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Send predefined command with speed
   */
  async sendCommand(command: string, speed: number): Promise<ActionResult<void>> {
    // Validation
    if (!command.trim()) {
      return { success: false, error: 'Command is required' };
    }
    if (speed < 0 || speed > 255) {
      return { success: false, error: 'Speed must be between 0 and 255' };
    }

    const message = JSON.stringify({ command: command.trim(), speed });
    
    // Use the selected topic from MQTT topics store
    const selectedTopicId = useMqttTopicsStore.getState().selectedTopicId;
    const topics = useMqttTopicsStore.getState().topics;
    const selectedTopic = topics.find(t => t.id === selectedTopicId);
    
    if (!selectedTopic) {
      return { success: false, error: 'No topic selected' };
    }

    return await mqttMessagesActions.publishMessage(selectedTopic.name, message);
  },

  /**
   * Send custom message from form submission
   */
  async sendCustomMessage(message: string, clearMessageCallback: () => void): Promise<ActionResult<void>> {
    // Validation
    if (!message.trim()) {
      return { success: false, error: 'Message is required' };
    }

    // Use the selected topic from MQTT topics store
    const selectedTopicId = useMqttTopicsStore.getState().selectedTopicId;
    const topics = useMqttTopicsStore.getState().topics;
    const selectedTopic = topics.find(t => t.id === selectedTopicId);
    
    if (!selectedTopic) {
      return { success: false, error: 'No topic selected' };
    }

    const result = await mqttMessagesActions.publishMessage(selectedTopic.name, message.trim());
    if (result.success) {
      clearMessageCallback(); // Clear the form
    }
    
    return result;
  },

  /**
   * Send command with speed calculation logic
   */
  async sendCommandWithSpeed(command: string, useSpeed: boolean, currentSpeed: number, fixedSpeed?: number): Promise<ActionResult<void>> {
    const commandSpeed = useSpeed ? currentSpeed : (fixedSpeed || 0);
    return await mqttMessagesActions.sendCommand(command, commandSpeed);
  },

  /**
   * Clear error state
   */
  clearError(): ActionResult<void> {
    useMqttMessagesStore.setState({ error: null });
    return { success: true };
  },

  /**
   * Clear last message
   */
  clearLastMessage(): ActionResult<void> {
    useMqttMessagesStore.setState({ 
      lastMessage: null,
      lastTopic: null 
    });
    return { success: true };
  },

  /**
   * Handle custom form submission with message clearing
   */
  async handleCustomFormSubmit(message: string, clearCallback: () => void): Promise<ActionResult<void>> {
    if (!message.trim()) {
      return { success: false, error: 'Message cannot be empty' };
    }

    const result = await mqttMessagesActions.sendCustomMessage(message.trim(), clearCallback);
    return result;
  }
};