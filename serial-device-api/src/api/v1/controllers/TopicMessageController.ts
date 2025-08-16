import { Request, Response } from 'express';
import { TopicMessageRepository } from '../../../infrastructure/database/repositories/TopicMessageRepository';
import { MqttTopicRepository } from '../../../infrastructure/database/repositories/MqttTopicRepository';

export class TopicMessageController {
  private topicMessageRepository: TopicMessageRepository;
  private mqttTopicRepository: MqttTopicRepository;

  constructor() {
    this.topicMessageRepository = new TopicMessageRepository();
    this.mqttTopicRepository = new MqttTopicRepository();
  }

  /**
   * @swagger
   * /topics/{topicId}/topicMessages:
   *   get:
   *     tags:
   *       - Topic Messages
   *     summary: Get messages for a specific MQTT topic
   *     description: Retrieves all messages for the specified topic that belong to the authenticated user
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: topicId
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   *         description: Unique topic identifier
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
   *                           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   *                         name:
   *                           type: string
   *                           example: "robots/sparky/commands"
   *                         createdAt:
   *                           type: string
   *                           format: date-time
   *                           example: "2024-01-20T10:00:00.000Z"
   *                     messages:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/TopicMessage'
   *                     messageCount:
   *                       type: integer
   *                       example: 5
   *             examples:
   *               success:
   *                 summary: Successful response with messages
   *                 value:
   *                   success: true
   *                   data:
   *                     topic:
   *                       id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   *                       name: "robots/sparky/commands"
   *                       createdAt: "2024-01-20T10:00:00.000Z"
   *                     messages:
   *                       - id: "msg-1234-5678-9abc-def0"
   *                         payload: "{ \"command\": \"W\", \"speed\": 200 }"
   *                         topicOwner: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   *                         userId: "user-a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   *                         createdAt: "2024-01-20T10:30:00.000Z"
   *                       - id: "msg-2345-6789-bcde-f012"
   *                         payload: "{ \"command\": \"S\" }"
   *                         topicOwner: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   *                         userId: "user-a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   *                         createdAt: "2024-01-20T10:35:00.000Z"
   *                     messageCount: 2
   *               empty:
   *                 summary: No messages found
   *                 value:
   *                   success: true
   *                   data:
   *                     topic:
   *                       id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   *                       name: "robots/sparky/commands"
   *                       createdAt: "2024-01-20T10:00:00.000Z"
   *                     messages: []
   *                     messageCount: 0
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
  public async getMessagesByTopicId(req: Request, res: Response): Promise<void> {
    try {
      const { topicId } = req.params;
      const user = req.user;
      const userId = req.userId;
      
      if (!user || !userId) {
        res.status(401).json({ 
          success: false, 
          error: 'Unauthorized - User not authenticated or invalid token' 
        });
        return;
      }
      
      // Verify topic exists and belongs to user
      const userTopics = await this.mqttTopicRepository.findByUserId(userId);
      const topicEntity = userTopics.find(t => t.id === topicId);

      if (!topicEntity) {
        console.log('Topic not found or access denied');
        res.status(404).json({ success: false, error: 'Topic not found or access denied' });
        return;
      }

      // Get messages for this topic and user only
      const messages = await this.topicMessageRepository.findByTopicOwnerAndUserId(topicId, userId);
      
      res.status(200).json({ 
        success: true, 
        data: {
          topic: {
            id: topicEntity.id,
            name: topicEntity.name,
            createdAt: topicEntity.createdAt
          },
          messages: messages,
          messageCount: messages.length
        }
      });
    } catch (error) {
      console.error('Error getting topic messages:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}