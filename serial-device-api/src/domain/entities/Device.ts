export interface SerialPortInfo {
  path: string;
  manufacturer?: string;
  serialNumber?: string;
  vendorId?: string;
  productId?: string;
  baudRate: number;
}

export interface DeviceStatus {
  isConnected: boolean;
  lastConnected?: Date;
  bufferSize: number;
}

export interface DeviceStatusHistory {
  totalConnections: number;
  totalDisconnections: number;
  totalUptime: number;
  lastStatusChange: Date;
  averageConnectionDuration: number;
}

export interface Device {
  _id?: string;
  deviceId: string;
  name: string;
  type: string;
  userId: string;
  serialPort?: SerialPortInfo;
  status: DeviceStatus;
  statusHistory: DeviceStatusHistory;
  createdAt: Date;
  updatedAt: Date;
}