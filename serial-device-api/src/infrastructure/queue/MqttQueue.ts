import { Queue, QueueOptions } from 'bullmq';
import Redis from 'ioredis';

// Job data interface for MQTT publishing
export interface MqttPublishJobData {
  topic: string;
  message: string;
  userId: string;
  topicEntityId: string; // For saving to database
  qos?: 0 | 1 | 2;
  retain?: boolean;
  delay?: number; // Delay in milliseconds before processing
}

export class MqttQueue {
  private static instance: MqttQueue;
  private queue: Queue<MqttPublishJobData> | null = null;
  private redis: Redis | null = null;
  private isRedisAvailable: boolean = false;

  private constructor() {
    try {
      // Create Redis connection for BullMQ using REDIS_URL from env
      let redisConfig: any;
      
      if (process.env.REDIS_URL) {
        // Use Redis URL (supports rediss:// for TLS connections like Upstash)
        redisConfig = process.env.REDIS_URL;
      } else {
        // Fallback to individual config
        redisConfig = {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
        };
      }
      
      // BullMQ required options
      const connectionOptions = {
        maxRetriesPerRequest: null, // Required by BullMQ
        lazyConnect: true,
        connectTimeout: 10000, // 10 second timeout for cloud Redis
      };
      
      if (typeof redisConfig === 'string') {
        // URL-based connection
        this.redis = new Redis(redisConfig, connectionOptions);
      } else {
        // Object-based connection
        this.redis = new Redis({ ...redisConfig, ...connectionOptions });
      }

      const queueOptions: QueueOptions = {
        connection: this.redis,
        defaultJobOptions: {
          removeOnComplete: { count: 100 }, // Keep last 100 completed jobs
          removeOnFail: { count: 50 },      // Keep last 50 failed jobs
          attempts: 3,           // Retry up to 3 times
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      };

      this.queue = new Queue<MqttPublishJobData>('mqtt-publish', queueOptions);
      this.isRedisAvailable = true;
    } catch (error) {
      console.warn('⚠️  Redis not available, using fallback mode for MQTT publishing');
      this.isRedisAvailable = false;
    }
  }

  public static getInstance(): MqttQueue {
    if (!MqttQueue.instance) {
      MqttQueue.instance = new MqttQueue();
    }
    return MqttQueue.instance;
  }

  /**
   * Add MQTT publish job to queue (or fallback to direct publish + DB save)
   */
  public async publishMessage(jobData: MqttPublishJobData): Promise<void> {
    if (!this.isRedisAvailable || !this.queue) {
      console.warn('⚠️  Redis not available, falling back to direct processing');
      // Import here to avoid circular dependencies
      const { mqttServiceInstance } = await import('../../shared/MqttServiceInstance');
      const { TopicMessageRepository } = await import('../../infrastructure/database/repositories/TopicMessageRepository');
      const { TopicMessage } = await import('../../domain/entities/TopicMessage');
      
      // Save to database
      const topicMessageRepository = new TopicMessageRepository();
      const topicMessage = new TopicMessage(jobData.message, jobData.topicEntityId, jobData.userId);
      await topicMessageRepository.create(topicMessage);
      
      // Publish to MQTT
      const payload = JSON.stringify({
        message: jobData.message,
        userId: jobData.userId,
        timestamp: new Date().toISOString(),
        _alreadySaved: true // Flag to prevent duplicate saving by MQTT service
      });
      mqttServiceInstance.publish(jobData.topic, payload);
      return;
    }

    try {
      const delay = jobData.delay || 0; // Use provided delay or default to immediate processing
      await this.queue.add('publish-mqtt-message', jobData, {
        priority: 1,
        delay: delay,
      });
      
      const delayMessage = delay > 0 ? ` (delayed by ${delay}ms)` : '';
      console.log(`MQTT message queued for topic: ${jobData.topic}${delayMessage}`);
    } catch (error) {
      console.error('Failed to queue MQTT message:', error);
      throw new Error('Failed to queue MQTT message');
    }
  }

  /**
   * Add high priority MQTT publish job
   */
  public async publishMessageHighPriority(jobData: MqttPublishJobData): Promise<void> {
    if (!this.isRedisAvailable || !this.queue) {
      // Fallback to direct publish for high priority as well
      return this.publishMessage(jobData);
    }

    try {
      const delay = jobData.delay || 0; // Use provided delay or default to immediate processing
      await this.queue.add('publish-mqtt-message', jobData, {
        priority: 10, // Higher priority
        delay: delay,
      });
      
      const delayMessage = delay > 0 ? ` (delayed by ${delay}ms)` : '';
      console.log(`High priority MQTT message queued for topic: ${jobData.topic}${delayMessage}`);
    } catch (error) {
      console.error('Failed to queue high priority MQTT message:', error);
      throw new Error('Failed to queue high priority MQTT message');
    }
  }

  /**
   * Get queue statistics
   */
  public async getQueueStats() {
    if (!this.isRedisAvailable || !this.queue) {
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        status: 'Redis not available - using direct publish mode'
      };
    }

    const waiting = await this.queue.getWaiting();
    const active = await this.queue.getActive();
    const completed = await this.queue.getCompleted();
    const failed = await this.queue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      status: 'Queue operational'
    };
  }

  /**
   * Close queue connection
   */
  public async close(): Promise<void> {
    if (this.queue) {
      await this.queue.close();
    }
    if (this.redis) {
      await this.redis.quit();
    }
  }

  /**
   * Get the queue instance for worker setup
   */
  public getQueue(): Queue<MqttPublishJobData> | null {
    return this.queue;
  }

  /**
   * Check if Redis/Queue is available
   */
  public isQueueAvailable(): boolean {
    return this.isRedisAvailable;
  }
}