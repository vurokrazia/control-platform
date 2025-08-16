import { devicesRepository, Device } from '../repositories/devicesRepository';
import { useDevicesStore } from '../stores/devicesStore';
import { useUiStore } from '../stores/uiStore';

// Consistent return format for all actions
interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * ACTIONS LAYER - Pure business logic functions for Devices
 * These functions handle all device-related logic, API calls, validations, and side effects
 * They access stores directly using getState() and return consistent results
 */
export const devicesActions = {
  /**
   * Load all devices for authenticated user
   */
  async loadAllDevices(): Promise<ActionResult<Device[]>> {
    const { setDevicesLoading } = useUiStore.getState();
    const { clearError } = useDevicesStore.getState();
    
    setDevicesLoading(true);
    clearError();
    
    try {
      const devices = await devicesRepository.getAllDevices();
      
      // Update store state
      useDevicesStore.setState({ devices });
      
      setDevicesLoading(false);
      return { success: true, data: devices };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load devices';
      useDevicesStore.setState({ error: errorMessage });
      setDevicesLoading(false);
      
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Set selected device
   */
  setSelectedDevice(device: Device | null): ActionResult<void> {
    const deviceId = device?.deviceId || null;
    useDevicesStore.getState().setSelectedDevice(deviceId);
    return { success: true };
  },

  /**
   * Clear error state
   */
  clearError(): ActionResult<void> {
    useDevicesStore.getState().clearError();
    return { success: true };
  },

  /**
   * Handle device selection by device ID
   */
  handleDeviceSelection(devices: any[], deviceId: string): ActionResult<void> {
    const device = devices.find(d => d.deviceId === deviceId);
    const deviceToSet = device || null;
    
    const { setSelectedDevice } = useDevicesStore.getState();
    setSelectedDevice(deviceToSet?.deviceId || null);
    
    return { success: true };
  }
};