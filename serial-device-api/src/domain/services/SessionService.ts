import jwt, { SignOptions } from 'jsonwebtoken';
import { SessionEntity } from '../entities/Session';
import { RedisClient } from '../../infrastructure/cache/redis-client';

export interface JWTPayload {
  sessionId: string;
  userId: string;
  iat?: number;
  exp?: number;
}

export interface SessionValidationResult {
  isValid: boolean;
  session?: SessionEntity;
  userId?: string;
  error?: string;
}

export class SessionService {
  private redisClient: RedisClient;
  private jwtSecret: string;
  private jwtExpiresIn: string;
  private sessionTTLSeconds: number;

  constructor() {
    this.redisClient = RedisClient.getInstance();
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    this.sessionTTLSeconds = parseInt(process.env.SESSION_TTL_SECONDS || '604800'); // 7 days
  }

  public async createSession(
    userId: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ token: string; session: SessionEntity }> {
    // Create session entity
    const session = new SessionEntity(
      userId,
      this.sessionTTLSeconds / (24 * 60 * 60), // Convert seconds to days
      undefined,
      userAgent,
      ipAddress
    );

    // Store session in Redis
    const sessionData = session.toRedisData();
    await this.redisClient.setSession(
      session.sessionId,
      sessionData,
      this.sessionTTLSeconds
    );

    // Generate JWT token
    const payload: JWTPayload = {
      sessionId: session.sessionId,
      userId: session.userId
    };

    const token = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn
    } as SignOptions);

    return { token, session };
  }

  public async validateSession(token: string): Promise<SessionValidationResult> {
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, this.jwtSecret) as JWTPayload;
      
      if (!decoded.sessionId || !decoded.userId) {
        return {
          isValid: false,
          error: 'Invalid token payload'
        };
      }

      // Get session from Redis
      const sessionData = await this.redisClient.getSession(decoded.sessionId);
      
      if (!sessionData) {
        return {
          isValid: false,
          error: 'Session not found or expired'
        };
      }

      // Reconstruct session entity
      const session = SessionEntity.fromRedisData(sessionData);

      // Check if session is active and not expired
      if (!session.isActive) {
        return {
          isValid: false,
          error: 'Session is inactive'
        };
      }

      if (session.isExpired()) {
        // Clean up expired session
        await this.redisClient.deleteSession(session.sessionId);
        return {
          isValid: false,
          error: 'Session has expired'
        };
      }

      // Update last activity
      await this.updateSessionActivity(session.sessionId);

      return {
        isValid: true,
        session,
        userId: session.userId
      };

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return {
          isValid: false,
          error: 'Invalid token'
        };
      }
      
      if (error instanceof jwt.TokenExpiredError) {
        return {
          isValid: false,
          error: 'Token has expired'
        };
      }

      return {
        isValid: false,
        error: 'Token validation failed'
      };
    }
  }

  public async updateSessionActivity(sessionId: string): Promise<void> {
    await this.redisClient.updateSessionActivity(sessionId, this.sessionTTLSeconds);
  }

  public async revokeSession(sessionId: string): Promise<boolean> {
    return await this.redisClient.deleteSession(sessionId);
  }

  public async revokeUserSessions(userId: string): Promise<number> {
    return await this.redisClient.revokeUserSessions(userId);
  }

  public async getUserActiveSessions(userId: string): Promise<string[]> {
    return await this.redisClient.getUserSessions(userId);
  }

  public async extendSession(sessionId: string, additionalDays: number = 7): Promise<boolean> {
    const sessionData = await this.redisClient.getSession(sessionId);
    
    if (!sessionData) {
      return false;
    }

    const session = SessionEntity.fromRedisData(sessionData);
    session.extend(additionalDays);

    const newTTLSeconds = Math.floor((session.expiresAt.getTime() - Date.now()) / 1000);
    
    await this.redisClient.setSession(
      sessionId,
      session.toRedisData(),
      newTTLSeconds
    );

    return true;
  }

  public decodeTokenWithoutVerification(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch {
      return null;
    }
  }

  public async getSessionInfo(sessionId: string): Promise<SessionEntity | null> {
    const sessionData = await this.redisClient.getSession(sessionId);
    
    if (!sessionData) {
      return null;
    }

    return SessionEntity.fromRedisData(sessionData);
  }
}