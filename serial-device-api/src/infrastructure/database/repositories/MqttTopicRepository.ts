import { IMqttTopicRepository } from '../../../domain/repositories/IMqttTopicRepository';
import { MqttTopic } from '../../../domain/entities/MqttTopic';
import { MqttTopicModel } from '../models/MqttTopicModel';

export class MqttTopicRepository implements IMqttTopicRepository {
  
  async findAll(): Promise<MqttTopic[]> {
    const topics = await MqttTopicModel.find().sort({ createdAt: -1 });
    return topics.map(topic => new MqttTopic(
      topic.name,
      topic.deviceId,
      topic._id?.toString(),
      topic.createdAt
    ));
  }

  async create(topic: MqttTopic): Promise<MqttTopic> {
    const newTopic = new MqttTopicModel({ 
      _id: topic.id,
      name: topic.name,
      deviceId: topic.deviceId
    });
    const savedTopic = await newTopic.save();
    
    return new MqttTopic(
      savedTopic.name,
      savedTopic.deviceId,
      savedTopic._id?.toString(),
      savedTopic.createdAt
    );
  }

  async deleteByName(name: string): Promise<boolean> {
    const result = await MqttTopicModel.findOneAndDelete({ name });
    return result !== null;
  }
}