import { IMqttTopicRepository } from '../../../domain/repositories/IMqttTopicRepository';
import { MqttTopic } from '../../../domain/entities/MqttTopic';
import { MqttTopicModel } from '../models/MqttTopicModel';

export class MqttTopicRepository implements IMqttTopicRepository {
  
  async findAll(): Promise<MqttTopic[]> {
    const topics = await MqttTopicModel.find().sort({ createdAt: -1 });
    return topics.map(topic => new MqttTopic(
      topic.name,
      topic.deviceId,
      topic.userId,
      topic.autoSubscribe,
      topic._id?.toString(),
      topic.createdAt
    ));
  }

  async findByUserId(userId: string): Promise<MqttTopic[]> {
    const topics = await MqttTopicModel.find({ userId }).sort({ createdAt: -1 });
    return topics.map(topic => new MqttTopic(
      topic.name,
      topic.deviceId,
      topic.userId,
      topic.autoSubscribe,
      topic._id?.toString(),
      topic.createdAt
    ));
  }

  async findByName(name: string): Promise<MqttTopic | null> {
    const topic = await MqttTopicModel.findOne({ name });
    if (!topic) return null;
    
    return new MqttTopic(
      topic.name,
      topic.deviceId,
      topic.userId,
      topic.autoSubscribe,
      topic._id?.toString(),
      topic.createdAt
    );
  }

  async create(topic: MqttTopic): Promise<MqttTopic> {
    const newTopic = new MqttTopicModel({ 
      _id: topic.id,
      name: topic.name,
      deviceId: topic.deviceId,
      userId: topic.userId,
      autoSubscribe: topic.autoSubscribe
    });
    const savedTopic = await newTopic.save();
    
    return new MqttTopic(
      savedTopic.name,
      savedTopic.deviceId,
      savedTopic.userId,
      savedTopic.autoSubscribe,
      savedTopic._id?.toString(),
      savedTopic.createdAt
    );
  }

  async deleteByName(name: string): Promise<boolean> {
    const result = await MqttTopicModel.findOneAndDelete({ name });
    return result !== null;
  }

  async deleteByNameAndUserId(name: string, userId: string): Promise<boolean> {
    const result = await MqttTopicModel.findOneAndDelete({ name, userId });
    return result !== null;
  }

  async findAutoSubscribeTopics(): Promise<MqttTopic[]> {
    const topics = await MqttTopicModel.find({ autoSubscribe: true }).sort({ createdAt: -1 });
    return topics.map(topic => new MqttTopic(
      topic.name,
      topic.deviceId,
      topic.userId,
      topic.autoSubscribe,
      topic._id?.toString(),
      topic.createdAt
    ));
  }
}