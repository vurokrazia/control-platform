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
      
      // Verify topic exists
      const topics = await this.mqttTopicRepository.findAll();
      const topicEntity = topics.find(t => t.id === topicId);
      
      if (!topicEntity) {
        res.status(404).json({ success: false, error: 'Topic not found' });
        return;
      }

      // Get messages for this topic
      const messages = await this.topicMessageRepository.findByTopicOwner(topicId);
      
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