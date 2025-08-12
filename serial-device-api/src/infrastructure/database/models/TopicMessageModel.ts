import mongoose, { Schema, Document } from 'mongoose';

export interface ITopicMessage extends Document {
  _id: string;
  payload: string;
  topicOwner: string; // Topic ID reference
  createdAt: Date;
}

const TopicMessageSchema: Schema = new Schema({
  _id: {
    type: String,
    required: true
  },
  payload: {
    type: String,
    required: true
  },
  topicOwner: {
    type: String,
    required: true,
    ref: 'MqttTopic'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for better performance
TopicMessageSchema.index({ topicOwner: 1, createdAt: -1 });

export const TopicMessageModel = mongoose.model<ITopicMessage>('TopicMessage', TopicMessageSchema, 'topicMessages');