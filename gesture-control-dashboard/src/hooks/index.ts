/**
 * HOOKS LAYER - Single import point for all hooks
 * Components import everything they need from here
 */

// Authentication
export { useAuth } from './useAuth';

// MQTT Topics
export { useMqttTopics } from './useMqttTopics';

// Future hooks will be exported here:
// export { useDevices } from './useDevices';
// export { useUI } from './useUI';