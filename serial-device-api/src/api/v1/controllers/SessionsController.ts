import { Request, Response } from 'express';
import { DeviceSessionRepository } from '../../../infrastructure/database/repositories/DeviceSessionRepository';

export class SessionsController {
  private sessionRepository: DeviceSessionRepository;

  constructor() {
    this.sessionRepository = new DeviceSessionRepository();
  }

  /**
   * @swagger
   * /devices/{deviceId}/sessions:
   *   get:
   *     tags: [Sessions]
   *     summary: Get device sessions
   *     description: Retrieve session history for a specific device
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/DeviceId'
   *       - name: limit
   *         in: query
   *         required: false
   *         schema:
   *           type: integer
   *           default: 30
   *           minimum: 1
   *           maximum: 100
   *         description: Maximum number of sessions to return
   *     responses:
   *       200:
   *         description: Successfully retrieved device sessions
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
   *                         $ref: '#/components/schemas/DeviceSession'
   *                     count:
   *                       type: integer
   *                       example: 15
   *                     pagination:
   *                       type: object
   *                       properties:
   *                         limit:
   *                           type: integer
   *                         total:
   *                           type: integer
   *                         hasMore:
   *                           type: boolean
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  async index(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      const limit = parseInt(req.query.limit as string) || 30;
      
      const sessions = await this.sessionRepository.findByDeviceId(deviceId);
      const limitedSessions = sessions.slice(0, limit);

      res.json({
        success: true,
        data: limitedSessions,
        count: limitedSessions.length,
        pagination: {
          limit,
          total: sessions.length,
          hasMore: sessions.length > limit
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  /**
   * @swagger
   * /devices/{deviceId}/sessions/{id}:
   *   get:
   *     tags: [Sessions]
   *     summary: Get specific session
   *     description: Retrieve details of a specific device session
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/DeviceId'
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *         description: Session ID
   *     responses:
   *       200:
   *         description: Successfully retrieved session
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/DeviceSession'
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
      
      const session = await this.sessionRepository.findById(id);
      
      if (!session) {
        res.status(404).json({ 
          success: false, 
          error: 'Session not found' 
        });
        return;
      }

      res.json({
        success: true,
        data: session
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  /**
   * @swagger
   * /devices/{deviceId}/sessions/active:
   *   get:
   *     tags: [Sessions]
   *     summary: Get active session
   *     description: Retrieve the currently active session for a device
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/DeviceId'
   *     responses:
   *       200:
   *         description: Successfully retrieved active session
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/DeviceSession'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  async active(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      
      const activeSession = await this.sessionRepository.findActiveSession(deviceId);
      
      if (!activeSession) {
        res.status(404).json({ 
          success: false, 
          error: 'No active session found for this device' 
        });
        return;
      }

      res.json({
        success: true,
        data: activeSession
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  /**
   * @swagger
   * /devices/{deviceId}/sessions/today:
   *   get:
   *     tags: [Sessions]
   *     summary: Get today's session
   *     description: Retrieve the session for today for a specific device
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/DeviceId'
   *     responses:
   *       200:
   *         description: Successfully retrieved today's session
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/DeviceSession'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  async today(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      
      const todaySession = await this.sessionRepository.findTodaySession(deviceId);
      
      if (!todaySession) {
        res.status(404).json({ 
          success: false, 
          error: 'No session found for today' 
        });
        return;
      }

      res.json({
        success: true,
        data: todaySession
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  /**
   * @swagger
   * /devices/{deviceId}/sessions/{id}/end:
   *   post:
   *     tags: [Sessions]
   *     summary: End a session
   *     description: Manually end an active device session
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/DeviceId'
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *         description: Session ID
   *     responses:
   *       200:
   *         description: Session ended successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     message:
   *                       type: string
   *                       example: 'Session ended successfully'
   *                     data:
   *                       $ref: '#/components/schemas/DeviceSession'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  async end(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const endedSession = await this.sessionRepository.endSession(id);
      
      if (!endedSession) {
        res.status(404).json({ 
          success: false, 
          error: 'Session not found' 
        });
        return;
      }

      res.json({
        success: true,
        message: 'Session ended successfully',
        data: endedSession
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  /**
   * @swagger
   * /devices/{deviceId}/sessions/stats:
   *   get:
   *     tags: [Sessions]
   *     summary: Get session statistics
   *     description: Retrieve statistical information about device sessions
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/DeviceId'
   *       - name: days
   *         in: query
   *         required: false
   *         schema:
   *           type: integer
   *           default: 30
   *           minimum: 1
   *           maximum: 365
   *         description: Number of days to include in statistics
   *     responses:
   *       200:
   *         description: Successfully retrieved session statistics
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
   *                           $ref: '#/components/schemas/SessionStats'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  async stats(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      const days = parseInt(req.query.days as string) || 30;
      
      const sessions = await this.sessionRepository.findByDeviceId(deviceId);
      
      // Filter sessions by date range
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const recentSessions = sessions.filter(session => 
        session.sessionDate >= cutoffDate
      );

      const stats = {
        totalSessions: recentSessions.length,
        activeDays: recentSessions.length,
        totalUsageTime: recentSessions.reduce((sum, session) => sum + session.totalDuration, 0),
        averageSessionDuration: recentSessions.length > 0 ? 
          recentSessions.reduce((sum, session) => sum + session.totalDuration, 0) / recentSessions.length : 0,
        totalCommands: recentSessions.reduce((sum, session) => sum + session.usage.commandsSent, 0),
        totalDataReceived: recentSessions.reduce((sum, session) => sum + session.usage.dataReceived, 0),
        totalErrors: recentSessions.reduce((sum, session) => sum + session.usage.errorCount, 0),
        longestSession: this.getLongestSession(recentSessions),
        mostActiveDay: this.getMostActiveDay(recentSessions),
        dateRange: {
          from: cutoffDate.toISOString(),
          to: new Date().toISOString(),
          days
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
   * /devices/{deviceId}/sessions/weekly:
   *   get:
   *     tags: [Sessions]
   *     summary: Get weekly session summary
   *     description: Retrieve a summary of sessions for the past week
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/DeviceId'
   *     responses:
   *       200:
   *         description: Successfully retrieved weekly session data
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
   *                         weeklyData:
   *                           type: array
   *                           items:
   *                             type: object
   *                             properties:
   *                               date:
   *                                 type: string
   *                                 format: date
   *                                 example: '2024-01-20'
   *                               hasSession:
   *                                 type: boolean
   *                               duration:
   *                                 type: integer
   *                                 description: 'Duration in seconds'
   *                               commands:
   *                                 type: integer
   *                               dataReceived:
   *                                 type: integer
   *                               errors:
   *                                 type: integer
   *                         summary:
   *                           type: object
   *                           properties:
   *                             activeDays:
   *                               type: integer
   *                               example: 5
   *                             totalUsage:
   *                               type: integer
   *                               description: 'Total usage in seconds'
   *                             totalCommands:
   *                               type: integer
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  async weekly(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      
      const sessions = await this.sessionRepository.findByDeviceId(deviceId);
      
      // Get last 7 days
      const weeklyData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const daySession = sessions.find(session => 
          session.sessionDate >= date && session.sessionDate < nextDay
        );

        weeklyData.push({
          date: date.toISOString().split('T')[0],
          hasSession: !!daySession,
          duration: daySession?.totalDuration || 0,
          commands: daySession?.usage.commandsSent || 0,
          dataReceived: daySession?.usage.dataReceived || 0,
          errors: daySession?.usage.errorCount || 0
        });
      }

      res.json({
        success: true,
        data: {
          deviceId,
          weeklyData,
          summary: {
            activeDays: weeklyData.filter(day => day.hasSession).length,
            totalUsage: weeklyData.reduce((sum, day) => sum + day.duration, 0),
            totalCommands: weeklyData.reduce((sum, day) => sum + day.commands, 0)
          }
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  private getLongestSession(sessions: any[]) {
    if (sessions.length === 0) return null;
    
    return sessions.reduce((longest, session) => 
      session.totalDuration > longest.totalDuration ? session : longest
    );
  }

  private getMostActiveDay(sessions: any[]) {
    if (sessions.length === 0) return null;
    
    const dayUsage = sessions.reduce((acc, session) => {
      const day = session.sessionDate.toISOString().split('T')[0];
      acc[day] = (acc[day] || 0) + session.totalDuration;
      return acc;
    }, {} as Record<string, number>);

    const mostActiveDay = Object.entries(dayUsage)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0];

    return mostActiveDay ? {
      date: mostActiveDay[0],
      usage: mostActiveDay[1]
    } : null;
  }
}