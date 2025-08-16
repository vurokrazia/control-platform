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
  console.log('🔥 MQTT TOPICS HOOK - useMqttTopics() called');
  
  // State selectors - granular subscriptions for optimal re-rendering
  const topics = useMqttTopicsStore(state => state.topics);
  const selectedTopicId = useMqttTopicsStore(state => state.selectedTopicId);
  const error = useMqttTopicsStore(state => state.error);

  // UI state selectors - SEPARATE SELECTORS to avoid new objects
  const loadingTopics = useUiStore(state => state.loading.topics);
  const loadingCreating = useUiStore(state => state.loading.creating);
  const loadingUpdating = useUiStore(state => state.loading.updating);
  const loadingDeleting = useUiStore(state => state.loading.deleting);
  const loadingPublishing = useUiStore(state => state.loading.publishing);

  // Computed state - simple calculations without memoization to avoid dependency issues
  const selectedTopic = topics.find(topic => topic.id === selectedTopicId) || null;
  const subscribedTopics = topics.filter(topic => topic.autoSubscribe === true);
  const unsubscribedTopics = topics.filter(topic => topic.autoSubscribe === false);
  const isAnyLoading = loadingTopics || loadingCreating || loadingUpdating || loadingDeleting || loadingPublishing;

  // Memoize the return object to prevent new references on every render
  return useMemo(() => {
    console.log('🔥 MQTT TOPICS HOOK - Creating new state/actions object');
    return {
      // STATE - Everything the component needs to render
      state: {
        topics,
        selectedTopic,
        selectedTopicId,
        subscribedTopics,
        unsubscribedTopics,
        error,
        loading: {
          topics: loadingTopics,
          creating: loadingCreating,
          updating: loadingUpdating,
          deleting: loadingDeleting,
          publishing: loadingPublishing
        },
        isAnyLoading
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
  }, [
    topics,
    selectedTopic,
    selectedTopicId,
    subscribedTopics,
    unsubscribedTopics,
    error,
    loadingTopics,
    loadingCreating,
    loadingUpdating,
    loadingDeleting,
    loadingPublishing,
    isAnyLoading
  ]);
};