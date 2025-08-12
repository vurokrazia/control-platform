import { TopicMessage } from '../entities/TopicMessage';

export interface ITopicMessageRepository {
  create(message: TopicMessage): Promise<TopicMessage>;
  findByTopicOwner(topicOwner: string): Promise<TopicMessage[]>;
  countByTopicOwner(topicOwner: string): Promise<number>;
}