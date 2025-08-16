import { Request, Response } from 'express';
import { SerialPort } from 'serialport';

export class SerialPortsController {
  
  /**
   * @swagger
   * /serial-ports:
   *   get:
   *     tags: [Status]
   *     summary: List available serial ports
   *     description: Retrieve a list of all available serial ports on the system
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Successfully retrieved serial ports
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
   *                         allOf:
   *                           - $ref: '#/components/schemas/SerialPortInfo'
   *                           - type: object
   *                             properties:
   *                               available:
   *                                 type: boolean
   *                                 example: true
   *                                 description: 'Port availability status'
   *                     count:
   *                       type: integer
   *                       example: 3
   *                       description: 'Number of available ports'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  async index(_req: Request, res: Response): Promise<void> {
    try {
      const ports = await SerialPort.list();
      
      const mappedPorts = ports.map(port => ({
        path: port.path,
        manufacturer: port.manufacturer,
        serialNumber: port.serialNumber,
        vendorId: port.vendorId,
        productId: port.productId,
        available: true
      }));

      res.json({
        success: true,
        data: mappedPorts,
        count: mappedPorts.length
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  /**
   * @swagger
   * /serial-ports/{path}/info:
   *   get:
   *     tags: [Status]
   *     summary: Get specific port information
   *     description: Retrieve detailed information about a specific serial port
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: path
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *         description: 'Serial port path (URL encoded)'
   *         example: '%2Fdev%2Fcu.usbmodem14101'
   *     responses:
   *       200:
   *         description: Successfully retrieved port information
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       allOf:
   *                         - $ref: '#/components/schemas/SerialPortInfo'
   *                         - type: object
   *                           properties:
   *                             available:
   *                               type: boolean
   *                               example: true
   *                             capabilities:
   *                               type: object
   *                               properties:
   *                                 supportedBaudRates:
   *                                   type: array
   *                                   items:
   *                                     type: integer
   *                                   example: [9600, 19200, 38400, 57600, 115200]
   *                                 defaultBaudRate:
   *                                   type: integer
   *                                   example: 9600
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  async show(req: Request, res: Response): Promise<void> {
    try {
      const { path } = req.params;
      const decodedPath = decodeURIComponent(path);
      
      const ports = await SerialPort.list();
      const port = ports.find(p => p.path === decodedPath);
      
      if (!port) {
        res.status(404).json({ 
          success: false, 
          error: `Serial port ${decodedPath} not found` 
        });
        return;
      }

      res.json({
        success: true,
        data: {
          path: port.path,
          manufacturer: port.manufacturer,
          serialNumber: port.serialNumber,
          vendorId: port.vendorId,
          productId: port.productId,
          available: true,
          capabilities: {
            supportedBaudRates: [9600, 19200, 38400, 57600, 115200],
            defaultBaudRate: 9600
          }
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }
}