import { useState, useEffect, useCallback } from 'react';
import { arduinoRepository } from '../repositories/arduinoRepository';
import type { Port, ArduinoStatus, ArduinoData } from '../repositories/arduinoRepository';

export interface UseArduinoState {
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
      const isAvailable = await arduinoRepository.checkConnection();
      setState(prev => ({ ...prev, isServerAvailable: isAvailable }));
      return isAvailable;
    } catch (error) {
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
      const message = await arduinoRepository.connect(port, baudRate);
      console.log(`✅ Respuesta de conexión: ${message}`);
      
      // Marcar como conectado inmediatamente
      setState(prev => ({ 
        ...prev, 
        isConnecting: false,
        isConnected: true, // Marcar como conectado inmediatamente
        selectedPort: port,
        connectionError: null,
        error: null
      }));

      // Esperar un momento y luego obtener el estado completo
      setTimeout(async () => {
        try {
          console.log('🔄 Obteniendo estado después de conectar...');
          const status = await arduinoRepository.getStatus();
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

      return message;
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
  }, []);

  // Desconectar del Arduino
  const disconnect = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true }));

    try {
      const message = await arduinoRepository.disconnect();
      
      setState(prev => ({ 
        ...prev, 
        isConnecting: false,
        isConnected: false,
        selectedPort: null,
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
  }, []);

  // Actualizar estado
  const refreshStatus = useCallback(async () => {
    setState(prev => {
      if (!prev.isServerAvailable) {
        console.log('⚠️ Servidor no disponible, saltando refreshStatus');
        return prev;
      }
      return { ...prev, isLoadingStatus: true };
    });

    try {
      console.log('🔄 Obteniendo estado del Arduino...');
      const status = await arduinoRepository.getStatus();
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
  }, []); // Sin dependencias para evitar re-creaciones innecesarias

  // Enviar datos
  const sendData = useCallback(async (data: string) => {
    setState(prev => ({ ...prev, isSendingData: true, error: null }));

    try {
      const message = await arduinoRepository.sendData(data);
      
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
  }, []);

  // Leer datos
  const readData = useCallback(async () => {
    try {
      const data = await arduinoRepository.readData();
      setState(prev => ({ ...prev, lastData: data }));
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error leyendo datos';
      setState(prev => ({ ...prev, error: errorMessage }));
      console.error('Error reading data:', errorMessage);
      throw error;
    }
  }, []);

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
      loadPorts().catch(console.error);
    }
  }, [state.isServerAvailable, state.ports.length, loadPorts]);

  // Efecto para refrescar estado periódicamente si está conectado
  useEffect(() => {
    // Solo ejecutar si hay un puerto seleccionado (indica intento de conexión)
    if (!state.selectedPort || !state.isServerAvailable) return;

    console.log('🔄 Iniciando monitoreo automático del estado...');
    
    // Refrescar inmediatamente
    refreshStatus().catch(console.error);

    const interval = setInterval(() => {
      refreshStatus().catch(console.error);
    }, 3000); // Refrescar cada 3 segundos

    return () => {
      console.log('🛑 Deteniendo monitoreo automático del estado');
      clearInterval(interval);
    };
  }, [state.selectedPort, state.isServerAvailable, refreshStatus]);

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