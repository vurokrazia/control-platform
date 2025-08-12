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
  
  public async getAllTopics(_req: Request, res: Response): Promise<void> {
    try {
      const topics = await this.mqttTopicRepository.findAll();
      
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
      
      if (!name) {
        res.status(400).json({ success: false, error: 'Topic name is required' });
        return;
      }

      if (!deviceId) {
        res.status(400).json({ success: false, error: 'Device ID is required' });
        return;
      }

      const newTopic = new MqttTopic(name, deviceId);
      const createdTopic = await this.mqttTopicRepository.create(newTopic);
      
      // Subscribe to the new topic
      mqttServiceInstance.subscribe(name);
      
      res.status(201).json({ 
        success: true, 
        data: createdTopic 
      });
    } catch (error: any) {
      if (error.code === 11000) {
        res.status(400).json({ success: false, error: 'Topic already exists' });
      } else {
        res.status(500).json({ success: false, error: 'Internal server error' });
      }
    }
  }

  public async deleteTopic(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Find topic by ID
      const topics = await this.mqttTopicRepository.findAll();
      const topicEntity = topics.find(t => t.id === id);
      
      if (!topicEntity) {
        res.status(404).json({ success: false, error: 'Topic not found' });
        return;
      }

      // Check if topic has messages
      const messageCount = await this.topicMessageRepository.countByTopicOwner(topicEntity.id);
      
      if (messageCount > 0) {
        res.status(400).json({ 
          success: false, 
          error: `Cannot delete topic '${topicEntity.name}' because it has ${messageCount} message(s). Delete messages first.` 
        });
        return;
      }
      
      const deleted = await this.mqttTopicRepository.deleteByName(topicEntity.name);
      
      if (!deleted) {
        res.status(404).json({ success: false, error: 'Topic not found' });
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
      
      if (!topic) {
        res.status(400).json({ success: false, error: 'Topic is required' });
        return;
      }
      
      if (!message) {
        res.status(400).json({ success: false, error: 'Message is required' });
        return;
      }

      // Find topic to get its ID
      const topics = await this.mqttTopicRepository.findAll();
      const topicEntity = topics.find(t => t.name === topic);
      
      if (!topicEntity) {
        res.status(404).json({ success: false, error: 'Topic not found' });
        return;
      }

      // Publish message to MQTT topic
      mqttServiceInstance.publish(topic, message);
      
      // Save message to database
      const topicMessage = new TopicMessage(message, topicEntity.id);
      await this.topicMessageRepository.create(topicMessage);
      
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