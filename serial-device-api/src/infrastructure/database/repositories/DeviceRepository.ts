import { IDeviceRepository } from '../../../domain/repositories/IDeviceRepository';
import { Device } from '../../../domain/entities/Device';
import { DeviceModel } from '../models/DeviceModel';

export class DeviceRepository implements IDeviceRepository {
  async findAll(): Promise<Device[]> {
    const devices = await DeviceModel.find();
    return devices.map(this.toEntity);
  }

  async findById(id: string): Promise<Device | null> {
    const device = await DeviceModel.findById(id);
    return device ? this.toEntity(device) : null;
  }

  async findByDeviceId(deviceId: string): Promise<Device | null> {
    const device = await DeviceModel.findOne({ deviceId });
    return device ? this.toEntity(device) : null;
  }

  async create(device: Omit<Device, '_id' | 'createdAt' | 'updatedAt'>): Promise<Device> {
    const newDevice = new DeviceModel(device);
    const savedDevice = await newDevice.save();
    return this.toEntity(savedDevice);
  }

  async update(id: string, device: Partial<Device>): Promise<Device | null> {
    const updatedDevice = await DeviceModel.findByIdAndUpdate(
      id,
      { ...device, updatedAt: new Date() },
      { new: true }
    );
    return updatedDevice ? this.toEntity(updatedDevice) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await DeviceModel.findByIdAndDelete(id);
    return !!result;
  }

  async updateStatus(deviceId: string, status: Device['status']): Promise<Device | null> {
    const updatedDevice = await DeviceModel.findOneAndUpdate(
      { deviceId },
      { 
        status,
        updatedAt: new Date(),
        'statusHistory.lastStatusChange': new Date()
      },
      { new: true }
    );
    return updatedDevice ? this.toEntity(updatedDevice) : null;
  }

  private toEntity(deviceDoc: any): Device {
    return {
      _id: deviceDoc._id.toString(),
      deviceId: deviceDoc.deviceId,
      name: deviceDoc.name,
      type: deviceDoc.type,
      serialPort: deviceDoc.serialPort,
      status: deviceDoc.status,
      statusHistory: deviceDoc.statusHistory,
      createdAt: deviceDoc.createdAt,
      updatedAt: deviceDoc.updatedAt
    };
  }
}