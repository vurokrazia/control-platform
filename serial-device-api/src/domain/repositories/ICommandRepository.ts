import { Command } from '../entities/Command';

export interface ICommandRepository {
  findById(id: string): Promise<Command | null>;
  findByDeviceId(deviceId: string): Promise<Command[]>;
  create(command: Omit<Command, '_id'>): Promise<Command>;
  updateStatus(id: string, status: Command['status'], response?: string): Promise<Command | null>;
}