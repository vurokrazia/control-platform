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

  /**
   * @swagger
   * /devices/{deviceId}/data:
   *   get:
   *     tags: [Status]
   *     summary: Get device data history
   *     description: Retrieve historical data entries for a specific device
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/DeviceId'
   *       - $ref: '#/components/parameters/Limit'
   *       - name: offset
   *         in: query
   *         required: false
   *         schema:
   *           type: integer
   *           default: 0
   *           minimum: 0
   *         description: Number of records to skip
   *     responses:
   *       200:
   *         description: Successfully retrieved device data
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/DeviceData'
   *                     count:
   *                       type: integer
   *                       example: 25
   *                     pagination:
   *                       type: object
   *                       properties:
   *                         limit:
   *                           type: integer
   *                         offset:
   *                           type: integer
   *                         hasMore:
   *                           type: boolean
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
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

  /**
   * @swagger
   * /devices/{deviceId}/data/{id}:
   *   get:
   *     tags: [Status]
   *     summary: Get specific data entry
   *     description: Retrieve a specific data entry by ID
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/DeviceId'
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *         description: Data entry ID
   *     responses:
   *       200:
   *         description: Successfully retrieved data entry
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/DeviceData'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
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

  /**
   * @swagger
   * /devices/{deviceId}/data:
   *   post:
   *     tags: [Status]
   *     summary: Send data to device
   *     description: Send raw data to the connected device
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/DeviceId'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SendDataRequest'
   *     responses:
   *       201:
   *         description: Data sent successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     message:
   *                       type: string
   *                       example: 'Data sent successfully'
   *                     data:
   *                       type: object
   *                       properties:
   *                         deviceId:
   *                           type: string
   *                         sent:
   *                           type: string
   *                         timestamp:
   *                           type: string
   *                           format: date-time
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
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

  /**
   * @swagger
   * /devices/{deviceId}/data/latest:
   *   get:
   *     tags: [Status]
   *     summary: Get latest data
   *     description: Retrieve the most recent data from the connected device
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/DeviceId'
   *     responses:
   *       200:
   *         description: Successfully retrieved latest data
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: object
   *                       properties:
   *                         deviceId:
   *                           type: string
   *                         lastData:
   *                           $ref: '#/components/schemas/DataEntry'
   *                         isConnected:
   *                           type: boolean
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
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

  /**
   * @swagger
   * /devices/{deviceId}/data/stream:
   *   get:
   *     tags: [Status]
   *     summary: Get streaming data info
   *     description: Get information about real-time data streaming capabilities (WebSocket endpoint info)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/DeviceId'
   *     responses:
   *       200:
   *         description: Successfully retrieved streaming info
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: object
   *                       properties:
   *                         deviceId:
   *                           type: string
   *                         lastData:
   *                           $ref: '#/components/schemas/DataEntry'
   *                         isConnected:
   *                           type: boolean
   *                         streaming:
   *                           type: object
   *                           properties:
   *                             available:
   *                               type: boolean
   *                               example: false
   *                             recommendedPollingInterval:
   *                               type: integer
   *                               example: 1000
   *                             websocketEndpoint:
   *                               type: string
   *                               example: '/ws/devices/arduino1/data'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
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

  /**
   * @swagger
   * /devices/{deviceId}/data:
   *   delete:
   *     tags: [Status]
   *     summary: Clean old data
   *     description: Remove old data entries, keeping only the most recent ones
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/DeviceId'
   *       - name: keepLast
   *         in: query
   *         required: false
   *         schema:
   *           type: integer
   *           default: 100
   *           minimum: 1
   *         description: Number of most recent entries to keep
   *     responses:
   *       200:
   *         description: Data cleanup completed successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     message:
   *                       type: string
   *                       example: 'Cleaned up old data for device arduino1'
   *                     data:
   *                       type: object
   *                       properties:
   *                         deletedCount:
   *                           type: integer
   *                           example: 45
   *                         keptLast:
   *                           type: integer
   *                           example: 100
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
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

  /**
   * @swagger
   * /devices/{deviceId}/data/stats:
   *   get:
   *     tags: [Status]
   *     summary: Get data statistics
   *     description: Retrieve statistical information about device data
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/DeviceId'
   *     responses:
   *       200:
   *         description: Successfully retrieved data statistics
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: object
   *                       properties:
   *                         deviceId:
   *                           type: string
   *                         stats:
   *                           $ref: '#/components/schemas/DataStats'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
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