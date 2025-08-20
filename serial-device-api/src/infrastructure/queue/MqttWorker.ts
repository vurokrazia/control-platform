import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { MqttPublishJobData } from './MqttQueue';
import { mqttServiceInstance } from '../../shared/MqttServiceInstance';
import { TopicMessageRepository } from '../../infrastructure/database/repositories/TopicMessageRepository';
import { TopicMessage } from '../../domain/entities/TopicMessage';

export class MqttWorker {
  private static instance: MqttWorker;
  private worker: Worker<MqttPublishJobData>;
  private redis: Redis;
  private topicMessageRepository: TopicMessageRepository;

  private constructor() {
    // Create Redis connection for worker using REDIS_URL from env
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

    this.topicMessageRepository = new TopicMessageRepository();

    // Create worker
    this.worker = new Worker<MqttPublishJobData>(
      'mqtt-publish',
      this.processJob.bind(this),
      {
        connection: this.redis,
        concurrency: 5, // Process up to 5 jobs concurrently
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      }
    );

    this.setupEventHandlers();
  }

  public static getInstance(): MqttWorker {
    if (!MqttWorker.instance) {
      MqttWorker.instance = new MqttWorker();
    }
    return MqttWorker.instance;
  }

  /**
   * Process MQTT publish job - saves to database AND publishes to MQTT
   */
  private async processJob(job: Job<MqttPublishJobData>): Promise<void> {
    const { topic, message, userId, topicEntityId } = job.data;

    try {
      console.log(`Processing MQTT job for topic: ${topic}, user: ${userId}`);

      // 1. Save to database first
      const topicMessage = new TopicMessage(message, topicEntityId, userId);
      await this.topicMessageRepository.create(topicMessage);
      console.log(`Message saved to database for topic: ${topic}`);

      // 2. Create message payload with userId for MQTT
      const messagePayload = JSON.stringify({
        message,
        userId,
        timestamp: new Date().toISOString(),
        _alreadySaved: true // Flag to prevent duplicate saving by MQTT service
      });

      // 3. Publish message using singleton MQTT service
      mqttServiceInstance.publish(topic, messagePayload);
      console.log(`Successfully published MQTT message to topic: ${topic}`);

    } catch (error) {
      console.error(`Failed to process MQTT job for topic ${topic}:`, error);
      throw error; // Let BullMQ handle retry logic
    }
  }

  /**
   * Setup event handlers for the worker
   */
  private setupEventHandlers(): void {
    this.worker.on('completed', (job) => {
      console.log(`MQTT job ${job.id} completed for topic: ${job.data.topic}`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`MQTT job ${job?.id} failed for topic: ${job?.data.topic}`, err);
    });

    this.worker.on('error', (err) => {
      console.error('MQTT worker error:', err);
    });

    this.worker.on('stalled', (jobId) => {
      console.warn(`MQTT job ${jobId} stalled`);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Received SIGINT, closing MQTT worker...');
      await this.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('Received SIGTERM, closing MQTT worker...');
      await this.close();
      process.exit(0);
    });
  }

  /**
   * Start the worker
   */
  public async start(): Promise<void> {
    console.log('Starting MQTT background worker...');
    // Worker starts automatically when created
  }

  /**
   * Close worker connection
   */
  public async close(): Promise<void> {
    console.log('Closing MQTT worker...');
    await this.worker.close();
    await this.redis.quit();
  }

  /**
   * Get worker status
   */
  public getWorkerStatus() {
    return {
      isRunning: !this.worker.closing,
      concurrency: this.worker.opts.concurrency,
    };
  }
}