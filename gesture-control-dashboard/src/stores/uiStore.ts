import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Types
interface ModalState {
  mqttTopicsModal: boolean;
  deviceCreateModal: boolean;
  confirmDeleteModal: {
    isOpen: boolean;
    type: 'topic' | 'device' | null;
    itemId: string | null;
    itemName: string | null;
  };
}

interface LoadingState {
  global: boolean;
  devices: boolean;
  topics: boolean;
  messages: boolean;
  publishing: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
}

interface UiState {
  // State
  modals: ModalState;
  loading: LoadingState;
  refreshIntervals: {
    messages: number;
    devices: boolean;
  };
  
  // Computed getters
  isAnyLoading: () => boolean;
  isModalOpen: () => boolean;
  
  // Modal actions
  openMqttTopicsModal: () => void;
  closeMqttTopicsModal: () => void;
  openDeviceCreateModal: () => void;
  closeDeviceCreateModal: () => void;
  openConfirmDeleteModal: (type: 'topic' | 'device', itemId: string, itemName: string) => void;
  closeConfirmDeleteModal: () => void;
  
  // Loading actions
  setGlobalLoading: (loading: boolean) => void;
  setDevicesLoading: (loading: boolean) => void;
  setTopicsLoading: (loading: boolean) => void;
  setMessagesLoading: (loading: boolean) => void;
  setPublishingLoading: (loading: boolean) => void;
  setCreatingLoading: (loading: boolean) => void;
  setUpdatingLoading: (loading: boolean) => void;
  setDeletingLoading: (loading: boolean) => void;
  
  // Refresh settings actions
  setMessageRefreshInterval: (seconds: number) => void;
  setDeviceAutoRefresh: (enabled: boolean) => void;
  
  // Reset actions
  resetModals: () => void;
  resetLoading: () => void;
}

const initialModalState: ModalState = {
  mqttTopicsModal: false,
  deviceCreateModal: false,
  confirmDeleteModal: {
    isOpen: false,
    type: null,
    itemId: null,
    itemName: null
  }
};

const initialLoadingState: LoadingState = {
  global: false,
  devices: false,
  topics: false,
  messages: false,
  publishing: false,
  creating: false,
  updating: false,
  deleting: false
};

/**
 * UI Store - Manages UI state including modals, loading states, and refresh settings
 * Implements granular selectors for optimal React rendering performance
 */
export const useUiStore = create<UiState>()(
  devtools(
    (set, get) => ({
      // Initial state
      modals: initialModalState,
      loading: initialLoadingState,
      refreshIntervals: {
        messages: 5, // seconds
        devices: false
      },

      // Computed getters
      isAnyLoading: () => {
        const { loading } = get();
        return Object.values(loading).some(Boolean);
      },

      isModalOpen: () => {
        const { modals } = get();
        return modals.mqttTopicsModal || 
               modals.deviceCreateModal || 
               modals.confirmDeleteModal.isOpen;
      },

      // Modal actions
      openMqttTopicsModal: () => {
        set(state => ({
          modals: { ...state.modals, mqttTopicsModal: true }
        }));
      },

      closeMqttTopicsModal: () => {
        set(state => ({
          modals: { ...state.modals, mqttTopicsModal: false }
        }));
      },

      openDeviceCreateModal: () => {
        set(state => ({
          modals: { ...state.modals, deviceCreateModal: true }
        }));
      },

      closeDeviceCreateModal: () => {
        set(state => ({
          modals: { ...state.modals, deviceCreateModal: false }
        }));
      },

      openConfirmDeleteModal: (type: 'topic' | 'device', itemId: string, itemName: string) => {
        set(state => ({
          modals: {
            ...state.modals,
            confirmDeleteModal: {
              isOpen: true,
              type,
              itemId,
              itemName
            }
          }
        }));
      },

      closeConfirmDeleteModal: () => {
        set(state => ({
          modals: {
            ...state.modals,
            confirmDeleteModal: {
              isOpen: false,
              type: null,
              itemId: null,
              itemName: null
            }
          }
        }));
      },

      // Loading actions
      setGlobalLoading: (loading: boolean) => {
        set(state => ({
          loading: { ...state.loading, global: loading }
        }));
      },

      setDevicesLoading: (loading: boolean) => {
        set(state => ({
          loading: { ...state.loading, devices: loading }
        }));
      },

      setTopicsLoading: (loading: boolean) => {
        set(state => ({
          loading: { ...state.loading, topics: loading }
        }));
      },

      setMessagesLoading: (loading: boolean) => {
        set(state => ({
          loading: { ...state.loading, messages: loading }
        }));
      },

      setPublishingLoading: (loading: boolean) => {
        set(state => ({
          loading: { ...state.loading, publishing: loading }
        }));
      },

      setCreatingLoading: (loading: boolean) => {
        set(state => ({
          loading: { ...state.loading, creating: loading }
        }));
      },

      setUpdatingLoading: (loading: boolean) => {
        set(state => ({
          loading: { ...state.loading, updating: loading }
        }));
      },

      setDeletingLoading: (loading: boolean) => {
        set(state => ({
          loading: { ...state.loading, deleting: loading }
        }));
      },

      // Refresh settings actions
      setMessageRefreshInterval: (seconds: number) => {
        set(state => ({
          refreshIntervals: { ...state.refreshIntervals, messages: seconds }
        }));
      },

      setDeviceAutoRefresh: (enabled: boolean) => {
        set(state => ({
          refreshIntervals: { ...state.refreshIntervals, devices: enabled }
        }));
      },

      // Reset actions
      resetModals: () => {
        set({ modals: initialModalState });
      },

      resetLoading: () => {
        set({ loading: initialLoadingState });
      }
    }),
    { name: 'ui-store' }
  )
);

