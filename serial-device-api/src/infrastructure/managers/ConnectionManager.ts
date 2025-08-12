import { ArduinoService } from "../../domain/services/ArduinoService";

export interface ConnectionInfo {
  deviceId: string;
  controller: ArduinoService;
  port: string;
  baudRate: number;
  connectedAt: Date;
  lastActivity: Date;
}

export class ConnectionManager {
  private static instance: ConnectionManager;
  private connections = new Map<string, ConnectionInfo>();

  private constructor() {}

  public static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  public getConnection(deviceId: string): ArduinoService | null {
    const connectionInfo = this.connections.get(deviceId);
    if (connectionInfo) {
      connectionInfo.lastActivity = new Date();
      return connectionInfo.controller;
    }
    return null;
  }

  public async createConnection(deviceId: string, port: string, baudRate: number = 9600): Promise<ArduinoService> {
    // Close existing connection if any
    await this.removeConnection(deviceId);

    const controller = new ArduinoService();
    const connectionInfo: ConnectionInfo = {
      deviceId,
      controller,
      port,
      baudRate,
      connectedAt: new Date(),
      lastActivity: new Date()
    };

    this.connections.set(deviceId, connectionInfo);
    return controller;
  }

  public async removeConnection(deviceId: string): Promise<boolean> {
    const connectionInfo = this.connections.get(deviceId);
    if (connectionInfo) {
      try {
        await connectionInfo.controller.disconnect();
        this.connections.delete(deviceId);
        console.log(`🔌 Connection removed for device: ${deviceId}`);
        return true;
      } catch (error) {
        console.error(`❌ Error removing connection for ${deviceId}:`, error);
        this.connections.delete(deviceId); // Remove anyway
        return false;
      }
    }
    return false;
  }

  public getAllConnections(): ConnectionInfo[] {
    return Array.from(this.connections.values());
  }

  public getConnectionInfo(deviceId: string): ConnectionInfo | null {
    return this.connections.get(deviceId) || null;
  }

  public isConnected(deviceId: string): boolean {
    const connectionInfo = this.connections.get(deviceId);
    if (!connectionInfo) return false;
    
    const status = connectionInfo.controller.getLastData();
    return status.isConnected;
  }

  public getConnectionCount(): number {
    return this.connections.size;
  }

  public async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.connections.keys()).map(deviceId => 
      this.removeConnection(deviceId)
    );
    
    await Promise.allSettled(disconnectPromises);
    this.connections.clear();
    console.log('🔌 All connections disconnected');
  }

  // Cleanup inactive connections (optional utility)
  public async cleanupInactiveConnections(maxInactiveMinutes: number = 30): Promise<number> {
    const now = new Date();
    const inactiveDevices: string[] = [];

    for (const [deviceId, connectionInfo] of this.connections) {
      const inactiveTime = now.getTime() - connectionInfo.lastActivity.getTime();
      const inactiveMinutes = inactiveTime / (1000 * 60);

      if (inactiveMinutes > maxInactiveMinutes && !this.isConnected(deviceId)) {
        inactiveDevices.push(deviceId);
      }
    }

    for (const deviceId of inactiveDevices) {
      await this.removeConnection(deviceId);
    }

    return inactiveDevices.length;
  }
}