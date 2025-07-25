import mongoose, { Schema, Document } from 'mongoose';
import { Command } from '../../../domain/entities/Command';

export interface CommandDocument extends Omit<Command, '_id'>, Document {}

const CommandSchema = new Schema({
  deviceId: { type: String, required: true },
  command: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed },
  status: { type: String, enum: ['sent', 'acknowledged', 'failed'], required: true },
  sentAt: { type: Date, required: true, default: Date.now },
  response: { type: String }
});

CommandSchema.index({ deviceId: 1, sentAt: -1 });
CommandSchema.index({ status: 1 });

export const CommandModel = mongoose.model<CommandDocument>('Command', CommandSchema);