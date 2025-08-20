import { useMemo } from 'react';
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

  // Combined loading state selector to reduce subscriptions
  const loadingState = useUiStore(state => state.loading);

  // Memoize the return object to prevent new references on every render
  return useMemo(() => {
    // Compute derived state INSIDE useMemo to avoid dependency issues
    const selectedTopic = topics.find(topic => topic.id === selectedTopicId) || null;
    const subscribedTopics = topics.filter(topic => topic.autoSubscribe === true);
    const unsubscribedTopics = topics.filter(topic => topic.autoSubscribe === false);
    const isAnyLoading = loadingState.topics || loadingState.creating || loadingState.updating || loadingState.deleting || loadingState.publishing;
    
    return {
      // STATE - Everything the component needs to render
      state: {
        topics,
        selectedTopic,
        selectedTopicId,
        subscribedTopics,
        unsubscribedTopics,
        error,
        loading: loadingState,
        isAnyLoading
      },

      // ACTIONS - Clean function references (no business logic)
      actions: {
        loadAllTopics: mqttTopicsActions.loadAllTopics,
        loadTopicsByDevice: (deviceId: string, force?: boolean) => mqttTopicsActions.loadTopicsByDevice(deviceId, force),
        createTopic: mqttTopicsActions.createTopic,
        updateTopic: mqttTopicsActions.updateTopic,
        deleteTopic: mqttTopicsActions.deleteTopic,
        publishMessage: mqttTopicsActions.publishMessage,
        setSelectedTopic: mqttTopicsActions.setSelectedTopic,
        clearError: mqttTopicsActions.clearError
      }
    };
  }, [topics, selectedTopicId, error, loadingState]);
};

