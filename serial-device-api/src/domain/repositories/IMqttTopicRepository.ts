import { MqttTopic } from '../entities/MqttTopic';

export interface IMqttTopicRepository {
  findAll(): Promise<MqttTopic[]>;
  create(topic: MqttTopic): Promise<MqttTopic>;
  deleteByName(name: string): Promise<boolean>;
}