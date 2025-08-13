import { Request, Response } from 'express';
import { AuthService, RegisterRequest, LoginRequest } from '../../../domain/services/AuthService';
import { UserRepository } from '../../../infrastructure/database/repositories/UserRepository';

export class AuthController {
  private authService: AuthService;

  constructor() {
    const userRepository = new UserRepository();
    this.authService = new AuthService(userRepository);
  }

  /**
   * @swagger
   * /auth/register:
   *   post:
   *     tags: [Authentication]
   *     summary: Register a new user
   *     description: Create a new user account with email, password, and name
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RegisterRequest'
   *     responses:
   *       201:
   *         description: User registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/UserResponse'
   *                     token:
   *                       type: string
   *                       description: JWT authentication token
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       409:
   *         description: User already exists
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      const registerData: RegisterRequest = req.body;
      const userAgent = req.get('User-Agent');
      const ipAddress = req.ip || req.connection.remoteAddress;

      const result = await this.authService.register(registerData, userAgent, ipAddress);

      if (!result.success) {
        const statusCode = result.message?.includes('already exists') ? 409 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.message || 'Registration failed',
          errors: result.errors,
          apiVersion: '1.0.0',
          namespace: 'v1'
        });
        return;
      }

      res.status(201).json({
        success: true,
        message: result.message,
        user: result.user,
        token: result.token,
        apiVersion: '1.0.0',
        namespace: 'v1'
      });

    } catch (error) {
      console.error('Register controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Registration failed due to server error',
        apiVersion: '1.0.0',
        namespace: 'v1'
      });
    }
  };

  /**
   * @swagger
   * /auth/login:
   *   post:
   *     tags: [Authentication]
   *     summary: User login
   *     description: Authenticate user with email and password
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginRequest'
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/UserResponse'
   *                     token:
   *                       type: string
   *                       description: JWT authentication token
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       401:
   *         description: Invalid credentials
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const loginData: LoginRequest = req.body;
      const userAgent = req.get('User-Agent');
      const ipAddress = req.ip || req.connection.remoteAddress;

      const result = await this.authService.login(loginData, userAgent, ipAddress);

      if (!result.success) {
        const statusCode = result.message?.includes('Invalid') || result.message?.includes('deactivated') ? 401 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.message || 'Login failed',
          errors: result.errors,
          apiVersion: '1.0.0',
          namespace: 'v1'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: result.message,
        user: result.user,
        token: result.token,
        apiVersion: '1.0.0',
        namespace: 'v1'
      });

    } catch (error) {
      console.error('Login controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Login failed due to server error',
        apiVersion: '1.0.0',
        namespace: 'v1'
      });
    }
  };

  /**
   * @swagger
   * /auth/logout:
   *   post:
   *     tags: [Authentication]
   *     summary: User logout
   *     description: Logout user and invalidate session
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Logout successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *       401:
   *         description: No token provided or invalid token
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  public logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = this.extractToken(req);

      if (!token) {
        res.status(401).json({
          success: false,
          error: 'No token provided',
          message: 'Authentication token is required for logout',
          apiVersion: '1.0.0',
          namespace: 'v1'
        });
        return;
      }

      const result = await this.authService.logout(token);

      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        success: result.success,
        message: result.message,
        apiVersion: '1.0.0',
        namespace: 'v1'
      });

    } catch (error) {
      console.error('Logout controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Logout failed due to server error',
        apiVersion: '1.0.0',
        namespace: 'v1'
      });
    }
  };

  /**
   * @swagger
   * /auth/me:
   *   get:
   *     tags: [Authentication]
   *     summary: Get current user profile
   *     description: Get authenticated user's profile information
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User profile retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/UserResponse'
   *       401:
   *         description: Authentication required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  public getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      // User is already attached by auth middleware
      const user = req.user;

      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        user,
        apiVersion: '1.0.0',
        namespace: 'v1'
      });

    } catch (error) {
      console.error('Get profile controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve profile',
        apiVersion: '1.0.0',
        namespace: 'v1'
      });
    }
  };

  /**
   * @swagger
   * /auth/sessions/revoke:
   *   post:
   *     tags: [Authentication]
   *     summary: Revoke all user sessions
   *     description: Revoke all active sessions for the authenticated user
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Sessions revoked successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     revokedCount:
   *                       type: integer
   *                       description: Number of sessions revoked
   *       401:
   *         description: Authentication required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  public revokeAllSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User ID not found in request',
          apiVersion: '1.0.0',
          namespace: 'v1'
        });
        return;
      }

      const result = await this.authService.revokeAllUserSessions(userId);

      res.status(200).json({
        success: result.success,
        message: result.message,
        revokedCount: result.revokedCount,
        apiVersion: '1.0.0',
        namespace: 'v1'
      });

    } catch (error) {
      console.error('Revoke sessions controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to revoke sessions',
        apiVersion: '1.0.0',
        namespace: 'v1'
      });
    }
  };

  /**
   * @swagger
   * /auth/password/change:
   *   post:
   *     tags: [Authentication]
   *     summary: Change user password
   *     description: Change the authenticated user's password
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ChangePasswordRequest'
   *     responses:
   *       200:
   *         description: Password changed successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       401:
   *         description: Current password is incorrect
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  public changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User ID not found in request',
          apiVersion: '1.0.0',
          namespace: 'v1'
        });
        return;
      }

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'Current password and new password are required',
          apiVersion: '1.0.0',
          namespace: 'v1'
        });
        return;
      }

      const result = await this.authService.changePassword(userId, currentPassword, newPassword);

      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        success: result.success,
        message: result.message,
        apiVersion: '1.0.0',
        namespace: 'v1'
      });

    } catch (error) {
      console.error('Change password controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to change password',
        apiVersion: '1.0.0',
        namespace: 'v1'
      });
    }
  };

  /**
   * @swagger
   * /auth/language:
   *   put:
   *     tags: [Authentication]
   *     summary: Update user language preference
   *     description: Update the language preference for the authenticated user
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               language:
   *                 type: string
   *                 enum: [en, es]
   *                 description: Language preference (en for English, es for Spanish)
   *             required:
   *               - language
   *     responses:
   *       200:
   *         description: Language preference updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     message:
   *                       type: string
   *                       example: Language preference updated successfully
   *       400:
   *         description: Invalid language or validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Authentication required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  public updateLanguage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { language } = req.body;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated',
          apiVersion: '1.0.0',
          namespace: 'v1'
        });
        return;
      }

      if (!language) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          message: 'Language is required',
          apiVersion: '1.0.0',
          namespace: 'v1'
        });
        return;
      }

      const result = await this.authService.updateLanguage(user.id, language);

      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        success: result.success,
        message: result.message,
        apiVersion: '1.0.0',
        namespace: 'v1'
      });

    } catch (error) {
      console.error('Update language controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Language update failed due to server error',
        apiVersion: '1.0.0',
        namespace: 'v1'
      });
    }
  };

  // Helper method to extract token from request
  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return null;
    }

    const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
    if (bearerMatch) {
      return bearerMatch[1];
    }

    return authHeader;
  }
}