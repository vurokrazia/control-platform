import { TopicMessage } from '../entities/TopicMessage';

export interface ITopicMessageRepository {
  create(message: TopicMessage): Promise<TopicMessage>;
  findByTopicOwner(topicOwner: string): Promise<TopicMessage[]>;
  findByTopicOwnerAndUserId(topicOwner: string, userId: string): Promise<TopicMessage[]>;
  findByUserId(userId: string): Promise<TopicMessage[]>;
  countByTopicOwner(topicOwner: string): Promise<number>;
  countByTopicOwnerAndUserId(topicOwner: string, userId: string): Promise<number>;
}