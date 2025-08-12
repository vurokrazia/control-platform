import { v4 as uuidv4 } from 'uuid';

export class TopicMessage {
  public readonly id: string;
  public readonly payload: string;
  public readonly topicOwner: string;
  public readonly createdAt: Date;

  constructor(payload: string, topicOwner: string, id?: string, createdAt?: Date) {
    this.id = id || uuidv4();
    this.payload = payload;
    this.topicOwner = topicOwner;
    this.createdAt = createdAt || new Date();
  }
}