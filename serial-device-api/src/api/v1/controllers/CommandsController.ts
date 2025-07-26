import { Request, Response } from 'express';
import { CommandRepository } from '../../../infrastructure/database/repositories/CommandRepository';
import { ConnectionManager } from '../../../infrastructure/managers/ConnectionManager';

export class CommandsController {
  private commandRepository: CommandRepository;
  private connectionManager: ConnectionManager;

  constructor() {
    this.commandRepository = new CommandRepository();
    this.connectionManager = ConnectionManager.getInstance();
  }

  // GET /devices/:deviceId/commands - Get device commands
  async index(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const status = req.query.status as string;

      let commands = await this.commandRepository.findByDeviceId(deviceId);
      
      // Filter by status if provided
      if (status) {
        commands = commands.filter(cmd => cmd.status === status);
      }

      // Apply limit
      commands = commands.slice(0, limit);

      res.json({
        success: true,
        data: commands,
        count: commands.length,
        filters: {
          deviceId,
          status: status || 'all',
          limit
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  // GET /devices/:deviceId/commands/:id - Get specific command
  async show(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const command = await this.commandRepository.findById(id);
      
      if (!command) {
        res.status(404).json({ 
          success: false, 
          error: 'Command not found' 
        });
        return;
      }

      res.json({
        success: true,
        data: command
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  // POST /devices/:deviceId/commands - Send command to device
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      const { command, value } = req.body;

      if (!command) {
        res.status(400).json({ 
          success: false, 
          error: 'Command is required' 
        });
        return;
      }

      const controller = this.connectionManager.getConnection(deviceId);
      
      if (!controller) {
        res.status(404).json({ 
          success: false, 
          error: `Device ${deviceId} not connected` 
        });
        return;
      }

      // Format command with value if provided
      const commandString = value !== undefined ? `${command}:${value}` : command;
      
      // Send command to device
      const result = await controller.sendData(commandString);
      
      if (result.success) {
        // The command is automatically logged by the device service
        res.status(201).json({
          success: true,
          message: 'Command sent successfully',
          data: {
            deviceId,
            command,
            value,
            commandString,
            sentAt: new Date().toISOString()
          }
        });
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  // PUT /devices/:deviceId/commands/:id/status - Update command status
  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, response } = req.body;

      if (!status || !['acknowledged', 'failed'].includes(status)) {
        res.status(400).json({ 
          success: false, 
          error: 'Valid status (acknowledged/failed) is required' 
        });
        return;
      }

      const updatedCommand = await this.commandRepository.updateStatus(id, status, response);
      
      if (!updatedCommand) {
        res.status(404).json({ 
          success: false, 
          error: 'Command not found' 
        });
        return;
      }

      res.json({
        success: true,
        message: 'Command status updated',
        data: updatedCommand
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  // GET /devices/:deviceId/commands/stats - Get command statistics
  async stats(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      
      const commands = await this.commandRepository.findByDeviceId(deviceId);
      
      const stats = {
        total: commands.length,
        byStatus: {
          sent: commands.filter(cmd => cmd.status === 'sent').length,
          acknowledged: commands.filter(cmd => cmd.status === 'acknowledged').length,
          failed: commands.filter(cmd => cmd.status === 'failed').length
        },
        successRate: commands.length > 0 ? 
          (commands.filter(cmd => cmd.status === 'acknowledged').length / commands.length) * 100 : 0,
        mostUsedCommands: this.getMostUsedCommands(commands),
        dateRange: {
          oldest: commands.length > 0 ? commands[commands.length - 1].sentAt : null,
          newest: commands.length > 0 ? commands[0].sentAt : null
        }
      };

      res.json({
        success: true,
        data: {
          deviceId,
          stats
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  // GET /devices/:deviceId/commands/pending - Get pending commands
  async pending(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      
      const commands = await this.commandRepository.findByDeviceId(deviceId);
      const pendingCommands = commands.filter(cmd => cmd.status === 'sent');

      res.json({
        success: true,
        data: pendingCommands,
        count: pendingCommands.length
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  // POST /devices/:deviceId/commands/batch - Send multiple commands
  async batch(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      const { commands } = req.body;

      if (!Array.isArray(commands) || commands.length === 0) {
        res.status(400).json({ 
          success: false, 
          error: 'Commands array is required' 
        });
        return;
      }

      const controller = this.connectionManager.getConnection(deviceId);
      
      if (!controller) {
        res.status(404).json({ 
          success: false, 
          error: `Device ${deviceId} not connected` 
        });
        return;
      }

      const results = [];
      
      for (const cmd of commands) {
        const { command, value } = cmd;
        if (!command) continue;

        const commandString = value !== undefined ? `${command}:${value}` : command;
        const result = await controller.sendData(commandString);
        
        results.push({
          command,
          value,
          success: result.success,
          error: result.error
        });

        // Small delay between commands
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const successCount = results.filter(r => r.success).length;

      res.status(201).json({
        success: true,
        message: `Batch commands completed: ${successCount}/${results.length} successful`,
        data: {
          deviceId,
          results,
          summary: {
            total: results.length,
            successful: successCount,
            failed: results.length - successCount
          }
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  private getMostUsedCommands(commands: any[]): { command: string; count: number }[] {
    const commandCounts = commands.reduce((acc, cmd) => {
      const baseCommand = cmd.command.split(':')[0]; // Remove value part
      acc[baseCommand] = (acc[baseCommand] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(commandCounts)
      .map(([command, count]) => ({ command, count: count as number }))
      .sort((a, b) => (b.count as number) - (a.count as number))
      .slice(0, 5);
  }
}