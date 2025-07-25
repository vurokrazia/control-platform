export interface DeviceData {
  _id?: string;
  deviceId: string;
  data: string;
  direction: 'incoming' | 'outgoing';
  timestamp: Date;
  sessionId?: string | undefined;
}