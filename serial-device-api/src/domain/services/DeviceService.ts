import { IDeviceRepository } from '../repositories/IDeviceRepository';
import { IDeviceSessionRepository } from '../repositories/IDeviceSessionRepository';
import { IDeviceDataRepository } from '../repositories/IDeviceDataRepository';
import { ICommandRepository } from '../repositories/ICommandRepository';
import { Device } from '../entities/Device';
import { DeviceSession } from '../entities/DeviceSession';

export class DeviceService {
  constructor(
    private deviceRepository: IDeviceRepository,
    private sessionRepository: IDeviceSessionRepository,
    private dataRepository: IDeviceDataRepository,
    private commandRepository: ICommandRepository
  ) {}

  async startDeviceSession(deviceId: string): Promise<DeviceSession> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let session = await this.sessionRepository.findTodaySession(deviceId);
    
    if (!session) {
      session = await this.sessionRepository.create({
        deviceId,
        sessionDate: today,
        startTime: new Date(),
        isActive: true,
        totalDuration: 0,
        connections: [{
          connectedAt: new Date(),
          reason: 'session_start'
        }],
        usage: {
          commandsSent: 0,
          dataReceived: 0,
          gesturesDetected: 0,
          errorCount: 0
        }
      });
    } else if (!session.isActive) {
      session = await this.sessionRepository.update(session._id!, {
        isActive: true,
        connections: [
          ...session.connections,
          {
            connectedAt: new Date(),
            reason: 'reconnection'
          }
        ]
      });
    }

    return session!;
  }

  async endDeviceSession(deviceId: string): Promise<DeviceSession | null> {
    const activeSession = await this.sessionRepository.findActiveSession(deviceId);
    
    if (activeSession) {
      const now = new Date();
      const lastConnection = activeSession.connections[activeSession.connections.length - 1];
      
      if (lastConnection && !lastConnection.disconnectedAt) {
        lastConnection.disconnectedAt = now;
        lastConnection.duration = now.getTime() - lastConnection.connectedAt.getTime();
      }

      const totalDuration = activeSession.connections.reduce((total, conn) => {
        return total + (conn.duration || 0);
      }, 0);

      return await this.sessionRepository.update(activeSession._id!, {
        endTime: now,
        isActive: false,
        totalDuration,
        connections: activeSession.connections
      });
    }

    return null;
  }

  async recordDeviceData(deviceId: string, data: string, direction: 'incoming' | 'outgoing'): Promise<void> {
    const activeSession = await this.sessionRepository.findActiveSession(deviceId);
    
    await this.dataRepository.create({
      deviceId,
      data,
      direction,
      timestamp: new Date(),
      ...(activeSession?._id && { sessionId: activeSession._id })
    });

    if (activeSession && direction === 'incoming') {
      await this.sessionRepository.update(activeSession._id!, {
        usage: {
          ...activeSession.usage,
          dataReceived: activeSession.usage.dataReceived + 1
        }
      });
    }

    await this.dataRepository.deleteOldData(deviceId, 100);
  }

  async recordCommand(deviceId: string, command: string, value?: string | number): Promise<string> {
    const activeSession = await this.sessionRepository.findActiveSession(deviceId);
    
    const savedCommand = await this.commandRepository.create({
      deviceId,
      command,
      ...(value !== undefined && { value }),
      status: 'sent',
      sentAt: new Date()
    });

    if (activeSession) {
      await this.sessionRepository.update(activeSession._id!, {
        usage: {
          ...activeSession.usage,
          commandsSent: activeSession.usage.commandsSent + 1
        }
      });
    }

    return savedCommand._id!;
  }

  async updateCommandStatus(commandId: string, status: 'acknowledged' | 'failed', response?: string): Promise<void> {
    await this.commandRepository.updateStatus(commandId, status, response);
  }

  async getDeviceHistory(deviceId: string): Promise<{
    device: Device | null;
    sessions: DeviceSession[];
    recentData: any[];
    recentCommands: any[];
  }> {
    const [device, sessions, recentData, recentCommands] = await Promise.all([
      this.deviceRepository.findByDeviceId(deviceId),
      this.sessionRepository.findByDeviceId(deviceId),
      this.dataRepository.findByDeviceId(deviceId, 50),
      this.commandRepository.findByDeviceId(deviceId)
    ]);

    return {
      device,
      sessions,
      recentData,
      recentCommands: recentCommands.slice(0, 50)
    };
  }
}