import express from 'express';
import { DeviceDataController } from '../controllers/DeviceDataController';
import { versionMiddleware } from '../middleware/versionMiddleware';

const router = express.Router({ mergeParams: true });
const deviceDataController = new DeviceDataController();

// Apply version middleware
router.use(versionMiddleware);

/**
 * @swagger
 * tags:
 *   name: Device Data
 *   description: Device data management endpoints
 */

/**
 * @swagger
 * /devices/{deviceId}/data:
 *   get:
 *     tags: [Device Data]
 *     summary: Get device data
 *     parameters:
 *       - name: deviceId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 50
 *       - name: offset
 *         in: query
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of device data
 */
router.get('/', deviceDataController.index.bind(deviceDataController));

/**
 * @swagger
 * /devices/{deviceId}/data:
 *   post:
 *     tags: [Device Data]
 *     summary: Send data to device
 *     parameters:
 *       - name: deviceId
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
 *               data:
 *                 oneOf:
 *                   - type: string
 *                   - type: number
 *                 example: "LED_ON"
 *             required:
 *               - data
 *     responses:
 *       201:
 *         description: Data sent successfully
 *       400:
 *         description: Invalid data
 *       404:
 *         description: Device not connected
 */
router.post('/', deviceDataController.create.bind(deviceDataController));

/**
 * @swagger
 * /devices/{deviceId}/data/{id}:
 *   get:
 *     tags: [Device Data]
 *     summary: Get specific data entry
 *     parameters:
 *       - name: deviceId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Data entry details
 *       404:
 *         description: Data entry not found
 */
router.get('/:id', deviceDataController.show.bind(deviceDataController));

/**
 * @swagger
 * /devices/{deviceId}/data/latest:
 *   get:
 *     tags: [Device Data]
 *     summary: Get latest data
 *     parameters:
 *       - name: deviceId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Latest data from device
 *       404:
 *         description: Device not connected
 */
router.get('/latest', deviceDataController.latest.bind(deviceDataController));

/**
 * @swagger
 * /devices/{deviceId}/data/stream:
 *   get:
 *     tags: [Device Data]
 *     summary: Get real-time data stream info
 *     parameters:
 *       - name: deviceId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stream information
 *       404:
 *         description: Device not connected
 */
router.get('/stream', deviceDataController.stream.bind(deviceDataController));

/**
 * @swagger
 * /devices/{deviceId}/data/stats:
 *   get:
 *     tags: [Device Data]
 *     summary: Get data statistics
 *     parameters:
 *       - name: deviceId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Data statistics
 */
router.get('/stats', deviceDataController.stats.bind(deviceDataController));

/**
 * @swagger
 * /devices/{deviceId}/data:
 *   delete:
 *     tags: [Device Data]
 *     summary: Clean up old data
 *     parameters:
 *       - name: deviceId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: keepLast
 *         in: query
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Data cleaned up successfully
 */
router.delete('/', deviceDataController.cleanup.bind(deviceDataController));

export default router;