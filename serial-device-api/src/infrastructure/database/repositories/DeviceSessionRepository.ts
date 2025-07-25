import { IDeviceSessionRepository } from '../../../domain/repositories/IDeviceSessionRepository';
import { DeviceSession } from '../../../domain/entities/DeviceSession';
import { DeviceSessionModel } from '../models/DeviceSessionModel';

export class DeviceSessionRepository implements IDeviceSessionRepository {
  async findAll(): Promise<DeviceSession[]> {
    const sessions = await DeviceSessionModel.find().sort({ createdAt: -1 });
    return sessions.map(this.toEntity);
  }

  async findById(id: string): Promise<DeviceSession | null> {
    const session = await DeviceSessionModel.findById(id);
    return session ? this.toEntity(session) : null;
  }

  async findByDeviceId(deviceId: string): Promise<DeviceSession[]> {
    const sessions = await DeviceSessionModel.find({ deviceId }).sort({ sessionDate: -1 });
    return sessions.map(this.toEntity);
  }

  async findActiveSession(deviceId: string): Promise<DeviceSession | null> {
    const session = await DeviceSessionModel.findOne({ deviceId, isActive: true });
    return session ? this.toEntity(session) : null;
  }

  async findTodaySession(deviceId: string): Promise<DeviceSession | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const session = await DeviceSessionModel.findOne({
      deviceId,
      sessionDate: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    return session ? this.toEntity(session) : null;
  }

  async create(session: Omit<DeviceSession, '_id' | 'createdAt' | 'updatedAt'>): Promise<DeviceSession> {
    const newSession = new DeviceSessionModel(session);
    const savedSession = await newSession.save();
    return this.toEntity(savedSession);
  }

  async update(id: string, session: Partial<DeviceSession>): Promise<DeviceSession | null> {
    const updatedSession = await DeviceSessionModel.findByIdAndUpdate(
      id,
      { ...session, updatedAt: new Date() },
      { new: true }
    );
    return updatedSession ? this.toEntity(updatedSession) : null;
  }

  async endSession(id: string): Promise<DeviceSession | null> {
    const endTime = new Date();
    const updatedSession = await DeviceSessionModel.findByIdAndUpdate(
      id,
      { 
        endTime,
        isActive: false,
        updatedAt: endTime
      },
      { new: true }
    );
    return updatedSession ? this.toEntity(updatedSession) : null;
  }

  private toEntity(sessionDoc: any): DeviceSession {
    return {
      _id: sessionDoc._id.toString(),
      deviceId: sessionDoc.deviceId,
      sessionDate: sessionDoc.sessionDate,
      startTime: sessionDoc.startTime,
      endTime: sessionDoc.endTime,
      isActive: sessionDoc.isActive,
      totalDuration: sessionDoc.totalDuration,
      connections: sessionDoc.connections,
      usage: sessionDoc.usage,
      createdAt: sessionDoc.createdAt,
      updatedAt: sessionDoc.updatedAt
    };
  }
}