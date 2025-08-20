import { MqttService } from '../domain/services/MqttService';
import mqtt from 'mqtt';

// Mock the mqtt module
jest.mock('mqtt');
const mockMqtt = mqtt as jest.Mocked<typeof mqtt>;

// Mock the repositories
jest.mock('../infrastructure/database/repositories/MqttTopicRepository');
jest.mock('../infrastructure/database/repositories/TopicMessageRepository');

describe('MqttService Connection Error Handling', () => {
  let mqttService: MqttService;
  let mockClient: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create a mock MQTT client
    mockClient = {
      on: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      publish: jest.fn(),
      end: jest.fn(),
      connected: false
    };

    // Mock mqtt.connect to return our mock client
    mockMqtt.connect.mockReturnValue(mockClient);
  });

  afterEach(() => {
    if (mqttService) {
      mqttService.disconnect();
    }
  });

  it('should handle MQTT connection timeout error (ETIMEDOUT)', () => {
    // Create the service (this will trigger the connection)
    mqttService = new MqttService();

    // Verify that mqtt.connect was called
    expect(mockMqtt.connect).toHaveBeenCalledWith(
      'mqtt://test.mosquitto.org:1883',
      expect.objectContaining({
        clientId: expect.stringMatching(/^arduino-api-[a-f0-9]{8}$/),
        reconnectPeriod: 5000,
        connectTimeout: 30000
      })
    );

    // Get the error handler that was registered
    const errorHandler = mockClient.on.mock.calls.find(
      (call: any[]) => call[0] === 'error'
    )?.[1];

    expect(errorHandler).toBeDefined();

    // Create a mock ETIMEDOUT error similar to the one in the user's message
    const mockTimeoutError = new Error('connect ETIMEDOUT 5.196.78.28:1883') as any;
    mockTimeoutError.code = 'ETIMEDOUT';
    mockTimeoutError.errno = -4039;
    mockTimeoutError.syscall = 'connect';
    mockTimeoutError.address = '5.196.78.28';
    mockTimeoutError.port = 1883;

    // Create AggregateError with multiple timeout errors
    const aggregateError = new AggregateError([
      {
        ...mockTimeoutError,
        address: '2001:41d0:a:6f1c::1'
      },
      mockTimeoutError
    ], 'AggregateError') as any;
    aggregateError.code = 'ETIMEDOUT';

    // Spy on console.error to verify error logging
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    // Trigger the error handler
    errorHandler(aggregateError);

    // Verify that the error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      '❌ MQTT connection error:',
      expect.objectContaining({
        code: 'ETIMEDOUT'
      })
    );

    // Verify client is not connected
    expect(mqttService.isConnected()).toBe(false);

    // Restore console.error
    consoleSpy.mockRestore();
  });

  it('should handle general MQTT connection errors', () => {
    mqttService = new MqttService();

    const errorHandler = mockClient.on.mock.calls.find(
      (call: any[]) => call[0] === 'error'
    )?.[1];

    const mockError = new Error('Connection refused');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    errorHandler(mockError);

    expect(consoleSpy).toHaveBeenCalledWith(
      '❌ MQTT connection error:',
      mockError
    );

    consoleSpy.mockRestore();
  });

  it('should handle offline and reconnect events', () => {
    mqttService = new MqttService();

    // Get event handlers
    const offlineHandler = mockClient.on.mock.calls.find(
      (call: any[]) => call[0] === 'offline'
    )?.[1];
    
    const reconnectHandler = mockClient.on.mock.calls.find(
      (call: any[]) => call[0] === 'reconnect'
    )?.[1];

    expect(offlineHandler).toBeDefined();
    expect(reconnectHandler).toBeDefined();

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    // Trigger offline event
    offlineHandler();
    expect(consoleSpy).toHaveBeenCalledWith('📡 MQTT client offline');

    // Trigger reconnect event
    reconnectHandler();
    expect(consoleSpy).toHaveBeenCalledWith('🔄 MQTT client reconnecting...');

    consoleSpy.mockRestore();
  });

  it('should not allow operations when client is not connected', () => {
    mqttService = new MqttService();
    
    // Set the client to null to simulate no connection
    (mqttService as any).client = null;
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    // Try to subscribe
    mqttService.subscribe('test/topic');
    expect(consoleSpy).toHaveBeenCalledWith('❌ MQTT client not connected');

    // Try to unsubscribe
    mqttService.unsubscribe('test/topic');
    expect(consoleSpy).toHaveBeenCalledWith('❌ MQTT client not connected');

    // Try to publish - it logs error but doesn't throw due to try-catch
    mqttService.publish('test/topic', 'test message');
    expect(consoleSpy).toHaveBeenCalledWith('❌ MQTT client not connected');

    consoleSpy.mockRestore();
  });
});