import mongoose, { Schema, Document } from 'mongoose';

export interface IMqttTopic extends Document {
  _id: string;
  name: string;
  deviceId: string;
  userId: string;
  autoSubscribe: boolean;
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
    trim: true
  },
  deviceId: {
    type: String,
    required: true,
    ref: 'Device'
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  autoSubscribe: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound unique index to allow same topic name for different users
MqttTopicSchema.index({ name: 1, userId: 1 }, { unique: true });

export const MqttTopicModel = mongoose.model<IMqttTopic>('MqttTopic', MqttTopicSchema, 'mqtt-topics');