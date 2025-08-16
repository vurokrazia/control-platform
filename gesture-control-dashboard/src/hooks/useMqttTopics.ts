import { useMqttTopicsStore } from '../stores/mqttTopicsStore';
import { useUiStore } from '../stores/uiStore';
import { mqttTopicsActions } from '../actions/mqttTopicsActions';

/**
 * HOOKS LAYER - Clean API facade for MQTT Topics
 * Acts as a bridge between actions and components
 * Returns consistent format: { state: {...}, actions: {...} }
 */
export const useMqttTopics = () => {
  // State selectors - granular subscriptions for optimal re-rendering
  const topics = useMqttTopicsStore(state => state.topics);
  const selectedTopicId = useMqttTopicsStore(state => state.selectedTopicId);
  const error = useMqttTopicsStore(state => state.error);
  
  // UI state selectors
  const loadingStates = useUiStore(state => ({
    topics: state.loading.topics,
    creating: state.loading.creating,
    updating: state.loading.updating,
    deleting: state.loading.deleting,
    publishing: state.loading.publishing
  }));

  // Computed state - derived values
  const selectedTopic = topics.find(topic => topic.id === selectedTopicId) || null;
  const subscribedTopics = topics.filter(topic => topic.autoSubscribe === true);
  const unsubscribedTopics = topics.filter(topic => topic.autoSubscribe === false);
  
  // Topics by device helper
  const getTopicsByDevice = (deviceId: string) => 
    topics.filter(topic => topic.deviceId === deviceId);

  // Check if any loading state is active
  const isAnyLoading = Object.values(loadingStates).some(Boolean);

  return {
    // STATE - Everything the component needs to render
    state: {
      topics,
      selectedTopic,
      selectedTopicId,
      subscribedTopics,
      unsubscribedTopics,
      error,
      loading: loadingStates,
      isAnyLoading,
      // Helper functions for computed state
      getTopicsByDevice
    },

    // ACTIONS - Clean function references (no business logic)
    actions: {
      loadAllTopics: mqttTopicsActions.loadAllTopics,
      loadTopicsByDevice: mqttTopicsActions.loadTopicsByDevice,
      createTopic: mqttTopicsActions.createTopic,
      updateTopic: mqttTopicsActions.updateTopic,
      deleteTopic: mqttTopicsActions.deleteTopic,
      publishMessage: mqttTopicsActions.publishMessage,
      setSelectedTopic: mqttTopicsActions.setSelectedTopic,
      clearError: mqttTopicsActions.clearError
    }
  };
};