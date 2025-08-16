// Jest setup file
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.MONGODB_URI = 'mongodb://test-user:test-pass@test-db-host:27017/arduino-api-test';
process.env.DISABLE_DATABASE = 'true';
process.env.DISABLE_MQTT = 'true';
process.env.DISABLE_REDIS = 'true';

// Mock mongoose to prevent actual DB connections
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue({}),
  connection: {
    readyState: 1,
    on: jest.fn(),
    once: jest.fn(),
    close: jest.fn().mockResolvedValue({})
  },
  Schema: class MockSchema {
    constructor() {}
    index() {}
    set() {}
    virtual() {
      return {
        get: jest.fn()
      };
    }
    pre() {}
    static() {}
  },
  model: jest.fn(() => ({
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    save: jest.fn().mockResolvedValue({}),
    deleteOne: jest.fn().mockResolvedValue({}),
    updateOne: jest.fn().mockResolvedValue({})
  }))
}));