// Custom hooks for granular modal selections
export const useMqttTopicsModal = () => useUiStore(state => state.modals.mqttTopicsModal);
export const useDeviceCreateModal = () => useUiStore(state => state.modals.deviceCreateModal);
export const useConfirmDeleteModal = () => useUiStore(state => state.modals.confirmDeleteModal);
export const useIsAnyModalOpen = () => useUiStore(state => state.isModalOpen());

// Custom hooks for granular loading selections
export const useGlobalLoading = () => useUiStore(state => state.loading.global);
export const useDevicesLoading = () => useUiStore(state => state.loading.devices);
export const useTopicsLoading = () => useUiStore(state => state.loading.topics);
export const useMessagesLoading = () => useUiStore(state => state.loading.messages);
export const usePublishingLoading = () => useUiStore(state => state.loading.publishing);
export const useCreatingLoading = () => useUiStore(state => state.loading.creating);
export const useUpdatingLoading = () => useUiStore(state => state.loading.updating);
export const useDeletingLoading = () => useUiStore(state => state.loading.deleting);
export const useIsAnyLoading = () => useUiStore(state => state.isAnyLoading());

// Custom hooks for refresh settings
export const useMessageRefreshInterval = () => useUiStore(state => state.refreshIntervals.messages);
export const useDeviceAutoRefresh = () => useUiStore(state => state.refreshIntervals.devices);

// Custom hooks for modal actions
export const useModalActions = () => useUiStore(state => ({
  openMqttTopicsModal: state.openMqttTopicsModal,
  closeMqttTopicsModal: state.closeMqttTopicsModal,
  openDeviceCreateModal: state.openDeviceCreateModal,
  closeDeviceCreateModal: state.closeDeviceCreateModal,
  openConfirmDeleteModal: state.openConfirmDeleteModal,
  closeConfirmDeleteModal: state.closeConfirmDeleteModal,
  resetModals: state.resetModals
}));

// Custom hooks for loading actions
export const useLoadingActions = () => useUiStore(state => ({
  setGlobalLoading: state.setGlobalLoading,
  setDevicesLoading: state.setDevicesLoading,
  setTopicsLoading: state.setTopicsLoading,
  setMessagesLoading: state.setMessagesLoading,
  setPublishingLoading: state.setPublishingLoading,
  setCreatingLoading: state.setCreatingLoading,
  setUpdatingLoading: state.setUpdatingLoading,
  setDeletingLoading: state.setDeletingLoading,
  resetLoading: state.resetLoading
}));

// Custom hooks for refresh actions
export const useRefreshActions = () => useUiStore(state => ({
  setMessageRefreshInterval: state.setMessageRefreshInterval,
  setDeviceAutoRefresh: state.setDeviceAutoRefresh
}));