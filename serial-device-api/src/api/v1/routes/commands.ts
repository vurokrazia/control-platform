import express from 'express';
import { CommandsController } from '../controllers/CommandsController';
import { versionMiddleware } from '../middleware/versionMiddleware';

const router = express.Router({ mergeParams: true });
const commandsController = new CommandsController();

// Apply version middleware
router.use(versionMiddleware);

/**
 * @swagger
 * tags:
 *   name: Commands
 *   description: Device commands management endpoints
 */

/**
 * @swagger
 * /devices/{deviceId}/commands:
 *   get:
 *     tags: [Commands]
 *     summary: Get device commands
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
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [sent, acknowledged, failed]
 *     responses:
 *       200:
 *         description: List of commands
 */
router.get('/', commandsController.index.bind(commandsController));

/**
 * @swagger
 * /devices/{deviceId}/commands:
 *   post:
 *     tags: [Commands]
 *     summary: Send command to device
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
 *               command:
 *                 type: string
 *                 example: "LED"
 *               value:
 *                 oneOf:
 *                   - type: string
 *                   - type: number
 *                 example: "ON"
 *             required:
 *               - command
 *     responses:
 *       201:
 *         description: Command sent successfully
 *       400:
 *         description: Invalid command
 *       404:
 *         description: Device not connected
 */
router.post('/', commandsController.create.bind(commandsController));

/**
 * @swagger
 * /devices/{deviceId}/commands/{id}:
 *   get:
 *     tags: [Commands]
 *     summary: Get specific command
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
 *         description: Command details
 *       404:
 *         description: Command not found
 */
router.get('/:id', commandsController.show.bind(commandsController));

/**
 * @swagger
 * /devices/{deviceId}/commands/{id}/status:
 *   put:
 *     tags: [Commands]
 *     summary: Update command status
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [acknowledged, failed]
 *               response:
 *                 type: string
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: Command status updated
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Command not found
 */
router.put('/:id/status', commandsController.updateStatus.bind(commandsController));

/**
 * @swagger
 * /devices/{deviceId}/commands/stats:
 *   get:
 *     tags: [Commands]
 *     summary: Get command statistics
 *     parameters:
 *       - name: deviceId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Command statistics
 */
router.get('/stats', commandsController.stats.bind(commandsController));

/**
 * @swagger
 * /devices/{deviceId}/commands/pending:
 *   get:
 *     tags: [Commands]
 *     summary: Get pending commands
 *     parameters:
 *       - name: deviceId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of pending commands
 */
router.get('/pending', commandsController.pending.bind(commandsController));

/**
 * @swagger
 * /devices/{deviceId}/commands/batch:
 *   post:
 *     tags: [Commands]
 *     summary: Send multiple commands
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
 *               commands:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     command:
 *                       type: string
 *                     value:
 *                       oneOf:
 *                         - type: string
 *                         - type: number
 *             required:
 *               - commands
 *     responses:
 *       201:
 *         description: Batch commands sent
 *       400:
 *         description: Invalid commands array
 *       404:
 *         description: Device not connected
 */
router.post('/batch', commandsController.batch.bind(commandsController));

export default router;