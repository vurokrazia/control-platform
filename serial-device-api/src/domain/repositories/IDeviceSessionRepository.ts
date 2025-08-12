import { DeviceSession } from '../entities/DeviceSession';

export interface IDeviceSessionRepository {
  findById(id: string): Promise<DeviceSession | null>;
  findByDeviceId(deviceId: string): Promise<DeviceSession[]>;
  findActiveSession(deviceId: string): Promise<DeviceSession | null>;
  findTodaySession(deviceId: string): Promise<DeviceSession | null>;
  create(session: Omit<DeviceSession, '_id' | 'createdAt' | 'updatedAt'>): Promise<DeviceSession>;
  update(id: string, session: Partial<DeviceSession>): Promise<DeviceSession | null>;
  endSession(id: string): Promise<DeviceSession | null>;
}