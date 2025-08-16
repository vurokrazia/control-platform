// Mock implementation for authMiddleware
export const authMiddleware = {
  requireAuth: jest.fn((req: any, res: any, next: any) => {
    // Mock user data for testing
    req.user = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      language: 'en',
      isActive: true
    };
    req.userId = 'test-user-id';
    next();
  }),
  
  optionalAuth: jest.fn((req: any, res: any, next: any) => {
    // Optional auth - may or may not have user
    next();
  })
};