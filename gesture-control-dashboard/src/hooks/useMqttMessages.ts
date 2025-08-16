import { useMqttMessagesStore } from '../stores/mqttMessagesStore';
import { useUiStore } from '../stores/uiStore';
import { mqttMessagesActions } from '../actions/mqttMessagesActions';

/**
 * HOOKS LAYER - Clean API facade for MQTT Messages
 * Acts as a bridge between actions and components
 * Returns consistent format: { state: {...}, actions: {...} }
 */
export const useMqttMessages = () => {
  // State selectors - granular subscriptions for optimal re-rendering
  const lastMessage = useMqttMessagesStore(state => state.lastMessage);
  const lastTopic = useMqttMessagesStore(state => state.lastTopic);
  const error = useMqttMessagesStore(state => state.error);
  
  // UI state selectors
  const isPublishing = useUiStore(state => state.loading.publishing);

  // Computed state - derived values
  const hasLastMessage = !!lastMessage;

  return {
    // STATE - Everything the component needs to render
    state: {
      lastMessage,
      lastTopic,
      isPublishing,
      error,
      // Computed values
      hasLastMessage
    },

    // ACTIONS - Clean function references (no business logic)
    actions: {
      publishMessage: mqttMessagesActions.publishMessage,
      sendCommand: mqttMessagesActions.sendCommand,
      sendCustomMessage: mqttMessagesActions.sendCustomMessage,
      sendCommandWithSpeed: mqttMessagesActions.sendCommandWithSpeed,
      clearError: mqttMessagesActions.clearError,
      clearLastMessage: mqttMessagesActions.clearLastMessage,
      handleCustomFormSubmit: mqttMessagesActions.handleCustomFormSubmit
    }
  };
};