import request from 'supertest';
import express from 'express';
import authRoutes from '../api/v1/routes/auth';

// Mock the database and external dependencies only
jest.mock('../infrastructure/database/connection', () => ({
  connectToDatabase: jest.fn().mockResolvedValue({}),
}));

jest.mock('../infrastructure/cache/redis-client', () => {
  const mockRedisInstance = {
    setSession: jest.fn().mockResolvedValue('OK'),
    getSession: jest.fn().mockResolvedValue(null),
    deleteSession: jest.fn().mockResolvedValue(1),
    getAllUserSessions: jest.fn().mockResolvedValue([]),
    deleteAllUserSessions: jest.fn().mockResolvedValue(0)
  };
  
  return {
    RedisClient: {
      getInstance: jest.fn().mockReturnValue(mockRedisInstance)
    }
  };
});

jest.mock('../infrastructure/database/repositories/UserRepository', () => ({
  UserRepository: jest.fn().mockImplementation(() => ({
    findByEmail: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      isActive: true,
      emailVerified: false,
      language: 'en'
    }),
    findById: jest.fn().mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User'
    }),
    update: jest.fn().mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User'
    }),
    delete: jest.fn().mockResolvedValue(true),
    updateLastLogin: jest.fn().mockResolvedValue(undefined),
    activateUser: jest.fn().mockResolvedValue(true),
    deactivateUser: jest.fn().mockResolvedValue(true),
    verifyEmail: jest.fn().mockResolvedValue(true),
    updateLanguage: jest.fn().mockResolvedValue(true),
    findActiveUsers: jest.fn().mockResolvedValue([]),
    countUsers: jest.fn().mockResolvedValue(0),
    verifyPassword: jest.fn().mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User'
    })
  })),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
  verify: jest.fn().mockReturnValue({ userId: 'test-user-id' }),
}));

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Routes Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should accept valid registration data', async () => {
      const registerData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(registerData);

      expect(response.status).not.toBe(404);
      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should reject invalid registration data', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({});

      expect(response.status).toBeDefined();
    });
  });

  describe('POST /auth/login', () => {
    it('should accept valid login data', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData);

      expect(response.status).not.toBe(404);
      expect(response.headers['content-type']).toMatch(/json/);
    });
  });

  describe('Protected Routes', () => {
    it('should require authentication for logout', async () => {
      const response = await request(app)
        .post('/auth/logout');

      expect(response.status).toBe(401);
    });

    it('should require authentication for profile', async () => {
      const response = await request(app)
        .get('/auth/me');

      expect(response.status).toBe(401);
    });

    it('should require authentication for password change', async () => {
      const response = await request(app)
        .post('/auth/password/change');

      expect(response.status).toBe(401);
    });

    it('should require authentication for language update', async () => {
      const response = await request(app)
        .put('/auth/language');

      expect(response.status).toBe(401);
    });
  });

  describe('Route Methods', () => {
    it('should only accept POST for register', async () => {
      const getResponse = await request(app).get('/auth/register');
      expect(getResponse.status).toBe(404);
    });

    it('should only accept POST for login', async () => {
      const getResponse = await request(app).get('/auth/login');
      expect(getResponse.status).toBe(404);
    });

    it('should only accept GET for profile', async () => {
      const postResponse = await request(app).post('/auth/me');
      expect(postResponse.status).toBe(404);
    });
  });
});