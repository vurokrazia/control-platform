import { Request, Response } from 'express';
import { DeviceDataRepository } from '../../../infrastructure/database/repositories/DeviceDataRepository';
import { ConnectionManager } from '../../../infrastructure/managers/ConnectionManager';
export class DeviceDataController {
  private deviceDataRepository: DeviceDataRepository;
  private connectionManager: ConnectionManager;

  constructor() {
    this.deviceDataRepository = new DeviceDataRepository();
    this.connectionManager = ConnectionManager.getInstance();
  }

  // GET /devices/:deviceId/data - Get device data
  async index(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const data = await this.deviceDataRepository.findByDeviceId(deviceId, limit);
      
      res.json({
        success: true,
        data: data.slice(offset),
        count: data.length,
        pagination: {
          limit,
          offset,
          hasMore: data.length === limit
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  // GET /devices/:deviceId/data/:id - Get specific data entry
  async show(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const dataEntry = await this.deviceDataRepository.findById(id);
      
      if (!dataEntry) {
        res.status(404).json({ 
          success: false, 
          error: 'Data entry not found' 
        });
        return;
      }

      res.json({
        success: true,
        data: dataEntry
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  // POST /devices/:deviceId/data - Send data to device
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      const { data } = req.body;

      if (data === undefined || data === null) {
        res.status(400).json({ 
          success: false, 
          error: 'Data is required' 
        });
        return;
      }

      const controller = this.connectionManager.getConnection(deviceId);
      
      if (!controller) {
        res.status(404).json({ 
          success: false, 
          error: `Device ${deviceId} not connected` 
        });
        return;
      }

      // Send data to device
      const result = await controller.sendData(data);
      
      if (result.success) {
        res.status(201).json({
          success: true,
          message: 'Data sent successfully',
          data: {
            deviceId,
            sent: data.toString(),
            timestamp: new Date().toISOString()
          }
        });
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  // GET /devices/:deviceId/data/latest - Get latest data
  async latest(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;

      const controller = this.connectionManager.getConnection(deviceId);
      
      if (!controller) {
        res.status(404).json({ 
          success: false, 
          error: `Device ${deviceId} not connected` 
        });
        return;
      }

      const result = controller.getLastData();
      
      res.json({
        success: true,
        data: {
          deviceId,
          lastData: result.data,
          isConnected: result.isConnected
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  // GET /devices/:deviceId/data/stream - Get real-time data (future WebSocket endpoint)
  async stream(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;

      // For now, return latest data with polling info
      // In the future, this could be a WebSocket endpoint
      const controller = this.connectionManager.getConnection(deviceId);
      
      if (!controller) {
        res.status(404).json({ 
          success: false, 
          error: `Device ${deviceId} not connected` 
        });
        return;
      }

      const result = controller.getLastData();
      
      res.json({
        success: true,
        data: {
          deviceId,
          lastData: result.data,
          isConnected: result.isConnected,
          streaming: {
            available: false,
            recommendedPollingInterval: 1000,
            websocketEndpoint: `/ws/devices/${deviceId}/data`
          }
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  // DELETE /devices/:deviceId/data - Clean old data
  async cleanup(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      const keepLast = parseInt(req.query.keepLast as string) || 100;

      const deletedCount = await this.deviceDataRepository.deleteOldData(deviceId, keepLast);

      res.json({
        success: true,
        message: `Cleaned up old data for device ${deviceId}`,
        data: {
          deletedCount,
          keptLast: keepLast
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  // GET /devices/:deviceId/data/stats - Get data statistics
  async stats(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      
      const allData = await this.deviceDataRepository.findByDeviceId(deviceId, 1000);
      
      const stats = {
        totalEntries: allData.length,
        incoming: allData.filter(d => d.direction === 'incoming').length,
        outgoing: allData.filter(d => d.direction === 'outgoing').length,
        dateRange: {
          oldest: allData.length > 0 ? allData[allData.length - 1].timestamp : null,
          newest: allData.length > 0 ? allData[0].timestamp : null
        },
        avgDataSize: allData.length > 0 ? 
          allData.reduce((sum, d) => sum + d.data.length, 0) / allData.length : 0
      };

      res.json({
        success: true,
        data: {
          deviceId,
          stats
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }
}