import { ITopicMessageRepository } from '../../../domain/repositories/ITopicMessageRepository';
import { TopicMessage } from '../../../domain/entities/TopicMessage';
import { TopicMessageModel } from '../models/TopicMessageModel';

export class TopicMessageRepository implements ITopicMessageRepository {
  
  async create(message: TopicMessage): Promise<TopicMessage> {
    const newMessage = new TopicMessageModel({
      _id: message.id,
      payload: message.payload,
      topicOwner: message.topicOwner,
      userId: message.userId
    });
    const savedMessage = await newMessage.save();
    
    return new TopicMessage(
      savedMessage.payload,
      savedMessage.topicOwner,
      savedMessage.userId,
      savedMessage._id?.toString(),
      savedMessage.createdAt
    );
  }

  async findByTopicOwner(topicOwner: string): Promise<TopicMessage[]> {
    const messages = await TopicMessageModel.find({ topicOwner }).sort({ createdAt: -1 });
    return messages.map(msg => new TopicMessage(
      msg.payload,
      msg.topicOwner,
      msg.userId,
      msg._id?.toString(),
      msg.createdAt
    ));
  }

  async findByTopicOwnerAndUserId(topicOwner: string, userId: string): Promise<TopicMessage[]> {
    console.log( topicOwner, userId);
    const messages = await TopicMessageModel.find({ topicOwner }).sort({ createdAt: -1 });
    return messages.map(msg => new TopicMessage(
      msg.payload,
      msg.topicOwner,
      msg.userId,
      msg._id?.toString(),
      msg.createdAt
    ));
  }

  async findByUserId(userId: string): Promise<TopicMessage[]> {
    const messages = await TopicMessageModel.find({ userId }).sort({ createdAt: -1 });
    return messages.map(msg => new TopicMessage(
      msg.payload,
      msg.topicOwner,
      msg.userId,
      msg._id?.toString(),
      msg.createdAt
    ));
  }

  async countByTopicOwner(topicOwner: string): Promise<number> {
    return await TopicMessageModel.countDocuments({ topicOwner });
  }

  async countByTopicOwnerAndUserId(topicOwner: string, userId: string): Promise<number> {
    return await TopicMessageModel.countDocuments({ topicOwner, userId });
  }
}