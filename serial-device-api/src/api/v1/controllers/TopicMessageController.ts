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