import express from 'express';
import { SessionsController } from '../controllers/SessionsController';
import { versionMiddleware } from '../middleware/versionMiddleware';

const router = express.Router({ mergeParams: true });
const sessionsController = new SessionsController();

// Apply version middleware
router.use(versionMiddleware);

/**
 * @swagger
 * tags:
 *   name: Sessions
 *   description: Device sessions management endpoints
 */

/**
 * @swagger
 * /devices/{deviceId}/sessions:
 *   get:
 *     tags: [Sessions]
 *     summary: Get device sessions
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
 *           default: 30
 *     responses:
 *       200:
 *         description: List of sessions
 */
router.get('/', sessionsController.index.bind(sessionsController));

/**
 * @swagger
 * /devices/{deviceId}/sessions/{id}:
 *   get:
 *     tags: [Sessions]
 *     summary: Get specific session
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
 *         description: Session details
 *       404:
 *         description: Session not found
 */
router.get('/:id', sessionsController.show.bind(sessionsController));

/**
 * @swagger
 * /devices/{deviceId}/sessions/active:
 *   get:
 *     tags: [Sessions]
 *     summary: Get active session
 *     parameters:
 *       - name: deviceId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Active session details
 *       404:
 *         description: No active session
 */
router.get('/active', sessionsController.active.bind(sessionsController));

/**
 * @swagger
 * /devices/{deviceId}/sessions/today:
 *   get:
 *     tags: [Sessions]
 *     summary: Get today's session
 *     parameters:
 *       - name: deviceId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Today's session details
 *       404:
 *         description: No session today
 */
router.get('/today', sessionsController.today.bind(sessionsController));

/**
 * @swagger
 * /devices/{deviceId}/sessions/{id}/end:
 *   post:
 *     tags: [Sessions]
 *     summary: End a session
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
 *         description: Session ended successfully
 *       404:
 *         description: Session not found
 */
router.post('/:id/end', sessionsController.end.bind(sessionsController));

/**
 * @swagger
 * /devices/{deviceId}/sessions/stats:
 *   get:
 *     tags: [Sessions]
 *     summary: Get session statistics
 *     parameters:
 *       - name: deviceId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: days
 *         in: query
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Session statistics
 */
router.get('/stats', sessionsController.stats.bind(sessionsController));

/**
 * @swagger
 * /devices/{deviceId}/sessions/weekly:
 *   get:
 *     tags: [Sessions]
 *     summary: Get weekly session summary
 *     parameters:
 *       - name: deviceId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Weekly session data
 */
router.get('/weekly', sessionsController.weekly.bind(sessionsController));

export default router;