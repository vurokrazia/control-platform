import { topicMessagesActions } from './topicMessagesActions';
import { devicesActions } from './devicesActions';

// Consistent return format for all actions
interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Global refs for intervals (could be moved to store if needed)
let messageIntervalRef: NodeJS.Timeout | null = null;
let deviceIntervalRef: NodeJS.Timeout | null = null;

/**
 * ACTIONS LAYER - Pure business logic functions for Auto-Refresh
 * These functions handle all timer management and auto-refresh logic
 * They manage intervals and coordinate with other actions
 */
export const autoRefreshActions = {
  /**
   * Start auto-refresh for messages
   */
  startMessageAutoRefresh(topicId: string, intervalSeconds: number): ActionResult<void> {
    if (!topicId.trim()) {
      return { success: false, error: 'Topic ID is required' };
    }
    if (intervalSeconds < 1) {
      return { success: false, error: 'Interval must be at least 1 second' };
    }

    // Stop any existing interval
    autoRefreshActions.stopMessageAutoRefresh();
    
    // Start new interval
    messageIntervalRef = setInterval(() => {
      topicMessagesActions.loadTopicMessages(topicId);
    }, intervalSeconds * 1000);
    
    return { success: true };
  },

  /**
   * Stop auto-refresh for messages
   */
  stopMessageAutoRefresh(): ActionResult<void> {
    if (messageIntervalRef) {
      clearInterval(messageIntervalRef);
      messageIntervalRef = null;
    }
    return { success: true };
  },

  /**
   * Start auto-refresh for devices
   * NOTE: Disabled to prevent excessive API calls - devices data rarely changes
   */
  startDeviceAutoRefresh(): ActionResult<void> {
    console.log('🚫 Device auto-refresh disabled to prevent excessive API calls');
    return { success: true };
  },

  /**
   * Stop auto-refresh for devices
   */
  stopDeviceAutoRefresh(): ActionResult<void> {
    if (deviceIntervalRef) {
      clearInterval(deviceIntervalRef);
      deviceIntervalRef = null;
    }
    return { success: true };
  },

  /**
   * Handle device selection change with topic reset
   */
  handleDeviceSelection(devices: any[], deviceId: string, setSelectedDevice: (device: any) => void, clearSelectedTopic: () => void): ActionResult<void> {
    const device = devices.find(d => d.deviceId === deviceId);
    setSelectedDevice(device || null);
    clearSelectedTopic(); // Reset topic selection
    
    return { success: true };
  },

  /**
   * Handle topic selection change
   */
  handleTopicSelection(topics: any[], topicName: string, setSelectedTopic: (topic: any) => void): ActionResult<void> {
    const topic = topics.find(t => t.name === topicName);
    setSelectedTopic(topic || null);
    
    return { success: true };
  },

  /**
   * Cleanup all intervals (for component unmount)
   */
  cleanupAllIntervals(): ActionResult<void> {
    autoRefreshActions.stopMessageAutoRefresh();
    autoRefreshActions.stopDeviceAutoRefresh();
    return { success: true };
  }
};