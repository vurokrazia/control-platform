export interface SerialPortInfo {
  path: string;
  manufacturer?: string | undefined;
  serialNumber?: string | undefined;
  vendorId?: string | undefined;
  productId?: string | undefined;
}

export interface DataEntry {
  data: string;
  timestamp: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
}

export interface ConnectionResult extends ApiResponse {
  message?: string;
}

export interface SendDataResult extends ApiResponse {
  sent?: string;
}

export interface LastDataResult extends ApiResponse<DataEntry | null> {
  isConnected: boolean;
}

export interface DataHistoryResult extends ApiResponse<DataEntry[]> {
  count: number;
  isConnected: boolean;
}

export interface PortListResult extends ApiResponse<SerialPortInfo[]> {
  ports?: SerialPortInfo[];
}

export interface ArduinoStatus {
  isConnected: boolean;
  port: string | null;
  baudRate: number | null;
  lastData: DataEntry | null;
  bufferSize: number;
  deviceData?: any;
}

export interface ConnectRequest {
  port: string;
  baudRate?: number;
}

export interface SendDataRequest {
  data: string | number;
}

export interface CommandRequest {
  command: string;
  value?: string | number;
}