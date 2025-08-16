import { useTopicMessagesStore } from '../stores/topicMessagesStore';
import { useUiStore } from '../stores/uiStore';
import { topicMessagesActions } from '../actions/topicMessagesActions';
import { autoRefreshActions } from '../actions/autoRefreshActions';

/**
 * HOOKS LAYER - Clean API facade for Topic Messages
 * Acts as a bridge between actions and components
 * Returns consistent format: { state: {...}, actions: {...} }
 */
export const useTopicMessages = () => {
  // State selectors - granular subscriptions for optimal re-rendering
  const messages = useTopicMessagesStore(state => state.messages);
  const selectedTopicId = useTopicMessagesStore(state => state.selectedTopicId);
  const refreshInterval = useTopicMessagesStore(state => state.refreshInterval);
  const deviceAutoRefresh = useTopicMessagesStore(state => state.deviceAutoRefresh);
  const lastDeviceUpdate = useTopicMessagesStore(state => state.lastDeviceUpdate);
  const error = useTopicMessagesStore(state => state.error);
  
  // UI state selectors
  const isLoadingMessages = useUiStore(state => state.loading.messages);

  // Computed state - derived values
  const hasMessages = messages.length > 0;
  const messageCount = messages.length;

  return {
    // STATE - Everything the component needs to render
    state: {
      messages,
      selectedTopicId,
      refreshInterval,
      deviceAutoRefresh,
      lastDeviceUpdate,
      isLoadingMessages,
      error,
      // Computed values
      hasMessages,
      messageCount
    },

    // ACTIONS - Clean function references (no business logic)
    actions: {
      loadTopicMessages: topicMessagesActions.loadTopicMessages,
      setRefreshInterval: topicMessagesActions.setRefreshInterval,
      setDeviceAutoRefresh: topicMessagesActions.setDeviceAutoRefresh,
      updateLastDeviceUpdate: topicMessagesActions.updateLastDeviceUpdate,
      clearError: topicMessagesActions.clearError,
      clearMessages: topicMessagesActions.clearMessages,
      // Auto-refresh actions
      startMessageAutoRefresh: autoRefreshActions.startMessageAutoRefresh,
      stopMessageAutoRefresh: autoRefreshActions.stopMessageAutoRefresh,
      startDeviceAutoRefresh: autoRefreshActions.startDeviceAutoRefresh,
      stopDeviceAutoRefresh: autoRefreshActions.stopDeviceAutoRefresh,
      handleDeviceSelection: autoRefreshActions.handleDeviceSelection,
      handleTopicSelection: autoRefreshActions.handleTopicSelection,
      cleanupAllIntervals: autoRefreshActions.cleanupAllIntervals
    }
  };
};