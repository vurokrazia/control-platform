import { Request, Response } from 'express';
import { SerialPort } from 'serialport';

export class SerialPortsController {
  
  // GET /serial-ports - List available serial ports
  async index(_req: Request, res: Response): Promise<void> {
    try {
      const ports = await SerialPort.list();
      
      const mappedPorts = ports.map(port => ({
        path: port.path,
        manufacturer: port.manufacturer,
        serialNumber: port.serialNumber,
        vendorId: port.vendorId,
        productId: port.productId,
        available: true
      }));

      res.json({
        success: true,
        data: mappedPorts,
        count: mappedPorts.length
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  // GET /serial-ports/:path/info - Get specific port information
  async show(req: Request, res: Response): Promise<void> {
    try {
      const { path } = req.params;
      const decodedPath = decodeURIComponent(path);
      
      const ports = await SerialPort.list();
      const port = ports.find(p => p.path === decodedPath);
      
      if (!port) {
        res.status(404).json({ 
          success: false, 
          error: `Serial port ${decodedPath} not found` 
        });
        return;
      }

      res.json({
        success: true,
        data: {
          path: port.path,
          manufacturer: port.manufacturer,
          serialNumber: port.serialNumber,
          vendorId: port.vendorId,
          productId: port.productId,
          available: true,
          capabilities: {
            supportedBaudRates: [9600, 19200, 38400, 57600, 115200],
            defaultBaudRate: 9600
          }
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }
}