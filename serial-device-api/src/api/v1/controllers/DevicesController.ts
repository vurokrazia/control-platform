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

  /**
   * @swagger
   * /devices:
   *   get:
   *     tags: [Devices]
   *     summary: List user's devices
   *     description: Retrieve all devices owned by the authenticated user
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Successfully retrieved devices
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
   *                         $ref: '#/components/schemas/Device'
   *                     count:
   *                       type: integer
   *                       example: 3
   *                       description: Total number of devices
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
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

  /**
   * @swagger
   * /devices:
   *   post:
   *     tags: [Devices]
   *     summary: Create new device
   *     description: Create a new device for the authenticated user
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateDeviceRequest'
   *     responses:
   *       201:
   *         description: Device created successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     message:
   *                       type: string
   *                       example: 'Device created successfully'
   *                     data:
   *                       $ref: '#/components/schemas/Device'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
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

  /**
   * @swagger
   * /devices/{id}:
   *   get:
   *     tags: [Devices]
   *     summary: Get specific device
   *     description: Retrieve a specific device owned by the authenticated user
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/DeviceId'
   *     responses:
   *       200:
   *         description: Successfully retrieved device
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       allOf:
   *                         - $ref: '#/components/schemas/Device'
   *                         - type: object
   *                           properties:
   *                             connectionInfo:
   *                               $ref: '#/components/schemas/ConnectionInfo'
   *                             isConnected:
   *                               type: boolean
   *                               example: true
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

  /**
   * @swagger
   * /devices/{id}/topics:
   *   get:
   *     tags: [Devices]
   *     summary: Get device MQTT topics
   *     description: Retrieve all MQTT topics associated with a specific device
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/DeviceId'
   *     responses:
   *       200:
   *         description: Successfully retrieved device topics
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
   *                         $ref: '#/components/schemas/MqttTopic'
   *                     count:
   *                       type: integer
   *                       example: 2
   *                     device:
   *                       type: object
   *                       properties:
   *                         deviceId:
   *                           type: string
   *                         name:
   *                           type: string
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
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

  /**
   * @swagger
   * /devices/{id}/connect:
   *   post:
   *     tags: [Devices]
   *     summary: Connect to device
   *     description: Establish a serial connection to the specified device
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/DeviceId'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ConnectRequest'
   *     responses:
   *       200:
   *         description: Device connected successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     message:
   *                       type: string
   *                       example: 'Device connected successfully'
   *                     data:
   *                       type: object
   *                       properties:
   *                         deviceId:
   *                           type: string
   *                         port:
   *                           type: string
   *                         baudRate:
   *                           type: integer
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
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

  /**
   * @swagger
   * /devices/{id}/disconnect:
   *   post:
   *     tags: [Devices]
   *     summary: Disconnect device
   *     description: Disconnect from the specified device
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/DeviceId'
   *     responses:
   *       200:
   *         description: Device disconnected successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     message:
   *                       type: string
   *                       example: 'Device arduino1 disconnected successfully'
   *                     data:
   *                       type: object
   *                       properties:
   *                         deviceId:
   *                           type: string
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
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

  /**
   * @swagger
   * /devices/{id}/status:
   *   get:
   *     tags: [Devices]
   *     summary: Get device status
   *     description: Retrieve the current status and connection information of a device
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/DeviceId'
   *     responses:
   *       200:
   *         description: Successfully retrieved device status
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/DeviceStatusResponse'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
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

  /**
   * @swagger
   * /devices/{id}:
   *   put:
   *     tags: [Devices]
   *     summary: Update device
   *     description: Update device properties like name and type
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/DeviceId'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 example: 'Updated Arduino Robot'
   *                 description: 'New device name'
   *               type:
   *                 type: string
   *                 example: 'arduino'
   *                 description: 'Device type'
   *     responses:
   *       200:
   *         description: Device updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     message:
   *                       type: string
   *                       example: 'Device updated successfully'
   *                     data:
   *                       $ref: '#/components/schemas/Device'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
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

  /**
   * @swagger
   * /devices/{id}:
   *   delete:
   *     tags: [Devices]
   *     summary: Delete device
   *     description: Delete a device and disconnect it if currently connected
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/DeviceId'
   *     responses:
   *       200:
   *         description: Device deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     message:
   *                       type: string
   *                       example: 'Device arduino1 deleted successfully'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
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

  /**
   * @swagger
   * /devices/disconnect-all:
   *   post:
   *     tags: [Devices]
   *     summary: Disconnect all devices
   *     description: Disconnect all currently connected devices
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: All devices disconnected successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     message:
   *                       type: string
   *                       example: 'All devices disconnected successfully'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
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