import { Request, Response } from 'express';
import { MqttTopicRepository } from '../../../infrastructure/database/repositories/MqttTopicRepository';
import { TopicMessageRepository } from '../../../infrastructure/database/repositories/TopicMessageRepository';
import { MqttTopic } from '../../../domain/entities/MqttTopic';
import { TopicMessage } from '../../../domain/entities/TopicMessage';
import { mqttServiceInstance } from '../../../shared/MqttServiceInstance';

export class MqttTopicController {
  private mqttTopicRepository: MqttTopicRepository;
  private topicMessageRepository: TopicMessageRepository;

  constructor() {
    this.mqttTopicRepository = new MqttTopicRepository();
    this.topicMessageRepository = new TopicMessageRepository();
  }
  
  /**
   * @swagger
   * /mqtt-topics:
   *   get:
   *     tags:
   *       - MQTT Topics
   *     summary: Get all MQTT topics for authenticated user
   *     description: Retrieves all MQTT topics that belong to the authenticated user
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
   *             examples:
   *               success:
   *                 summary: Successful response
   *                 value:
   *                   success: true
   *                   data:
   *                     - id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   *                       name: "robots/sparky/commands"
   *                       deviceId: "device-1728912345678-ab3cd9ef2"
   *                       autoSubscribe: true
   *                       userId: "user-a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   *                       createdAt: "2024-01-20T10:00:00.000Z"
   *                       updatedAt: "2024-01-20T10:00:00.000Z"
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  public async getAllTopics(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      const userId = req.userId;
      
      if (!user || !userId) {
        res.status(401).json({ 
          success: false, 
          error: 'Unauthorized - User not authenticated or invalid token' 
        });
        return;
      }

      // Only get topics for the authenticated user
      const topics = await this.mqttTopicRepository.findByUserId(userId);
      
      res.status(200).json({ 
        success: true, 
        data: topics 
      });
    } catch (error) {
      console.log(error);
      
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  /**
   * @swagger
   * /mqtt-topics:
   *   post:
   *     tags:
   *       - MQTT Topics
   *     summary: Create a new MQTT topic
   *     description: Creates a new MQTT topic for the authenticated user and optionally subscribes to it
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateTopicRequest'
   *           examples:
   *             basic:
   *               summary: Basic topic creation
   *               value:
   *                 name: "robots/sparky/commands"
   *                 deviceId: "device-1728912345678-ab3cd9ef2"
   *                 autoSubscribe: true
   *             minimal:
   *               summary: Minimal topic creation
   *               value:
   *                 name: "sensors/temperature"
   *                 deviceId: "device-1728912345678-ab3cd9ef2"
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
   *             examples:
   *               success:
   *                 summary: Successful creation
   *                 value:
   *                   success: true
   *                   data:
   *                     id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   *                     name: "robots/sparky/commands"
   *                     deviceId: "device-1728912345678-ab3cd9ef2"
   *                     autoSubscribe: true
   *                     userId: "user-a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   *                     createdAt: "2024-01-20T10:00:00.000Z"
   *                     updatedAt: "2024-01-20T10:00:00.000Z"
   *       400:
   *         description: Bad request - validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             examples:
   *               missing_name:
   *                 summary: Missing topic name
   *                 value:
   *                   success: false
   *                   error: "Topic name is required"
   *               missing_device_id:
   *                 summary: Missing device ID
   *                 value:
   *                   success: false
   *                   error: "Device ID is required"
   *               duplicate_topic:
   *                 summary: Topic already exists
   *                 value:
   *                   success: false
   *                   error: "Topic already exists for this user"
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  public async createTopic(req: Request, res: Response): Promise<void> {
    try {
      const { name, deviceId, autoSubscribe = true } = req.body;
      const user = req.user;
      const userId = req.userId;
      
      if (!user || !userId) {
        res.status(401).json({ 
          success: false, 
          error: 'Unauthorized - User not authenticated or invalid token' 
        });
        return;
      }

      if (!name) {
        res.status(400).json({ success: false, error: 'Topic name is required' });
        return;
      }

      if (!deviceId) {
        res.status(400).json({ success: false, error: 'Device ID is required' });
        return;
      }

      // Create topic with user ownership
      const newTopic = new MqttTopic(name, deviceId, userId, autoSubscribe);
      const createdTopic = await this.mqttTopicRepository.create(newTopic);
      
      // Subscribe to the new topic only if autoSubscribe is true
      if (autoSubscribe) {
        mqttServiceInstance.subscribe(name);
      }
      
      res.status(201).json({ 
        success: true, 
        data: createdTopic 
      });
    } catch (error: any) {
      if (error.code === 11000) {
        res.status(400).json({ success: false, error: 'Topic already exists for this user' });
      } else {
        res.status(500).json({ success: false, error: 'Internal server error' });
      }
    }
  }

  /**
   * @swagger
   * /mqtt-topics/{id}:
   *   put:
   *     tags:
   *       - MQTT Topics
   *     summary: Update MQTT topic subscription settings
   *     description: Updates the autoSubscribe setting for an existing MQTT topic
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   *         description: Unique topic identifier
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateTopicRequest'
   *           examples:
   *             enable_subscription:
   *               summary: Enable auto-subscription
   *               value:
   *                 autoSubscribe: true
   *             disable_subscription:
   *               summary: Disable auto-subscription
   *               value:
   *                 autoSubscribe: false
   *     responses:
   *       200:
   *         description: Topic updated successfully
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
   *             examples:
   *               success:
   *                 summary: Successful update
   *                 value:
   *                   success: true
   *                   data:
   *                     id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   *                     name: "robots/sparky/commands"
   *                     deviceId: "device-1728912345678-ab3cd9ef2"
   *                     autoSubscribe: false
   *                     userId: "user-a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   *                     createdAt: "2024-01-20T10:00:00.000Z"
   *                     updatedAt: "2024-01-20T10:30:00.000Z"
   *       400:
   *         description: Bad request - validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             examples:
   *               invalid_autosubscribe:
   *                 summary: Invalid autoSubscribe value
   *                 value:
   *                   success: false
   *                   error: "autoSubscribe must be a boolean"
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         description: Topic not found or access denied
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             examples:
   *               not_found:
   *                 summary: Topic not found
   *                 value:
   *                   success: false
   *                   error: "Topic not found or access denied"
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  public async updateTopic(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { autoSubscribe } = req.body;
      const user = req.user;
      const userId = req.userId;
      
      if (!user || !userId) {
        res.status(401).json({ 
          success: false, 
          error: 'Unauthorized - User not authenticated or invalid token' 
        });
        return;
      }

      if (typeof autoSubscribe !== 'boolean') {
        res.status(400).json({ success: false, error: 'autoSubscribe must be a boolean' });
        return;
      }
      
      // Find topic by ID for the authenticated user only
      const userTopics = await this.mqttTopicRepository.findByUserId(userId);
      const topicEntity = userTopics.find(t => t.id === id);
      
      if (!topicEntity) {
        res.status(404).json({ success: false, error: 'Topic not found or access denied' });
        return;
      }

      // Create updated topic
      const updatedTopic = new MqttTopic(
        topicEntity.name, 
        topicEntity.deviceId, 
        topicEntity.userId, 
        autoSubscribe,
        topicEntity.id,
        topicEntity.createdAt
      );
      
      // Save changes (this would need a proper update method in repository)
      // For now, we'll delete and recreate
      await this.mqttTopicRepository.deleteByNameAndUserId(topicEntity.name, userId);
      const result = await this.mqttTopicRepository.create(updatedTopic);
      
      // Handle subscription changes
      if (autoSubscribe && !topicEntity.autoSubscribe) {
        // Topic now needs subscription
        mqttServiceInstance.subscribe(topicEntity.name);
      } else if (!autoSubscribe && topicEntity.autoSubscribe) {
        // Topic no longer needs subscription
        mqttServiceInstance.unsubscribe(topicEntity.name);
      }
      
      res.status(200).json({ 
        success: true, 
        data: result
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  /**
   * @swagger
   * /mqtt-topics/{id}:
   *   delete:
   *     tags:
   *       - MQTT Topics
   *     summary: Delete an MQTT topic
   *     description: Deletes an MQTT topic if it has no messages and unsubscribes from it
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   *         description: Unique topic identifier
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
   *             examples:
   *               success:
   *                 summary: Successful deletion
   *                 value:
   *                   success: true
   *                   message: "Topic deleted successfully"
   *       400:
   *         description: Cannot delete topic with messages
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             examples:
   *               has_messages:
   *                 summary: Topic has messages
   *                 value:
   *                   success: false
   *                   error: "Cannot delete topic 'robots/sparky/commands' because it has 5 message(s). Delete messages first."
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         description: Topic not found or access denied
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             examples:
   *               not_found:
   *                 summary: Topic not found
   *                 value:
   *                   success: false
   *                   error: "Topic not found or access denied"
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  public async deleteTopic(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user;
      const userId = req.userId;
      
      if (!user || !userId) {
        res.status(401).json({ 
          success: false, 
          error: 'Unauthorized - User not authenticated or invalid token' 
        });
        return;
      }
      
      // Find topic by ID for the authenticated user only
      const userTopics = await this.mqttTopicRepository.findByUserId(userId);
      const topicEntity = userTopics.find(t => t.id === id);
      
      if (!topicEntity) {
        res.status(404).json({ success: false, error: 'Topic not found or access denied' });
        return;
      }

      // Check if topic has messages for this user
      const messageCount = await this.topicMessageRepository.countByTopicOwnerAndUserId(topicEntity.id, userId);
      
      if (messageCount > 0) {
        res.status(400).json({ 
          success: false, 
          error: `Cannot delete topic '${topicEntity.name}' because it has ${messageCount} message(s). Delete messages first.` 
        });
        return;
      }
      
      // Delete topic with user ownership verification
      const deleted = await this.mqttTopicRepository.deleteByNameAndUserId(topicEntity.name, userId);
      
      if (!deleted) {
        res.status(404).json({ success: false, error: 'Topic not found or access denied' });
        return;
      }
      
      // Unsubscribe from the deleted topic
      mqttServiceInstance.unsubscribe(topicEntity.name);
      
      res.status(200).json({ 
        success: true, 
        message: 'Topic deleted successfully' 
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  /**
   * @swagger
   * /mqtt-topics/publish:
   *   post:
   *     tags:
   *       - MQTT Topics
   *     summary: Publish a message to an MQTT topic
   *     description: Publishes a message to the specified MQTT topic and saves it to the database
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               topic:
   *                 type: string
   *                 example: "robots/sparky/commands"
   *                 description: "MQTT topic name to publish to"
   *               message:
   *                 type: string
   *                 example: "{ \"command\": \"W\", \"speed\": 200 }"
   *                 description: "Message content to publish"
   *             required:
   *               - topic
   *               - message
   *           examples:
   *             robot_command:
   *               summary: Robot movement command
   *               value:
   *                 topic: "robots/sparky/commands"
   *                 message: "{ \"command\": \"W\", \"speed\": 200 }"
   *             sensor_data:
   *               summary: Sensor configuration
   *               value:
   *                 topic: "sensors/temperature/config"
   *                 message: "{ \"interval\": 5000, \"unit\": \"celsius\" }"
   *             simple_text:
   *               summary: Simple text message
   *               value:
   *                 topic: "debug/logs"
   *                 message: "System initialized successfully"
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
   *                   example: "Message published to topic 'robots/sparky/commands'"
   *                 data:
   *                   type: object
   *                   properties:
   *                     topic:
   *                       type: string
   *                       example: "robots/sparky/commands"
   *                     message:
   *                       type: string
   *                       example: "{ \"command\": \"W\", \"speed\": 200 }"
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *                       example: "2024-01-20T10:30:00.000Z"
   *             examples:
   *               success:
   *                 summary: Successful publication
   *                 value:
   *                   success: true
   *                   message: "Message published to topic 'robots/sparky/commands'"
   *                   data:
   *                     topic: "robots/sparky/commands"
   *                     message: "{ \"command\": \"W\", \"speed\": 200 }"
   *                     timestamp: "2024-01-20T10:30:00.000Z"
   *       400:
   *         description: Bad request - validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             examples:
   *               missing_topic:
   *                 summary: Missing topic
   *                 value:
   *                   success: false
   *                   error: "Topic is required"
   *               missing_message:
   *                 summary: Missing message
   *                 value:
   *                   success: false
   *                   error: "Message is required"
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         description: Topic not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             examples:
   *               topic_not_found:
   *                 summary: Topic not found
   *                 value:
   *                   success: false
   *                   error: "Topic not found or access denied"
   *       500:
   *         description: Failed to publish message
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             examples:
   *               mqtt_error:
   *                 summary: MQTT publication failed
   *                 value:
   *                   success: false
   *                   error: "Failed to publish message to MQTT topic"
   *               general_error:
   *                 summary: General error
   *                 value:
   *                   success: false
   *                   error: "Error publishing message"
   */
  public async publishMessage(req: Request, res: Response): Promise<void> {
    try {
      const { topic, message } = req.body;
      const user = req.user;
      const userId = req.userId;
      
      if (!user || !userId) {
        res.status(401).json({ 
          success: false, 
          error: 'Unauthorized - User not authenticated or invalid token' 
        });
        return;
      }

      if (!topic) {
        res.status(400).json({ success: false, error: 'Topic is required' });
        return;
      }
      
      if (!message) {
        res.status(400).json({ success: false, error: 'Message is required' });
        return;
      }

      // Find topic to get its ID - from all topics
      const topics = await this.mqttTopicRepository.findAll();
      const topicEntity = topics.find(t => t.name === topic);
      
      if (!topicEntity) {
        res.status(404).json({ success: false, error: 'Topic not found or access denied' });
        return;
      }

      // Publish message to MQTT topic with userId in payload first
      const mqttPayload = JSON.stringify({ message: message, userId: userId });
      
      try {
        mqttServiceInstance.publish(topic, mqttPayload);
        
        // Only save to database after successful MQTT publish
        const topicMessage = new TopicMessage(message, topicEntity.id, userId);
        await this.topicMessageRepository.create(topicMessage);
      } catch (mqttError) {
        console.error('Failed to publish to MQTT:', mqttError);
        res.status(500).json({ success: false, error: 'Failed to publish message to MQTT topic' });
        return;
      }
      
      res.status(200).json({ 
        success: true, 
        message: `Message published to topic '${topic}'`,
        data: {
          topic: topic,
          message: message,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error publishing message:', error);
      res.status(500).json({ success: false, error: 'Error publishing message' });
    }
  }
}