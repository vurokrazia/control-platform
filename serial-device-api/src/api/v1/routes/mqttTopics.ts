import express from 'express';
import { MqttTopicController } from '../controllers/MqttTopicController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();
const mqttTopicController = new MqttTopicController();

// Apply authentication middleware
router.use(authMiddleware.requireAuth);

/**
 * @swagger
 * components:
 *   schemas:
 *     MqttTopic:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique topic identifier
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         name:
 *           type: string
 *           description: Topic name
 *           example: "device/temperature"
 *         deviceId:
 *           type: string
 *           description: Associated device ID
 *           example: "device-123"
 *         userId:
 *           type: string
 *           description: Owner user ID
 *           example: "user-456"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *           example: "2024-01-01T12:00:00Z"
 *     
 *     CreateTopicRequest:
 *       type: object
 *       required:
 *         - name
 *         - deviceId
 *       properties:
 *         name:
 *           type: string
 *           description: Topic name
 *           example: "device/temperature"
 *         deviceId:
 *           type: string
 *           description: Associated device ID
 *           example: "device-123"
 *     
 *     PublishMessageRequest:
 *       type: object
 *       required:
 *         - topic
 *         - message
 *       properties:
 *         topic:
 *           type: string
 *           description: Topic name to publish to
 *           example: "device/temperature"
 *         message:
 *           type: string
 *           description: Message payload
 *           example: "25.5"
 *     
 *     TopicMessage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Message ID
 *           example: "msg-123"
 *         payload:
 *           type: string
 *           description: Message content
 *           example: "25.5"
 *         topicOwner:
 *           type: string
 *           description: Topic ID this message belongs to
 *           example: "topic-456"
 *         userId:
 *           type: string
 *           description: User who sent the message
 *           example: "user-789"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Message timestamp
 *           example: "2024-01-01T12:00:00Z"
 */

/**
 * @swagger
 * tags:
 *   - name: MQTT Topics
 *     description: MQTT topic management and messaging (requires authentication)
 */

/**
 * @swagger
 * /api/v1/mqtt-topics:
 *   get:
 *     tags: [MQTT Topics]
 *     summary: Get all user's MQTT topics
 *     description: Retrieve all MQTT topics owned by the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Topics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MqttTopic'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     tags: [MQTT Topics]
 *     summary: Create new MQTT topic
 *     description: Create a new MQTT topic for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTopicRequest'
 *     responses:
 *       201:
 *         description: Topic created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/MqttTopic'
 *       400:
 *         description: Validation error or topic exists
 *       401:
 *         description: Authentication required
 */

/**
 * @swagger
 * /api/v1/mqtt-topics/publish:
 *   post:
 *     tags: [MQTT Topics]
 *     summary: Publish message to topic
 *     description: Publish a message to an MQTT topic owned by the authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PublishMessageRequest'
 *     responses:
 *       200:
 *         description: Message published successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Message published to topic 'device/temperature'"
 *                 data:
 *                   type: object
 *                   properties:
 *                     topic:
 *                       type: string
 *                       example: "device/temperature"
 *                     message:
 *                       type: string
 *                       example: "25.5"
 *                     messageId:
 *                       type: string
 *                       example: "msg-123"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-01T12:00:00Z"
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Topic not found or access denied
 */

/**
 * @swagger
 * /api/v1/mqtt-topics/{id}:
 *   delete:
 *     tags: [MQTT Topics]
 *     summary: Delete MQTT topic
 *     description: Delete an MQTT topic owned by the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Topic ID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Topic deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Topic deleted successfully"
 *       400:
 *         description: Cannot delete topic with messages
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Topic not found or access denied
 */

router.get('/', mqttTopicController.getAllTopics.bind(mqttTopicController));
router.post('/', mqttTopicController.createTopic.bind(mqttTopicController));
router.post('/publish', mqttTopicController.publishMessage.bind(mqttTopicController));
router.delete('/:id', mqttTopicController.deleteTopic.bind(mqttTopicController));

export default router;