import { useState, useEffect, useCallback } from 'react';
import { arduinoRepository } from '../repositories/arduinoRepository';
import type { Port, ArduinoStatus, ArduinoData } from '../repositories/arduinoRepository';

export interface UseArduinoState {
  // Device management
  deviceId: string | null;
  
  // Puertos
  ports: Port[];
  selectedPort: string | null;
  
  // Estado de conexión
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  
  // Estado general
  status: ArduinoStatus | null;
  
  // Datos
  lastData: ArduinoData | null;
  dataHistory: ArduinoData[];
  
  // Loading states
  isLoadingPorts: boolean;
  isLoadingStatus: boolean;
  isSendingData: boolean;
  
  // Errores
  error: string | null;
  
  // Server status
  isServerAvailable: boolean;
}

export const useArduino = () => {
  const [state, setState] = useState<UseArduinoState>({
    deviceId: null,
    ports: [],
    selectedPort: null,
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    status: null,
    lastData: null,
    dataHistory: [],
    isLoadingPorts: false,
    isLoadingStatus: false,
    isSendingData: false,
    error: null,
    isServerAvailable: false,
  });

  // Verificar disponibilidad del servidor
  const checkServerAvailability = useCallback(async () => {
    try {
      console.log('📡 Checking Arduino server availability...');
      const isAvailable = await arduinoRepository.checkConnection();
      setState(prev => ({ ...prev, isServerAvailable: isAvailable }));
      console.log('📡 Arduino server availability result:', isAvailable);
      return isAvailable;
    } catch (error) {
      console.error('❌ Arduino server availability check failed:', error);
      setState(prev => ({ 
        ...prev, 
        isServerAvailable: false,
        error: 'Servidor Arduino API no disponible'
      }));
      return false;
    }
  }, []);

  // Cargar puertos disponibles
  const loadPorts = useCallback(async () => {
    setState(prev => ({ ...prev, isLoadingPorts: true, error: null }));
    
    try {
      const serverAvailable = await checkServerAvailability();
      if (!serverAvailable) {
        throw new Error('Servidor Arduino API no disponible');
      }

      const ports = await arduinoRepository.getPorts();
      setState(prev => ({ 
        ...prev, 
        ports, 
        isLoadingPorts: false,
        error: null 
      }));
      
      console.log(`📡 Puertos cargados: ${ports.length}`);
      return ports;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error cargando puertos';
      setState(prev => ({ 
        ...prev, 
        isLoadingPorts: false, 
        error: errorMessage,
        ports: []
      }));
      console.error('Error loading ports:', errorMessage);
      throw error;
    }
  }, [checkServerAvailability]);

  // Conectar al Arduino
  const connect = useCallback(async (port: string, baudRate: number = 9600) => {
    setState(prev => ({ 
      ...prev, 
      isConnecting: true, 
      connectionError: null,
      error: null 
    }));

    try {
      console.log(`🔌 Conectando a ${port}...`);
      const response = await arduinoRepository.connect(port, baudRate);
      console.log(`✅ Respuesta de conexión: ${response.message}, Device ID: ${response.deviceId}`);
      
      // Marcar como conectado inmediatamente y guardar device ID
      setState(prev => ({ 
        ...prev, 
        isConnecting: false,
        isConnected: true,
        selectedPort: port,
        deviceId: response.deviceId, // Store the device ID from API response
        connectionError: null,
        error: null
      }));

      // Esperar un momento y luego obtener el estado completo
      setTimeout(async () => {
        try {
          console.log('🔄 Obteniendo estado después de conectar...');
          const status = await arduinoRepository.getStatus(response.deviceId);
          console.log('📊 Estado después de conectar:', status);
          
          setState(prev => ({ 
            ...prev, 
            status,
            isConnected: status.isConnected,
            lastData: status.lastData
          }));
        } catch (statusError) {
          console.error('❌ Error obteniendo estado después de conectar:', statusError);
        }
      }, 1500);

      return response.message;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error conectando';
      console.error('❌ Error conectando:', errorMessage);
      setState(prev => ({ 
        ...prev, 
        isConnecting: false,
        isConnected: false,
        connectionError: errorMessage,
        error: errorMessage,
        status: null
      }));
      throw error;
    }
  }, [state.deviceId]);

  // Desconectar del Arduino
  const disconnect = useCallback(async () => {
    if (!state.deviceId) {
      throw new Error('No device connected');
    }

    setState(prev => ({ ...prev, isConnecting: true }));

    try {
      const message = await arduinoRepository.disconnect(state.deviceId);
      
      setState(prev => ({ 
        ...prev, 
        isConnecting: false,
        isConnected: false,
        selectedPort: null,
        deviceId: null, // Clear device ID on disconnect
        status: null,
        lastData: null,
        connectionError: null,
        error: null
      }));

      console.log(`🔌 Desconectado: ${message}`);
      return message;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconectando';
      setState(prev => ({ 
        ...prev, 
        isConnecting: false,
        error: errorMessage 
      }));
      console.error('Error disconnecting:', errorMessage);
      throw error;
    }
  }, [state.deviceId]);

  // Actualizar estado
  const refreshStatus = useCallback(async () => {
    setState(prev => {
      if (!prev.isServerAvailable || !prev.deviceId) {
        console.log('⚠️ Servidor no disponible o sin dispositivo conectado, saltando refreshStatus');
        return prev;
      }
      return { ...prev, isLoadingStatus: true };
    });

    if (!state.deviceId) {
      return;
    }

    try {
      console.log('🔄 Obteniendo estado del Arduino...');
      const status = await arduinoRepository.getStatus(state.deviceId);
      console.log('📊 Estado recibido:', status);
      
      setState(prev => {
        const newState = { 
          ...prev, 
          status,
          isConnected: status.isConnected, // ← Este es el importante
          lastData: status.lastData,
          isLoadingStatus: false,
          error: null
        };
        console.log('🔄 Actualizando estado de', prev.isConnected, 'a', status.isConnected);
        return newState;
      });
      
      console.log('✅ Estado actualizado en hook');
      return status;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error obteniendo estado';
      console.error('❌ Error refreshing status:', errorMessage);
      setState(prev => ({ 
        ...prev, 
        isLoadingStatus: false,
        error: errorMessage,
        // NO cambiar isConnected aquí, mantener el estado actual
      }));
    }
  }, [state.deviceId]); // Sin dependencias para evitar re-creaciones innecesarias

  // Enviar datos
  const sendData = useCallback(async (data: string) => {
    if (!state.deviceId) {
      throw new Error('No device connected');
    }

    setState(prev => ({ ...prev, isSendingData: true, error: null }));

    try {
      const message = await arduinoRepository.sendData(state.deviceId, data);
      
      setState(prev => ({ ...prev, isSendingData: false }));
      
      console.log(`📤 Datos enviados: ${data}`);
      return message;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error enviando datos';
      setState(prev => ({ 
        ...prev, 
        isSendingData: false,
        error: errorMessage 
      }));
      console.error('Error sending data:', errorMessage);
      throw error;
    }
  }, [state.deviceId]);

  // Leer datos
  const readData = useCallback(async () => {
    if (!state.deviceId) {
      throw new Error('No device connected');
    }

    try {
      const data = await arduinoRepository.readData(state.deviceId);
      setState(prev => ({ ...prev, lastData: data }));
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error leyendo datos';
      setState(prev => ({ ...prev, error: errorMessage }));
      console.error('Error reading data:', errorMessage);
      throw error;
    }
  }, [state.deviceId]);

  // Limpiar errores
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null, connectionError: null }));
  }, []);

  // Seleccionar puerto
  const selectPort = useCallback((port: string) => {
    setState(prev => ({ ...prev, selectedPort: port }));
  }, []);

  // Efecto para verificar servidor al montar
  useEffect(() => {
    checkServerAvailability();
  }, [checkServerAvailability]);

  // Efecto para cargar puertos cuando el servidor esté disponible
  useEffect(() => {
    if (state.isServerAvailable && state.ports.length === 0) {
      // Add small delay to avoid immediate API calls after server check
      const timeoutId = setTimeout(() => {
        loadPorts().catch(console.error);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [state.isServerAvailable, state.ports.length, loadPorts]);

  // Efecto para refrescar estado periódicamente si está conectado
  useEffect(() => {
    // Solo ejecutar si hay un dispositivo conectado
    if (!state.deviceId || !state.isServerAvailable) return;

    console.log('🔄 Iniciando monitoreo automático del estado...');
    
    // Refrescar inmediatamente
    refreshStatus().catch(console.error);

    const interval = setInterval(() => {
      refreshStatus().catch(console.error);
    }, 10000); // Refrescar cada 10 segundos (reduced from 3 seconds)

    return () => {
      console.log('🛑 Deteniendo monitoreo automático del estado');
      clearInterval(interval);
    };
  }, [state.deviceId, state.isServerAvailable, refreshStatus]);

  return {
    // Estado
    ...state,
    
    // Acciones
    loadPorts,
    connect,
    disconnect,
    refreshStatus,
    sendData,
    readData,
    clearError,
    selectPort,
    checkServerAvailability,
  };
};