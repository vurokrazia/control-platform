import { v4 as uuidv4 } from 'uuid';

export class MqttTopic {
  public readonly id: string;
  public readonly name: string;
  public readonly deviceId: string;
  public readonly userId: string;
  public readonly autoSubscribe: boolean;
  public readonly createdAt: Date;

  constructor(name: string, deviceId: string, userId: string, autoSubscribe: boolean = true, id?: string, createdAt?: Date) {
    this.id = id || uuidv4();
    this.name = name;
    this.deviceId = deviceId;
    this.userId = userId;
    this.autoSubscribe = autoSubscribe;
    this.createdAt = createdAt || new Date();
  }
}