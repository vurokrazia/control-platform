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

  public async createTopic(req: Request, res: Response): Promise<void> {
    try {
      const { name, deviceId } = req.body;
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
      const newTopic = new MqttTopic(name, deviceId, userId);
      const createdTopic = await this.mqttTopicRepository.create(newTopic);
      
      // Subscribe to the new topic
      mqttServiceInstance.subscribe(name);
      
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

      // Publish message to MQTT topic with userId in payload
      const mqttPayload = JSON.stringify({ message: message, userId: userId });
      mqttServiceInstance.publish(topic, mqttPayload);
      
      // Save message to database with user ownership
      let topicMessage: TopicMessage;
      try {
        topicMessage = new TopicMessage(message, topicEntity.id, userId);
        await this.topicMessageRepository.create(topicMessage);
      } catch (dbError: any) {
        console.error('Database error saving message:', dbError);
        res.status(500).json({ 
          success: false, 
          error: 'Failed to save message to database',
          details: dbError.message 
        });
        return;
      }
      
      res.status(200).json({ 
        success: true, 
        message: `Message published to topic '${topic}'`,
        data: {
          topic: topic,
          message: message,
          messageId: topicMessage.id,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error publishing message:', error);
      res.status(500).json({ success: false, error: 'Error publishing message' });
    }
  }
}