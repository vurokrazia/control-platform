// Jest setup file
import { config } from 'dotenv';

// Load test environment variables from .env.test file
config({ path: '.env.test' });

// The environment variables are now loaded from .env.test
// No need to override them manually

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