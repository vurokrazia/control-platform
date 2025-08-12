import { createClient, RedisClientType } from 'redis';

export class RedisClient {
  private static instance: RedisClient;
  private client: RedisClientType;
  private isConnected: boolean = false;

  private constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.client = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 10000,
        rejectUnauthorized: false
      }
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
      this.isConnected = true;
    });

    this.client.on('ready', () => {
      console.log('Redis Client Ready');
    });

    this.client.on('end', () => {
      console.log('Redis Client Disconnected');
      this.isConnected = false;
    });
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  public async connect(): Promise<void> {
    if (!this.isConnected) {
      try {
        await this.client.connect();
        this.isConnected = true;
        console.log('✅ Connected to Redis successfully');
      } catch (error) {
        console.error('❌ Failed to connect to Redis:', error);
        console.log('💡 Try using a free Redis service like Upstash or run local Redis with Docker');
        this.isConnected = false;
        throw error;
      }
    }
  }

  public async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  public getClient(): RedisClientType {
    if (!this.isConnected) {
      throw new Error('Redis client is not connected');
    }
    return this.client;
  }

  public isClientConnected(): boolean {
    return this.isConnected;
  }

  // Session-specific methods
  public async setSession(sessionId: string, sessionData: Record<string, string>, ttlSeconds: number): Promise<void> {
    const key = `session:${sessionId}`;
    await this.client.hSet(key, sessionData);
    await this.client.expire(key, ttlSeconds);
  }

  public async getSession(sessionId: string): Promise<Record<string, string> | null> {
    const key = `session:${sessionId}`;
    const sessionData = await this.client.hGetAll(key);
    
    // Check if session exists and has data
    if (!sessionData || Object.keys(sessionData).length === 0) {
      return null;
    }
    
    return sessionData;
  }

  public async deleteSession(sessionId: string): Promise<boolean> {
    const key = `session:${sessionId}`;
    const result = await this.client.del(key);
    return result > 0;
  }

  public async updateSessionActivity(sessionId: string, ttlSeconds: number): Promise<void> {
    const key = `session:${sessionId}`;
    const now = new Date().toISOString();
    
    await this.client.hSet(key, 'lastActivity', now);
    await this.client.expire(key, ttlSeconds);
  }

  public async getUserSessions(userId: string): Promise<string[]> {
    const pattern = 'session:*';
    const sessionKeys = await this.client.keys(pattern);
    const userSessions: string[] = [];

    for (const key of sessionKeys) {
      const sessionData = await this.client.hGetAll(key);
      if (sessionData.userId === userId && sessionData.isActive === 'true') {
        userSessions.push(sessionData.sessionId);
      }
    }

    return userSessions;
  }

  public async revokeUserSessions(userId: string): Promise<number> {
    const userSessions = await this.getUserSessions(userId);
    let revokedCount = 0;

    for (const sessionId of userSessions) {
      const deleted = await this.deleteSession(sessionId);
      if (deleted) {
        revokedCount++;
      }
    }

    return revokedCount;
  }

  // Health check
  public async ping(): Promise<string> {
    return await this.client.ping();
  }
}