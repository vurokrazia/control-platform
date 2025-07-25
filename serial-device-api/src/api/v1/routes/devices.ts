import express from 'express';
import { DevicesController } from '../controllers/DevicesController';
import { versionMiddleware } from '../middleware/versionMiddleware';

const router = express.Router();
const devicesController = new DevicesController();

// Apply version middleware
router.use(versionMiddleware);

/**
 * @swagger
 * tags:
 *   name: Devices
 *   description: Device management endpoints
 */

/**
 * @swagger
 * /devices:
 *   get:
 *     tags: [Devices]
 *     summary: List all devices
 *     description: Get a list of all registered devices
 *     responses:
 *       200:
 *         description: List of devices
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
 *                     $ref: '#/components/schemas/Device'
 *                 count:
 *                   type: integer
 */
router.get('/', devicesController.index.bind(devicesController));

/**
 * @swagger
 * /devices/{id}:
 *   get:
 *     tags: [Devices]
 *     summary: Get device by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     responses:
 *       200:
 *         description: Device details
 *       404:
 *         description: Device not found
 */
router.get('/:id', devicesController.show.bind(devicesController));

/**
 * @swagger
 * /devices/{id}/connect:
 *   post:
 *     tags: [Devices]
 *     summary: Connect to device
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               port:
 *                 type: string
 *                 example: "/dev/cu.usbmodem14101"
 *               baudRate:
 *                 type: integer
 *                 example: 9600
 *             required:
 *               - port
 *     responses:
 *       200:
 *         description: Device connected successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Connection failed
 */
router.post('/:id/connect', devicesController.connect.bind(devicesController));

/**
 * @swagger
 * /devices/{id}/disconnect:
 *   post:
 *     tags: [Devices]
 *     summary: Disconnect device
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Device disconnected successfully
 *       404:
 *         description: Device not connected
 */
router.post('/:id/disconnect', devicesController.disconnect.bind(devicesController));

/**
 * @swagger
 * /devices/{id}/status:
 *   get:
 *     tags: [Devices]
 *     summary: Get device status
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Device status
 *       404:
 *         description: Device not connected
 */
router.get('/:id/status', devicesController.status.bind(devicesController));

/**
 * @swagger
 * /devices/{id}:
 *   put:
 *     tags: [Devices]
 *     summary: Update device
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       200:
 *         description: Device updated successfully
 *       404:
 *         description: Device not found
 */
router.put('/:id', devicesController.update.bind(devicesController));

/**
 * @swagger
 * /devices/{id}:
 *   delete:
 *     tags: [Devices]
 *     summary: Delete device
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Device deleted successfully
 *       404:
 *         description: Device not found
 */
router.delete('/:id', devicesController.destroy.bind(devicesController));

/**
 * @swagger
 * /devices/disconnect-all:
 *   post:
 *     tags: [Devices]
 *     summary: Disconnect all devices
 *     responses:
 *       200:
 *         description: All devices disconnected successfully
 */
router.post('/disconnect-all', devicesController.disconnectAll.bind(devicesController));

export default router;