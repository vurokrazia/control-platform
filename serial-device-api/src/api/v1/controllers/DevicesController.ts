import { Request, Response } from 'express';
import { DeviceRepository } from '../../../infrastructure/database/repositories/DeviceRepository';
import { ConnectionManager } from '../../../infrastructure/managers/ConnectionManager';

export class DevicesController {
  private deviceRepository: DeviceRepository;
  private connectionManager: ConnectionManager;

  constructor() {
    this.deviceRepository = new DeviceRepository();
    this.connectionManager = ConnectionManager.getInstance();
  }

  // GET /devices - List all devices
  async index(_req: Request, res: Response): Promise<void> {
    try {
      const devices = await this.deviceRepository.findAll();
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

  // GET /devices/:id - Get specific device
  async show(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const device = await this.deviceRepository.findByDeviceId(id);
      
      if (!device) {
        res.status(404).json({ 
          success: false, 
          error: `Device ${id} not found` 
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

  // POST /devices/:id/connect - Connect to device
  async connect(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { port, baudRate = 9600 } = req.body;

      if (!port) {
        res.status(400).json({ 
          success: false, 
          error: 'Port is required' 
        });
        return;
      }

      // Create or get device record
      let device = await this.deviceRepository.findByDeviceId(id);
      if (!device) {
        device = await this.deviceRepository.create({
          deviceId: id,
          name: `Device ${id}`,
          type: 'arduino',
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
      const result = await controller.init(port, parseInt(baudRate.toString()), id);

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

  // POST /devices/:id/disconnect - Disconnect device
  async disconnect(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
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

  // GET /devices/:id/status - Get device status
  async status(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
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