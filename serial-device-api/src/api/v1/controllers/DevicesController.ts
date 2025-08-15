import { Request, Response } from 'express';
import { DeviceRepository } from '../../../infrastructure/database/repositories/DeviceRepository';
import { MqttTopicRepository } from '../../../infrastructure/database/repositories/MqttTopicRepository';
import { ConnectionManager } from '../../../infrastructure/managers/ConnectionManager';

export class DevicesController {
  private deviceRepository: DeviceRepository;
  private mqttTopicRepository: MqttTopicRepository;
  private connectionManager: ConnectionManager;

  constructor() {
    this.deviceRepository = new DeviceRepository();
    this.mqttTopicRepository = new MqttTopicRepository();
    this.connectionManager = ConnectionManager.getInstance();
  }

  // GET /devices - List user's devices only
  async index(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: 'Unauthorized - User not authenticated or invalid token' 
        });
        return;
      }

      const devices = await this.deviceRepository.findByUserId(userId);
      res.json({
        success: true,
        data: devices,
        count: devices.length
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  // POST /devices - Create new device
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, type = 'arduino', port, baudRate = 9600 } = req.body;
      const userId = req.userId;
      
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: 'Unauthorized - User not authenticated or invalid token' 
        });
        return;
      }
      
      if (!name) {
        res.status(400).json({ 
          success: false, 
          error: 'Device name is required' 
        });
        return;
      }

      // Generate unique device ID
      const deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const deviceData: any = {
        deviceId,
        name,
        type,
        userId,
        status: {
          isConnected: false,
          bufferSize: 0
        },
        statusHistory: {
          totalConnections: 0,
          totalDisconnections: 0,
          totalUptime: 0,
          lastStatusChange: new Date(),
          averageConnectionDuration: 0
        }
      };

      // Only add serialPort if port is provided
      if (port) {
        deviceData.serialPort = {
          path: port,
          baudRate: parseInt(baudRate.toString())
        };
      }

      const device = await this.deviceRepository.create(deviceData);

      res.status(201).json({
        success: true,
        message: 'Device created successfully',
        data: device
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  // GET /devices/:id - Get specific user device
  async show(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.userId;
      
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: 'Unauthorized - User not authenticated or invalid token' 
        });
        return;
      }

      const device = await this.deviceRepository.findByDeviceIdAndUserId(id, userId);
      
      if (!device) {
        res.status(404).json({ 
          success: false, 
          error: `Device ${id} not found or access denied` 
        });
        return;
      }

      // Get connection info if device is connected
      const connectionInfo = this.connectionManager.getConnectionInfo(id);
      const isConnected = this.connectionManager.isConnected(id);

      res.json({
        success: true,
        data: {
          ...device,
          connectionInfo,
          isConnected
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  // GET /devices/:id/topics - Get MQTT topics for user's device
  async getTopics(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.userId;
      
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: 'Unauthorized - User not authenticated or invalid token' 
        });
        return;
      }
      
      // Check if device exists and belongs to user
      const device = await this.deviceRepository.findByDeviceIdAndUserId(id, userId);
      if (!device) {
        res.status(404).json({ 
          success: false, 
          error: `Device ${id} not found or access denied` 
        });
        return;
      }

      // Get topics for this device (filtered by user)
      const userTopics = await this.mqttTopicRepository.findByUserId(userId);
      const deviceTopics = userTopics.filter(topic => topic.deviceId === id);

      res.json({
        success: true,
        data: deviceTopics,
        count: deviceTopics.length,
        device: {
          deviceId: device.deviceId,
          name: device.name
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  // POST /devices/:id/connect - Connect to device
  async connect(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { port, baudRate = 9600 } = req.body;
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: 'Unauthorized - User not authenticated or invalid token' 
        });
        return;
      }

      if (!port) {
        res.status(400).json({ 
          success: false, 
          error: 'Port is required' 
        });
        return;
      }

      // Create or get device record (only for this user)
      let device = await this.deviceRepository.findByDeviceIdAndUserId(id, userId);
      if (!device) {
        device = await this.deviceRepository.create({
          deviceId: id,
          name: `Device ${id}`,
          type: 'arduino',
          userId: userId,
          serialPort: {
            path: port,
            baudRate: parseInt(baudRate.toString())
          },
          status: {
            isConnected: false,
            bufferSize: 0
          },
          statusHistory: {
            totalConnections: 0,
            totalDisconnections: 0,
            totalUptime: 0,
            lastStatusChange: new Date(),
            averageConnectionDuration: 0
          }
        });
      }

      // Connect using connection manager
      const controller = await this.connectionManager.createConnection(id, port, parseInt(baudRate.toString()));
      const result = await controller.init(port, parseInt(baudRate.toString()), id, userId);

      if (result.success) {
        res.json({
          success: true,
          message: 'Device connected successfully',
          data: { deviceId: id, port, baudRate }
        });
      } else {
        await this.connectionManager.removeConnection(id);
        res.status(500).json(result);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  // POST /devices/:id/disconnect - Disconnect user's device
  async disconnect(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.userId;
      
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: 'Unauthorized - User not authenticated or invalid token' 
        });
        return;
      }
      
      // Verify device ownership
      const device = await this.deviceRepository.findByDeviceIdAndUserId(id, userId);
      if (!device) {
        res.status(404).json({ 
          success: false, 
          error: `Device ${id} not found or access denied` 
        });
        return;
      }
      
      const success = await this.connectionManager.removeConnection(id);
      
      if (success) {
        res.json({
          success: true,
          message: `Device ${id} disconnected successfully`,
          data: { deviceId: id }
        });
      } else {
        res.status(404).json({ 
          success: false, 
          error: `Device ${id} not connected` 
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  // GET /devices/:id/status - Get user device status
  async status(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.userId;
      
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: 'Unauthorized - User not authenticated or invalid token' 
        });
        return;
      }
      
      // Verify device ownership
      const device = await this.deviceRepository.findByDeviceIdAndUserId(id, userId);
      if (!device) {
        res.status(404).json({ 
          success: false, 
          error: `Device ${id} not found or access denied` 
        });
        return;
      }
      
      const controller = this.connectionManager.getConnection(id);
      if (!controller) {
        res.status(404).json({ 
          success: false, 
          error: `Device ${id} not connected` 
        });
        return;
      }

      const status = await controller.getStatus();
      const connectionInfo = this.connectionManager.getConnectionInfo(id);

      res.json({
        success: true,
        data: {
          deviceId: id,
          status,
          connectionInfo
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  // PUT /devices/:id - Update device
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, type } = req.body;

      const device = await this.deviceRepository.findByDeviceId(id);
      if (!device) {
        res.status(404).json({ 
          success: false, 
          error: `Device ${id} not found` 
        });
        return;
      }

      const updatedDevice = await this.deviceRepository.update(device._id!, {
        ...(name && { name }),
        ...(type && { type })
      });

      res.json({
        success: true,
        message: 'Device updated successfully',
        data: updatedDevice
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  // DELETE /devices/:id - Delete device
  async destroy(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Disconnect if connected
      await this.connectionManager.removeConnection(id);

      // Find and delete device
      const device = await this.deviceRepository.findByDeviceId(id);
      if (!device) {
        res.status(404).json({ 
          success: false, 
          error: `Device ${id} not found` 
        });
        return;
      }

      await this.deviceRepository.delete(device._id!);

      res.json({
        success: true,
        message: `Device ${id} deleted successfully`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  // POST /devices/disconnect-all - Disconnect all devices
  async disconnectAll(_req: Request, res: Response): Promise<void> {
    try {
      await this.connectionManager.disconnectAll();
      res.json({
        success: true,
        message: 'All devices disconnected successfully'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }
}