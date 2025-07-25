import { IDeviceDataRepository } from '../../../domain/repositories/IDeviceDataRepository';
import { DeviceData } from '../../../domain/entities/DeviceData';
import { DeviceDataModel } from '../models/DeviceDataModel';

export class DeviceDataRepository implements IDeviceDataRepository {
  async findAll(): Promise<DeviceData[]> {
    const data = await DeviceDataModel.find().sort({ timestamp: -1 });
    return data.map(this.toEntity);
  }

  async findById(id: string): Promise<DeviceData | null> {
    const data = await DeviceDataModel.findById(id);
    return data ? this.toEntity(data) : null;
  }

  async findByDeviceId(deviceId: string, limit: number = 100): Promise<DeviceData[]> {
    const data = await DeviceDataModel
      .find({ deviceId })
      .sort({ timestamp: -1 })
      .limit(limit);
    return data.map(this.toEntity);
  }

  async findBySessionId(sessionId: string): Promise<DeviceData[]> {
    const data = await DeviceDataModel
      .find({ sessionId })
      .sort({ timestamp: -1 });
    return data.map(this.toEntity);
  }

  async create(data: Omit<DeviceData, '_id'>): Promise<DeviceData> {
    const newData = new DeviceDataModel(data);
    const savedData = await newData.save();
    return this.toEntity(savedData);
  }

  async deleteOldData(deviceId: string, keepLast: number): Promise<number> {
    const dataToKeep = await DeviceDataModel
      .find({ deviceId })
      .sort({ timestamp: -1 })
      .limit(keepLast)
      .select('_id');

    const keepIds = dataToKeep.map(d => d._id);
    
    const result = await DeviceDataModel.deleteMany({
      deviceId,
      _id: { $nin: keepIds }
    });

    return result.deletedCount || 0;
  }

  private toEntity(dataDoc: any): DeviceData {
    return {
      _id: dataDoc._id.toString(),
      deviceId: dataDoc.deviceId,
      data: dataDoc.data,
      direction: dataDoc.direction,
      timestamp: dataDoc.timestamp,
      sessionId: dataDoc.sessionId
    };
  }
}