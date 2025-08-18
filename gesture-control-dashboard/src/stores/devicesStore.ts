import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { devicesRepository, Device } from '../repositories/devicesRepository';

// Types
interface DevicesState {
  // State
  devices: Device[];
  selectedDeviceId: string | null;
  loading: boolean;
  error: string | null;
  lastLoaded: Date | null;
  
  // Computed getters
  selectedDevice: () => Device | null;
  deviceCount: () => number;
  deviceNames: () => string[];
  
  // Actions
  loadDevices: () => Promise<void>;
  createDevice: (deviceData: Omit<Device, 'deviceId'>) => Promise<Device>;
  updateDevice: (deviceId: string, updates: Partial<Device>) => Promise<Device>;
  deleteDevice: (deviceId: string) => Promise<void>;
  setSelectedDevice: (deviceId: string | null) => void;
  clearError: () => void;
  
  // Optimistic update helpers
  optimisticUpdateDevice: (deviceId: string, changes: Partial<Device>) => void;
  rollbackOptimisticUpdate: (deviceId: string, originalDevice: Device) => void;
}

/**
 * Devices Store - Manages device state and operations
 * Implements granular selectors and async actions with proper error handling
 */
export const useDevicesStore = create<DevicesState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        devices: [],
        selectedDeviceId: null,
        loading: false,
        error: null,
        lastLoaded: null,

        // Computed getters - automatically memoized
        selectedDevice: () => {
          const { devices, selectedDeviceId } = get();
          return devices.find(device => device.deviceId === selectedDeviceId) || null;
        },

        deviceCount: () => {
          const { devices } = get();
          return devices.length;
        },

        deviceNames: () => {
          const { devices } = get();
          return devices.map(device => device.name || device.deviceId);
        },

        // Actions
        /**
         * Load all devices for the authenticated user
         * Includes smart caching to prevent excessive API calls
         */
        loadDevices: async (force: boolean = false) => {
          const { lastLoaded, loading } = get();
          
          // Skip if already loading
          if (loading && !force) {
            console.log('🚫 Skipping device load - already in progress');
            return;
          }
          
          // Skip if loaded recently (within 30 seconds) unless forced
          if (!force && lastLoaded) {
            const timeSinceLoad = Date.now() - lastLoaded.getTime();
            if (timeSinceLoad < 30000) {
              console.log(`🚫 Skipping device load - loaded ${Math.round(timeSinceLoad/1000)}s ago`);
              return;
            }
          }
          
          set({ loading: true, error: null });
          try {
            const devices = await devicesRepository.getAllDevices();
            set({ devices, loading: false, lastLoaded: new Date() });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to load devices',
              loading: false 
            });
          }
        },

        /**
         * Create a new device with optimistic updates
         */
        createDevice: async (deviceData: Omit<Device, 'deviceId'>) => {
          set({ loading: true, error: null });
          
          // Optimistic update - add temporary device
          const tempId = `temp-${Date.now()}`;
          const tempDevice: Device = {
            ...deviceData,
            deviceId: tempId
          };
          
          set(state => ({
            devices: [...state.devices, tempDevice]
          }));

          try {
            const createdDevice = await devicesRepository.createDevice(deviceData);
            
            // Replace temp device with real one
            set(state => ({
              devices: state.devices.map(d => d.deviceId === tempId ? createdDevice : d),
              loading: false
            }));
            
            return createdDevice;
          } catch (error) {
            // Rollback optimistic update
            set(state => ({
              devices: state.devices.filter(d => d.deviceId !== tempId),
              error: error instanceof Error ? error.message : 'Failed to create device',
              loading: false
            }));
            throw error;
          }
        },

        /**
         * Update device with optimistic updates
         */
        updateDevice: async (deviceId: string, updates: Partial<Device>) => {
          const originalDevice = get().devices.find(d => d.deviceId === deviceId);
          if (!originalDevice) throw new Error('Device not found');

          // Optimistic update
          get().optimisticUpdateDevice(deviceId, updates);

          try {
            const updatedDevice = await devicesRepository.updateDevice(deviceId, updates);
            
            set(state => ({
              devices: state.devices.map(d => d.deviceId === deviceId ? updatedDevice : d)
            }));
            
            return updatedDevice;
          } catch (error) {
            // Rollback optimistic update
            get().rollbackOptimisticUpdate(deviceId, originalDevice);
            set({ error: error instanceof Error ? error.message : 'Failed to update device' });
            throw error;
          }
        },

        /**
         * Delete a device
         */
        deleteDevice: async (deviceId: string) => {
          set({ loading: true, error: null });
          
          const originalDevices = get().devices;
          
          // Optimistic update - remove device
          set(state => ({
            devices: state.devices.filter(d => d.deviceId !== deviceId),
            selectedDeviceId: state.selectedDeviceId === deviceId ? null : state.selectedDeviceId
          }));

          try {
            await devicesRepository.deleteDevice(deviceId);
            set({ loading: false });
          } catch (error) {
            // Rollback
            set({ 
              devices: originalDevices,
              error: error instanceof Error ? error.message : 'Failed to delete device',
              loading: false 
            });
            throw error;
          }
        },

        /**
         * Set selected device
         */
        setSelectedDevice: (deviceId: string | null) => {
          set({ selectedDeviceId: deviceId });
        },

        /**
         * Clear error state
         */
        clearError: () => {
          set({ error: null });
        },

        // Optimistic update helpers
        optimisticUpdateDevice: (deviceId: string, changes: Partial<Device>) => {
          set(state => ({
            devices: state.devices.map(device =>
              device.deviceId === deviceId ? { ...device, ...changes } : device
            )
          }));
        },

        rollbackOptimisticUpdate: (deviceId: string, originalDevice: Device) => {
          set(state => ({
            devices: state.devices.map(device =>
              device.deviceId === deviceId ? originalDevice : device
            )
          }));
        }
      }),
      {
        name: 'devices-store',
        partialize: (state) => ({ 
          selectedDeviceId: state.selectedDeviceId 
        }) // Only persist selected device, not all data
      }
    ),
    { name: 'devices-store' }
  )
);

// Custom hooks for granular selections
export const useDevices = () => useDevicesStore(state => state.devices);
export const useSelectedDevice = () => useDevicesStore(state => state.selectedDevice());
export const useDevicesLoading = () => useDevicesStore(state => state.loading);
export const useDevicesError = () => useDevicesStore(state => state.error);
export const useDeviceCount = () => useDevicesStore(state => state.deviceCount());
export const useDeviceNames = () => useDevicesStore(state => state.deviceNames());

// Custom hooks for actions
export const useDevicesActions = () => useDevicesStore(state => ({
  loadDevices: state.loadDevices,
  createDevice: state.createDevice,
  updateDevice: state.updateDevice,
  deleteDevice: state.deleteDevice,
  setSelectedDevice: state.setSelectedDevice,
  clearError: state.clearError
}));