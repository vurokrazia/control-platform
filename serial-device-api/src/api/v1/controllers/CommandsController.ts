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

  /**
   * @swagger
   * /devices/{deviceId}/commands:
   *   get:
   *     tags: [Arduino]
   *     summary: Get device commands
   *     description: Retrieve command history for a specific device
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/DeviceId'
   *       - name: limit
   *         in: query
   *         required: false
   *         schema:
   *           type: integer
   *           default: 50
   *           minimum: 1
   *           maximum: 100
   *         description: Maximum number of commands to return
   *       - name: status
   *         in: query
   *         required: false
   *         schema:
   *           type: string
   *           enum: [sent, acknowledged, failed]
   *         description: Filter commands by status
   *     responses:
   *       200:
   *         description: Successfully retrieved commands
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Command'
   *                     count:
   *                       type: integer
   *                       example: 25
   *                     filters:
   *                       type: object
   *                       properties:
   *                         deviceId:
   *                           type: string
   *                         status:
   *                           type: string
   *                         limit:
   *                           type: integer
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
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

  /**
   * @swagger
   * /devices/{deviceId}/commands/{id}:
   *   get:
   *     tags: [Arduino]
   *     summary: Get specific command
   *     description: Retrieve details of a specific command
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/DeviceId'
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *         description: Command ID
   *     responses:
   *       200:
   *         description: Successfully retrieved command
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Command'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
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

  /**
   * @swagger
   * /devices/{deviceId}/commands:
   *   post:
   *     tags: [Arduino]
   *     summary: Send command to device
   *     description: Send a command to the connected Arduino device
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/DeviceId'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CommandRequest'
   *     responses:
   *       201:
   *         description: Command sent successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     message:
   *                       type: string
   *                       example: 'Command sent successfully'
   *                     data:
   *                       type: object
   *                       properties:
   *                         deviceId:
   *                           type: string
   *                         command:
   *                           type: string
   *                         value:
   *                           oneOf:
   *                             - type: string
   *                             - type: number
   *                         commandString:
   *                           type: string
   *                         sentAt:
   *                           type: string
   *                           format: date-time
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
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

  /**
   * @swagger
   * /devices/{deviceId}/commands/{id}/status:
   *   put:
   *     tags: [Arduino]
   *     summary: Update command status
   *     description: Update the status of a previously sent command
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/DeviceId'
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *         description: Command ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [acknowledged, failed]
   *                 description: New command status
   *               response:
   *                 type: string
   *                 description: Optional response message from device
   *             required: [status]
   *     responses:
   *       200:
   *         description: Command status updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     message:
   *                       type: string
   *                       example: 'Command status updated'
   *                     data:
   *                       $ref: '#/components/schemas/Command'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
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

  /**
   * @swagger
   * /devices/{deviceId}/commands/stats:
   *   get:
   *     tags: [Arduino]
   *     summary: Get command statistics
   *     description: Retrieve statistical information about device commands
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/DeviceId'
   *     responses:
   *       200:
   *         description: Successfully retrieved command statistics
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: object
   *                       properties:
   *                         deviceId:
   *                           type: string
   *                         stats:
   *                           $ref: '#/components/schemas/CommandStats'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
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

  /**
   * @swagger
   * /devices/{deviceId}/commands/pending:
   *   get:
   *     tags: [Arduino]
   *     summary: Get pending commands
   *     description: Retrieve commands that have been sent but not yet acknowledged
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/DeviceId'
   *     responses:
   *       200:
   *         description: Successfully retrieved pending commands
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Command'
   *                     count:
   *                       type: integer
   *                       example: 3
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
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

  /**
   * @swagger
   * /devices/{deviceId}/commands/batch:
   *   post:
   *     tags: [Arduino]
   *     summary: Send multiple commands
   *     description: Send multiple commands to the device in sequence
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/DeviceId'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               commands:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     command:
   *                       type: string
   *                       example: 'LED'
   *                     value:
   *                       oneOf:
   *                         - type: string
   *                         - type: number
   *                       example: 'ON'
   *                   required: [command]
   *                 minItems: 1
   *                 example:
   *                   - command: 'LED'
   *                     value: 'ON'
   *                   - command: 'MOTOR'
   *                     value: 255
   *             required: [commands]
   *     responses:
   *       201:
   *         description: Batch commands completed
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     message:
   *                       type: string
   *                       example: 'Batch commands completed: 2/2 successful'
   *                     data:
   *                       type: object
   *                       properties:
   *                         deviceId:
   *                           type: string
   *                         results:
   *                           type: array
   *                           items:
   *                             type: object
   *                             properties:
   *                               command:
   *                                 type: string
   *                               value:
   *                                 oneOf:
   *                                   - type: string
   *                                   - type: number
   *                               success:
   *                                 type: boolean
   *                               error:
   *                                 type: string
   *                         summary:
   *                           type: object
   *                           properties:
   *                             total:
   *                               type: integer
   *                             successful:
   *                               type: integer
   *                             failed:
   *                               type: integer
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
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