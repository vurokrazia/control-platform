import express from 'express';
import { TopicMessageController } from '../controllers/TopicMessageController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router({ mergeParams: true });
const topicMessageController = new TopicMessageController();

// Apply authentication middleware
router.use(authMiddleware.requireAuth);

/**
 * @swagger
 * tags:
 *   - name: Topic Messages
 *     description: MQTT topic message retrieval (requires authentication)
 */

/**
 * @swagger
 * /api/v1/topics/{topicId}/topicMessages:
 *   get:
 *     tags: [Topic Messages]
 *     summary: Get messages for a topic
 *     description: Retrieve all messages for a specific MQTT topic owned by the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: string
 *         description: Topic ID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     topic:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "550e8400-e29b-41d4-a716-446655440000"
 *                         name:
 *                           type: string
 *                           example: "device/temperature"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-01T12:00:00Z"
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TopicMessage'
 *                     messageCount:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Topic not found or access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// GET /api/v1/topics/:topicId/topicMessages
router.get('/', topicMessageController.getMessagesByTopicId.bind(topicMessageController));

export default router;