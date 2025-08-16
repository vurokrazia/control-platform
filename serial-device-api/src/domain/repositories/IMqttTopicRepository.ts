import { MqttTopic } from '../entities/MqttTopic';

export interface IMqttTopicRepository {
  findAll(): Promise<MqttTopic[]>;
  findByUserId(userId: string): Promise<MqttTopic[]>;
  findByName(name: string): Promise<MqttTopic | null>;
  create(topic: MqttTopic): Promise<MqttTopic>;
  deleteByName(name: string): Promise<boolean>;
  deleteByNameAndUserId(name: string, userId: string): Promise<boolean>;
  findAutoSubscribeTopics(): Promise<MqttTopic[]>;
}