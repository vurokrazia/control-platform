import { v4 as uuidv4 } from 'uuid';

export class MqttTopic {
  public readonly id: string;
  public readonly name: string;
  public readonly deviceId: string;
  public readonly createdAt: Date;

  constructor(name: string, deviceId: string, id?: string, createdAt?: Date) {
    this.id = id || uuidv4();
    this.name = name;
    this.deviceId = deviceId;
    this.createdAt = createdAt || new Date();
  }
}