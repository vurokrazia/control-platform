import mqtt, { MqttClient } from 'mqtt';
import { MqttTopicRepository } from '../../infrastructure/database/repositories/MqttTopicRepository';
import { TopicMessageRepository } from '../../infrastructure/database/repositories/TopicMessageRepository';
import { TopicMessage } from '../entities/TopicMessage';

export class MqttService {
    private client: MqttClient | null = null;
    private readonly brokerUrl: string = 'mqtt://test.mosquitto.org:1883';
    private subscribedTopics: Set<string> = new Set();
    private mqttTopicRepository: MqttTopicRepository;
    private topicMessageRepository: TopicMessageRepository;

    constructor() {
        this.mqttTopicRepository = new MqttTopicRepository();
        this.topicMessageRepository = new TopicMessageRepository();
        this.connect();
    }

    private connect(): void {
        console.log('Connecting to MQTT broker:', this.brokerUrl);

        this.client = mqtt.connect(this.brokerUrl, {
            clientId: `arduino-api-${Math.random().toString(16).substr(2, 8)}`,
            reconnectPeriod: 5000,
            connectTimeout: 30 * 1000
        });

        this.client.on('connect', async () => {
            console.log('✅ Connected to MQTT broker');
            
            // Auto-subscribe to topics that have autoSubscribe = true
            try {
                const autoSubscribeTopics = await this.mqttTopicRepository.findAutoSubscribeTopics();
                autoSubscribeTopics.forEach(topic => {
                    this.subscribe(topic.name);
                    console.log(`🔄 Auto-subscribed to topic: ${topic.name}`);
                });
            } catch (error) {
                console.error('❌ Error auto-subscribing to topics:', error);
            }
        });

        this.client.on('error', (error) => {
            console.error('❌ MQTT connection error:', error);
        });

        this.client.on('offline', () => {
            console.log('📡 MQTT client offline');
        });

        this.client.on('reconnect', () => {
            console.log('🔄 MQTT client reconnecting...');
        });

        this.client.on('message', async (topic, message) => {
            const messageStr = message.toString();
            console.log(`📨 [${topic}]: ${messageStr}`);

            try {
                // Find topic to get its ID
                const topics = await this.mqttTopicRepository.findAll();
                const topicEntity = topics.find(t => t.name === topic);

                if (topicEntity) {
                    let actualMessage: string;
                    let userId: string;

                    // Try to parse as JSON payload (from HTTP API)
                    try {
                        const payload = JSON.parse(messageStr);
                        if (payload.message && payload.userId) {
                            actualMessage = payload.message;
                            userId = payload.userId;
                            console.log(`📦 Parsed JSON payload with userId: ${userId}`);
                            
                            // Check if message was already saved by worker
                            if (payload._alreadySaved) {
                                console.log(`⏭️ Message already saved by background worker, skipping duplicate save`);
                                return; // Skip saving to database
                            }
                        } else {
                            throw new Error('Invalid JSON payload format');
                        }
                    } catch (parseError) {
                        // Fallback to plain message (from external sources)
                        actualMessage = messageStr;
                        userId = topicEntity.userId;
                        console.log(`📝 Using plain message with topic owner userId: ${userId}`);
                    }

                    // Only save if we have a userId
                    if (userId) {
                        const topicMessage = new TopicMessage(actualMessage, topicEntity.id, userId);
                        await this.topicMessageRepository.create(topicMessage);
                        console.log(`💾 Saved message for topic '${topic}' to database`);
                    } else {
                        console.log(`⚠️ No userId available for topic '${topic}', message not saved`);
                    }
                } else {
                    console.log(`⚠️ Topic '${topic}' not found in database, message not saved`);
                }
            } catch (error) {
                console.error(`❌ Error saving received message for topic '${topic}':`, error);
            }
        });
    }

    public subscribe(topic: string): void {
        if (!this.client) {
            console.error('❌ MQTT client not connected');
            return;
        }

        if (this.subscribedTopics.has(topic)) {
            console.log(`⚠️ Already subscribed to topic: ${topic}`);
            return;
        }

        this.client.subscribe(topic, (error) => {
            if (error) {
                console.error(`❌ Failed to subscribe to topic '${topic}':`, error);
            } else {
                this.subscribedTopics.add(topic);
                console.log(`✅ Subscribed to topic: ${topic}`);
            }
        });
    }

    public unsubscribe(topic: string): void {
        if (!this.client) {
            console.error('❌ MQTT client not connected');
            return;
        }

        this.client.unsubscribe(topic, (error) => {
            if (error) {
                console.error(`❌ Failed to unsubscribe from topic '${topic}':`, error);
            } else {
                this.subscribedTopics.delete(topic);
                console.log(`✅ Unsubscribed from topic: ${topic}`);
            }
        });
    }

    public subscribeToTopics(topics: string[]): void {
        topics.forEach(topic => this.subscribe(topic));
    }

    public publish(topic: string, message: string): void {
        try {
            if (!this.client) {
                console.error('❌ MQTT client not connected');
                throw new Error('MQTT client not connected');
            }

            this.client.publish(topic, message, (error) => {
                if (error) {
                    console.error(`❌ Failed to publish to topic '${topic}':`, error);
                    throw error;
                } else {
                    console.log(`📤 Published to topic '${topic}': ${message}`);
                }
            });
        } catch (error) {
            console.log(error);
        }
    }

    public disconnect(): void {
        if (this.client) {
            this.client.end();
            this.client = null;
            console.log('🔌 MQTT client disconnected');
        }
    }

    public isConnected(): boolean {
        return this.client?.connected || false;
    }
}