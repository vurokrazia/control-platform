import mongoose, { Schema, Document } from 'mongoose';
import { DeviceSession } from '../../../domain/entities/DeviceSession';

export interface DeviceSessionDocument extends Omit<DeviceSession, '_id'>, Document {}

const ConnectionInfoSchema = new Schema({
  connectedAt: { type: Date, required: true },
  disconnectedAt: { type: Date },
  duration: { type: Number },
  reason: { type: String, required: true }
});

const SessionUsageSchema = new Schema({
  commandsSent: { type: Number, default: 0 },
  dataReceived: { type: Number, default: 0 },
  gesturesDetected: { type: Number, default: 0 },
  errors: { type: Number, default: 0 }
});

const DeviceSessionSchema = new Schema({
  deviceId: { type: String, required: true },
  sessionDate: { type: Date, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  isActive: { type: Boolean, required: true, default: true },
  totalDuration: { type: Number, default: 0 },
  connections: [ConnectionInfoSchema],
  usage: { type: SessionUsageSchema, required: true }
}, {
  timestamps: true
});

DeviceSessionSchema.index({ deviceId: 1, sessionDate: 1 }, { unique: true });

export const DeviceSessionModel = mongoose.model<DeviceSessionDocument>('DeviceSession', DeviceSessionSchema);