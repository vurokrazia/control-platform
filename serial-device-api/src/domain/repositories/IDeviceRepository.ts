import { Device } from '../entities/Device';

export interface IDeviceRepository {
  findAll(): Promise<Device[]>;
  findById(id: string): Promise<Device | null>;
  findByDeviceId(deviceId: string): Promise<Device | null>;
  create(device: Omit<Device, '_id' | 'createdAt' | 'updatedAt'>): Promise<Device>;
  update(id: string, device: Partial<Device>): Promise<Device | null>;
  delete(id: string): Promise<boolean>;
  updateStatus(deviceId: string, status: Device['status']): Promise<Device | null>;
}