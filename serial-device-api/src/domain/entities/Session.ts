import { v4 as uuidv4 } from 'uuid';

export interface SessionData {
  sessionId: string;
  userId: string;
  userAgent?: string | undefined;
  ipAddress?: string | undefined;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  isActive: boolean;
}

export class SessionEntity implements SessionData {
  public readonly sessionId: string;
  public readonly userId: string;
  public userAgent?: string | undefined;
  public ipAddress?: string | undefined;
  public createdAt: Date;
  public lastActivity: Date;
  public expiresAt: Date;
  public isActive: boolean;

  constructor(
    userId: string,
    expirationDays: number = 7,
    sessionId?: string,
    userAgent?: string,
    ipAddress?: string,
    createdAt?: Date,
    lastActivity?: Date,
    expiresAt?: Date,
    isActive: boolean = true
  ) {
    this.sessionId = sessionId || uuidv4();
    this.userId = userId;
    this.userAgent = userAgent;
    this.ipAddress = ipAddress;
    this.createdAt = createdAt || new Date();
    this.lastActivity = lastActivity || new Date();
    this.expiresAt = expiresAt || new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000);
    this.isActive = isActive;
  }

  public updateActivity(): void {
    this.lastActivity = new Date();
  }

  public isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  public revoke(): void {
    this.isActive = false;
  }

  public extend(additionalDays: number = 7): void {
    const now = new Date();
    this.expiresAt = new Date(now.getTime() + additionalDays * 24 * 60 * 60 * 1000);
    this.lastActivity = now;
  }

  public toRedisData(): Record<string, string> {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      userAgent: this.userAgent || '',
      ipAddress: this.ipAddress || '',
      createdAt: this.createdAt.toISOString(),
      lastActivity: this.lastActivity.toISOString(),
      expiresAt: this.expiresAt.toISOString(),
      isActive: this.isActive.toString()
    };
  }

  public static fromRedisData(data: Record<string, string>): SessionEntity {
    return new SessionEntity(
      data.userId,
      0, // Not used when reconstructing
      data.sessionId,
      data.userAgent || undefined,
      data.ipAddress || undefined,
      new Date(data.createdAt),
      new Date(data.lastActivity),
      new Date(data.expiresAt),
      data.isActive === 'true'
    );
  }
}