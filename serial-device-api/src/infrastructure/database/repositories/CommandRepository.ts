import { ICommandRepository } from '../../../domain/repositories/ICommandRepository';
import { Command } from '../../../domain/entities/Command';
import { CommandModel } from '../models/CommandModel';

export class CommandRepository implements ICommandRepository {
  async findById(id: string): Promise<Command | null> {
    const command = await CommandModel.findById(id);
    return command ? this.toEntity(command) : null;
  }

  async findByDeviceId(deviceId: string): Promise<Command[]> {
    const commands = await CommandModel
      .find({ deviceId })
      .sort({ sentAt: -1 });
    return commands.map(this.toEntity);
  }

  async create(command: Omit<Command, '_id'>): Promise<Command> {
    const newCommand = new CommandModel(command);
    const savedCommand = await newCommand.save();
    return this.toEntity(savedCommand);
  }

  async updateStatus(id: string, status: Command['status'], response?: string): Promise<Command | null> {
    const updateData: any = { status };
    if (response) {
      updateData.response = response;
    }

    const updatedCommand = await CommandModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    return updatedCommand ? this.toEntity(updatedCommand) : null;
  }

  private toEntity(commandDoc: any): Command {
    return {
      _id: commandDoc._id.toString(),
      deviceId: commandDoc.deviceId,
      command: commandDoc.command,
      value: commandDoc.value,
      status: commandDoc.status,
      sentAt: commandDoc.sentAt,
      response: commandDoc.response
    };
  }
}