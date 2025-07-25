import { DeviceData } from '../entities/DeviceData';

export interface IDeviceDataRepository {
  findAll(): Promise<DeviceData[]>;
  findById(id: string): Promise<DeviceData | null>;
  findByDeviceId(deviceId: string, limit?: number): Promise<DeviceData[]>;
  findBySessionId(sessionId: string): Promise<DeviceData[]>;
  create(data: Omit<DeviceData, '_id'>): Promise<DeviceData>;
  deleteOldData(deviceId: string, keepLast: number): Promise<number>;
}