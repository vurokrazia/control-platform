import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useArduino } from '../hooks/useArduino';
import type { UseArduinoState } from '../hooks/useArduino';

// Definir el tipo del contexto
interface ArduinoContextType extends UseArduinoState {
  // Acciones
  loadPorts: () => Promise<any>;
  connect: (port: string, baudRate?: number) => Promise<string>;
  disconnect: () => Promise<string>;
  refreshStatus: () => Promise<any>;
  sendData: (data: string) => Promise<string>;
  readData: () => Promise<any>;
  clearError: () => void;
  selectPort: (port: string) => void;
  checkServerAvailability: () => Promise<boolean>;
}

// Crear el contexto
const ArduinoContext = createContext<ArduinoContextType | null>(null);

// Provider del contexto
interface ArduinoProviderProps {
  children: ReactNode;
}

export const ArduinoProvider: React.FC<ArduinoProviderProps> = ({ children }) => {
  const arduinoState = useArduino();

  return (
    <ArduinoContext.Provider value={arduinoState}>
      {children}
    </ArduinoContext.Provider>
  );
};

// Hook para usar el contexto
export const useArduinoContext = (): ArduinoContextType => {
  const context = useContext(ArduinoContext);
  
  if (!context) {
    throw new Error('useArduinoContext debe usarse dentro de ArduinoProvider');
  }
  
  return context;
};

export default ArduinoContext;