import { Request, Response } from 'express';
import { DeviceSessionRepository } from '../../../infrastructure/database/repositories/DeviceSessionRepository';

export class SessionsController {
  private sessionRepository: DeviceSessionRepository;

  constructor() {
    this.sessionRepository = new DeviceSessionRepository();
  }

  // GET /devices/:deviceId/sessions - Get device sessions
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

  // GET /devices/:deviceId/sessions/:id - Get specific session
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

  // GET /devices/:deviceId/sessions/active - Get active session
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

  // GET /devices/:deviceId/sessions/today - Get today's session
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

  // POST /devices/:deviceId/sessions/:id/end - End a session
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

  // GET /devices/:deviceId/sessions/stats - Get session statistics
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
        totalErrors: recentSessions.reduce((sum, session) => sum + session.usage.errors, 0),
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

  // GET /devices/:deviceId/sessions/weekly - Get weekly session summary
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
          errors: daySession?.usage.errors || 0
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