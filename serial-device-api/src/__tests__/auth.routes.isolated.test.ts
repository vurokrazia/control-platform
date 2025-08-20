import request from 'supertest';
import express from 'express';

// Mock ALL database and external service dependencies BEFORE importing anything
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue({}),
  connection: { readyState: 1, on: jest.fn(), once: jest.fn() },
  Schema: class MockSchema { 
    constructor() {} 
    index() {} 
    set() {} 
    virtual() { return { get: jest.fn() }; } 
    pre() {} 
  },
  model: jest.fn(() => ({
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    save: jest.fn().mockResolvedValue({})
  }))
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('salt')
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({ userId: 'test-user-id' })
}));

// Mock the UserRepository
jest.mock('../infrastructure/database/repositories/UserRepository', () => ({
  UserRepository: jest.fn().mockImplementation(() => ({
    create: jest.fn().mockResolvedValue({ id: 'test-user', email: 'test@test.com' }),
    findByEmail: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue({ id: 'test-user', email: 'test@test.com' })
  }))
}));

// Mock the AuthService
jest.mock('../domain/services/AuthService', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    register: jest.fn().mockResolvedValue({ success: true, user: {}, token: 'token' }),
    login: jest.fn().mockResolvedValue({ success: true, user: {}, token: 'token' }),
    logout: jest.fn().mockResolvedValue({ success: true }),
    getProfile: jest.fn().mockResolvedValue({ success: true, user: {} }),
    changePassword: jest.fn().mockResolvedValue({ success: true }),
    updateLanguage: jest.fn().mockResolvedValue({ success: true }),
    revokeAllUserSessions: jest.fn().mockResolvedValue({ success: true, revokedCount: 3 })
  }))
}));

// Mock auth middleware
jest.mock('../api/v1/middleware/authMiddleware', () => ({
  authMiddleware: {
    requireAuth: jest.fn((req: any, _res: any, next: any) => {
      req.user = { id: 'test-user-id', email: 'test@test.com' };
      req.userId = 'test-user-id';
      next();
    })
  }
}));

// Now import the routes after all mocks are set up
import authRoutes from '../api/v1/routes/auth';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Routes Integration Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Route Availability', () => {
    it('should have POST /auth/register available', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({ name: 'Test', email: 'test@test.com', password: 'test123' });
      
      expect(response.status).not.toBe(404);
    });

    it('should have POST /auth/login available', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@test.com', password: 'test123' });
      
      expect(response.status).not.toBe(404);
    });

    it('should have POST /auth/logout available', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', 'Bearer token');
      
      expect(response.status).not.toBe(404);
    });

    it('should have GET /auth/me available', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer token');
      
      expect(response.status).not.toBe(404);
    });

    it('should have POST /auth/sessions/revoke available', async () => {
      const response = await request(app)
        .post('/auth/sessions/revoke')
        .set('Authorization', 'Bearer token');
      
      expect(response.status).not.toBe(404);
    });

    it('should have POST /auth/password/change available', async () => {
      const response = await request(app)
        .post('/auth/password/change')
        .set('Authorization', 'Bearer token')
        .send({ currentPassword: 'old', newPassword: 'new' });
      
      expect(response.status).not.toBe(404);
    });

    it('should have PUT /auth/language available', async () => {
      const response = await request(app)
        .put('/auth/language')
        .set('Authorization', 'Bearer token')
        .send({ language: 'es' });
      
      expect(response.status).not.toBe(404);
    });
  });

  describe('HTTP Method Validation', () => {
    it('should reject GET request to register endpoint', async () => {
      const response = await request(app).get('/auth/register');
      expect(response.status).toBe(404);
    });

    it('should reject GET request to login endpoint', async () => {
      const response = await request(app).get('/auth/login');
      expect(response.status).toBe(404);
    });

    it('should reject POST request to profile endpoint', async () => {
      const response = await request(app).post('/auth/me');
      expect(response.status).toBe(404);
    });
  });
});