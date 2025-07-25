import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { DeviceService } from '../../domain/services/DeviceService';
import { DeviceRepository } from '../database/repositories/DeviceRepository';
import { DeviceSessionRepository } from '../database/repositories/DeviceSessionRepository';
import { DeviceDataRepository } from '../database/repositories/DeviceDataRepository';
import { CommandRepository } from '../database/repositories/CommandRepository';
import type {
  DataEntry,
  ConnectionResult,
  SendDataResult,
  LastDataResult,
  DataHistoryResult,
  ArduinoStatus,
} from '../../types/arduino';

export class ArduinoController {
  private port: SerialPort | null = null;
  private parser: ReadlineParser | null = null;
  private isConnected: boolean = false;
  private lastData: DataEntry | null = null;
  private dataBuffer: DataEntry[] = [];
  private readonly maxBufferSize: number = 100;
  private deviceService: DeviceService;
  private currentDeviceId: string | null = null;

  constructor() {
    const deviceRepository = new DeviceRepository();
    const sessionRepository = new DeviceSessionRepository();
    const dataRepository = new DeviceDataRepository();
    const commandRepository = new CommandRepository();
    
    this.deviceService = new DeviceService(
      deviceRepository,
      sessionRepository,
      dataRepository,
      commandRepository
    );
  }

  async init(portName: string, baudRate: number = 9600, deviceId?: string): Promise<ConnectionResult> {
    try {
      console.log(`[Arduino] Connecting to port ${portName} at ${baudRate} baud...`);
      
      this.port = new SerialPort({
        path: portName,
        baudRate: baudRate,
        autoOpen: false
      });

      this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));

      await new Promise<void>((resolve, reject) => {
        this.port!.open((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      this.setupEventHandlers();
      this.isConnected = true;
      
      this.currentDeviceId = deviceId || `arduino_${portName.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      await this.initializeOrUpdateDevice(portName, baudRate);
      await this.deviceService.startDeviceSession(this.currentDeviceId);
      
      console.log(`✅ [Arduino] Connected successfully to ${portName} (Device ID: ${this.currentDeviceId})`);
      
      return { success: true, message: 'Connected to Arduino' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ [Arduino] Connection error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  private async initializeOrUpdateDevice(portName: string, baudRate: number): Promise<void> {
    if (!this.currentDeviceId) return;

    const deviceRepository = new DeviceRepository();
    let device = await deviceRepository.findByDeviceId(this.currentDeviceId);

    if (!device) {
      device = await deviceRepository.create({
        deviceId: this.currentDeviceId,
        name: `Arduino ${portName}`,
        type: 'arduino',
        serialPort: {
          path: portName,
          baudRate
        },
        status: {
          isConnected: true,
          lastConnected: new Date(),
          bufferSize: 0
        },
        statusHistory: {
          totalConnections: 1,
          totalDisconnections: 0,
          totalUptime: 0,
          lastStatusChange: new Date(),
          averageConnectionDuration: 0
        }
      });
    } else {
      await deviceRepository.updateStatus(this.currentDeviceId, {
        isConnected: true,
        lastConnected: new Date(),
        bufferSize: this.dataBuffer.length
      });
    }
  }

  private setupEventHandlers(): void {
    if (!this.parser || !this.port) return;

    this.parser.on('data', async (data: string) => {
      const cleanData = data.toString().trim();
      if (cleanData) {
        this.lastData = {
          data: cleanData,
          timestamp: new Date().toISOString()
        };
        
        this.dataBuffer.push(this.lastData);
        if (this.dataBuffer.length > this.maxBufferSize) {
          this.dataBuffer.shift();
        }
        
        if (this.currentDeviceId) {
          await this.deviceService.recordDeviceData(
            this.currentDeviceId,
            cleanData,
            'incoming'
          );
        }
        
        console.log(`📨 [Arduino] Received: ${cleanData}`);
      }
    });

    this.port.on('error', async (err: Error) => {
      console.error('❌ [Arduino] Serial port error:', err.message);
      this.isConnected = false;
      
      if (this.currentDeviceId) {
        const deviceRepository = new DeviceRepository();
        await deviceRepository.updateStatus(this.currentDeviceId, {
          isConnected: false,
          bufferSize: this.dataBuffer.length
        });
      }
    });

    this.port.on('close', async () => {
      console.log('🔌 [Arduino] Serial port closed');
      this.isConnected = false;
      
      if (this.currentDeviceId) {
        await this.deviceService.endDeviceSession(this.currentDeviceId);
        
        const deviceRepository = new DeviceRepository();
        await deviceRepository.updateStatus(this.currentDeviceId, {
          isConnected: false,
          bufferSize: this.dataBuffer.length
        });
      }
    });
  }

  async sendData(data: string | number): Promise<SendDataResult> {
    try {
      if (!this.isConnected || !this.port) {
        throw new Error('Arduino not connected');
      }

      const message = data.toString() + '\n';
      
      await new Promise<void>((resolve, reject) => {
        this.port!.write(message, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      if (this.currentDeviceId) {
        await this.deviceService.recordDeviceData(
          this.currentDeviceId,
          data.toString(),
          'outgoing'
        );
        
        await this.deviceService.recordCommand(
          this.currentDeviceId,
          data.toString()
        );
      }

      console.log(`📤 [Arduino] Sent: ${data}`);
      return { success: true, message: 'Data sent successfully', sent: data.toString() };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ [Arduino] Send error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  getLastData(): LastDataResult {
    return {
      success: true,
      data: this.lastData,
      isConnected: this.isConnected
    };
  }

  async getDataHistory(limit: number = 10): Promise<DataHistoryResult> {
    if (this.currentDeviceId) {
      const dataRepository = new DeviceDataRepository();
      const dbData = await dataRepository.findByDeviceId(this.currentDeviceId, limit);
      
      const history = dbData.map(d => ({
        data: d.data,
        timestamp: d.timestamp.toISOString()
      }));
      
      return {
        success: true,
        data: history,
        count: history.length,
        isConnected: this.isConnected
      };
    }
    
    const history = this.dataBuffer.slice(-limit);
    return {
      success: true,
      data: history,
      count: history.length,
      isConnected: this.isConnected
    };
  }

  async getStatus(): Promise<ArduinoStatus> {
    let deviceData = null;
    
    if (this.currentDeviceId) {
      const result = await this.deviceService.getDeviceHistory(this.currentDeviceId);
      deviceData = result.device;
    }
    
    return {
      isConnected: this.isConnected,
      port: this.port?.path || null,
      baudRate: this.port?.baudRate || null,
      lastData: this.lastData,
      bufferSize: this.dataBuffer.length,
      deviceData
    };
  }

  async disconnect(): Promise<ConnectionResult> {
    try {
      if (this.currentDeviceId) {
        await this.deviceService.endDeviceSession(this.currentDeviceId);
      }
      
      if (this.port && this.port.isOpen) {
        await new Promise<void>((resolve) => {
          this.port!.close(() => resolve());
        });
      }
      
      this.isConnected = false;
      this.currentDeviceId = null;
      console.log('🔌 [Arduino] Disconnected');
      return { success: true, message: 'Disconnected successfully' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ [Arduino] Disconnect error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  async getDeviceHistory(): Promise<any> {
    if (this.currentDeviceId) {
      return await this.deviceService.getDeviceHistory(this.currentDeviceId);
    }
    return null;
  }
}