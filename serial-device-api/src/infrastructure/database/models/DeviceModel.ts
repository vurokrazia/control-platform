import mongoose, { Schema, Document } from 'mongoose';
import { Device } from '../../../domain/entities/Device';

export interface DeviceDocument extends Omit<Device, '_id'>, Document {}

const SerialPortInfoSchema = new Schema({
  path: { type: String, required: true },
  manufacturer: { type: String },
  serialNumber: { type: String },
  vendorId: { type: String },
  productId: { type: String },
  baudRate: { type: Number, required: true }
});

const DeviceStatusSchema = new Schema({
  isConnected: { type: Boolean, required: true, default: false },
  lastConnected: { type: Date },
  bufferSize: { type: Number, required: true, default: 0 }
});

const DeviceStatusHistorySchema = new Schema({
  totalConnections: { type: Number, default: 0 },
  totalDisconnections: { type: Number, default: 0 },
  totalUptime: { type: Number, default: 0 },
  lastStatusChange: { type: Date, default: Date.now },
  averageConnectionDuration: { type: Number, default: 0 }
});

const DeviceSchema = new Schema({
  deviceId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  userId: { type: String, required: true, ref: 'User' },
  serialPort: { type: SerialPortInfoSchema, required: false },
  status: { type: DeviceStatusSchema, required: true },
  statusHistory: { type: DeviceStatusHistorySchema, required: true }
}, {
  timestamps: true
});

// Index for user-based queries
DeviceSchema.index({ userId: 1 });

export const DeviceModel = mongoose.model<DeviceDocument>('Device', DeviceSchema);