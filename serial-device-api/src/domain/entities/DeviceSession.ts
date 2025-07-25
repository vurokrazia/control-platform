export interface ConnectionInfo {
  connectedAt: Date;
  disconnectedAt?: Date;
  duration?: number;
  reason: string;
}

export interface SessionUsage {
  commandsSent: number;
  dataReceived: number;
  gesturesDetected: number;
  errors: number;
}

export interface DeviceSession {
  _id?: string;
  deviceId: string;
  sessionDate: Date;
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  totalDuration: number;
  connections: ConnectionInfo[];
  usage: SessionUsage;
  createdAt: Date;
  updatedAt: Date;
}