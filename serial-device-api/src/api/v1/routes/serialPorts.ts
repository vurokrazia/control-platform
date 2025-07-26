import express from 'express';
import { SerialPortsController } from '../controllers/SerialPortsController';
import { versionMiddleware } from '../middleware/versionMiddleware';

const router = express.Router();
const serialPortsController = new SerialPortsController();

// Apply version middleware
router.use(versionMiddleware);

/**
 * @swagger
 * tags:
 *   name: Serial Ports
 *   description: Serial ports discovery endpoints
 */

/**
 * @swagger
 * /serial-ports:
 *   get:
 *     tags: [Serial Ports]
 *     summary: List available serial ports
 *     description: Discover and list all available serial ports on the system
 *     responses:
 *       200:
 *         description: List of available serial ports
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       path:
 *                         type: string
 *                         example: "/dev/cu.usbmodem14101"
 *                       manufacturer:
 *                         type: string
 *                         example: "Arduino LLC"
 *                       serialNumber:
 *                         type: string
 *                       vendorId:
 *                         type: string
 *                       productId:
 *                         type: string
 *                       available:
 *                         type: boolean
 *                 count:
 *                   type: integer
 *       500:
 *         description: Error listing ports
 */
router.get('/', serialPortsController.index.bind(serialPortsController));

/**
 * @swagger
 * /serial-ports/{path}/info:
 *   get:
 *     tags: [Serial Ports]
 *     summary: Get specific port information
 *     parameters:
 *       - name: path
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: URL encoded serial port path
 *         example: "%2Fdev%2Fcu.usbmodem14101"
 *     responses:
 *       200:
 *         description: Port information
 *       404:
 *         description: Port not found
 */
router.get('/:path/info', serialPortsController.show.bind(serialPortsController));

export default router;