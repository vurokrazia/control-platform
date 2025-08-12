import { DeviceData } from '../entities/DeviceData';

export interface IDeviceDataRepository {
  findById(id: string): Promise<DeviceData | null>;
  findByDeviceId(deviceId: string, limit?: number): Promise<DeviceData[]>;
  create(data: Omit<DeviceData, '_id'>): Promise<DeviceData>;
  deleteOldData(deviceId: string, keepLast: number): Promise<number>;
}