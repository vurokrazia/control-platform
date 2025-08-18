import { useMemo } from 'react';
import { useDevicesStore } from '../stores/devicesStore';
import { useUiStore } from '../stores/uiStore';
import { devicesActions } from '../actions/devicesActions';

/**
 * HOOKS LAYER - Clean API facade for Devices
 * Acts as a bridge between actions and components
 * Returns consistent format: { state: {...}, actions: {...} }
 */
export const useDevices = () => {
  // State selectors - granular subscriptions for optimal re-rendering
  const devices = useDevicesStore(state => state.devices);
  const selectedDeviceId = useDevicesStore(state => state.selectedDeviceId);
  const error = useDevicesStore(state => state.error);
  
  // UI state selectors
  const isLoading = useUiStore(state => state.loading.devices);

  // Memoize computed state to prevent unnecessary re-renders
  return useMemo(() => {
    // Computed state - derived values (computed inside useMemo)
    const selectedDevice = devices.find(device => device.deviceId === selectedDeviceId) || null;
    const deviceCount = devices.length;
    const deviceNames = devices.map(device => device.name || device.deviceId);
    const hasDevices = devices.length > 0;

    return {
      // STATE - Everything the component needs to render
      state: {
        devices,
        selectedDevice,
        selectedDeviceId,
        isLoading,
        error,
        // Computed values
        deviceCount,
        deviceNames,
        hasDevices
      },

      // ACTIONS - Clean function references (no business logic)
      actions: {
        loadAllDevices: (force?: boolean) => devicesActions.loadAllDevices(force),
        setSelectedDevice: devicesActions.setSelectedDevice,
        clearError: devicesActions.clearError,
        handleDeviceSelection: devicesActions.handleDeviceSelection
      }
    };
  }, [devices, selectedDeviceId, isLoading, error]); // Stable dependencies
};