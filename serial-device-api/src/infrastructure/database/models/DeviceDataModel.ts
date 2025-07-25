import mongoose, { Schema, Document } from 'mongoose';
import { DeviceData } from '../../../domain/entities/DeviceData';

export interface DeviceDataDocument extends Omit<DeviceData, '_id'>, Document {}

const DeviceDataSchema = new Schema({
  deviceId: { type: String, required: true },
  data: { type: String, required: true },
  direction: { type: String, enum: ['incoming', 'outgoing'], required: true },
  timestamp: { type: Date, required: true, default: Date.now },
  sessionId: { type: String }
});

DeviceDataSchema.index({ deviceId: 1, timestamp: -1 });
DeviceDataSchema.index({ sessionId: 1 });

export const DeviceDataModel = mongoose.model<DeviceDataDocument>('DeviceData', DeviceDataSchema);