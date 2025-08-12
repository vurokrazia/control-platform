import mongoose, { Schema, Document } from 'mongoose';

export interface IMqttTopic extends Document {
  _id: string;
  name: string;
  deviceId: string;
  createdAt: Date;
}

const MqttTopicSchema: Schema = new Schema({
  _id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  deviceId: {
    type: String,
    required: true,
    ref: 'Device'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const MqttTopicModel = mongoose.model<IMqttTopic>('MqttTopic', MqttTopicSchema, 'mqtt-topics');