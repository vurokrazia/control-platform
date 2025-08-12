import Joi from 'joi';
import { UserEntity, User } from '../entities/User';
import { IUserRepository } from '../repositories/IUserRepository';
import { SessionService } from './SessionService';
import { SessionEntity } from '../entities/Session';

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: Omit<User, 'password'>;
  token?: string;
  session?: SessionEntity;
  message?: string;
  errors?: string[];
}

export class AuthService {
  private userRepository: IUserRepository;
  private sessionService: SessionService;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
    this.sessionService = new SessionService();
  }

  // Validation schemas
  private registerSchema = Joi.object({
    email: Joi.string()
      .email()
      .required()
      .lowercase()
      .trim()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .min(6)
      .max(128)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password must be less than 128 characters',
        'any.required': 'Password is required'
      }),
    name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .trim()
      .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name must be less than 100 characters',
        'any.required': 'Name is required'
      })
  });

  private loginSchema = Joi.object({
    email: Joi.string()
      .email()
      .required()
      .lowercase()
      .trim()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      })
  });

  public async register(
    registerData: RegisterRequest,
    userAgent?: string,
    ipAddress?: string
  ): Promise<AuthResult> {
    try {
      // Validate input
      const { error, value } = this.registerSchema.validate(registerData);
      if (error) {
        return {
          success: false,
          message: 'Validation failed',
          errors: error.details.map(detail => detail.message)
        };
      }

      const { email, password, name } = value;

      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        return {
          success: false,
          message: 'User with this email already exists'
        };
      }

      // Create new user entity
      const newUser = new UserEntity(email, password, name);

      // Save user to database (password will be hashed by pre-save middleware)
      const savedUser = await this.userRepository.create(newUser);

      // Create session and JWT token
      const { token, session } = await this.sessionService.createSession(
        savedUser.id,
        userAgent,
        ipAddress
      );

      // Update last login
      await this.userRepository.updateLastLogin(savedUser.id);

      // Remove password from response
      const { password: _, ...userResponse } = savedUser;

      return {
        success: true,
        user: userResponse as Omit<User, 'password'>,
        token,
        session,
        message: 'User registered successfully'
      };

    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed due to server error'
      };
    }
  }

  public async login(
    loginData: LoginRequest,
    userAgent?: string,
    ipAddress?: string
  ): Promise<AuthResult> {
    try {
      // Validate input
      const { error, value } = this.loginSchema.validate(loginData);
      if (error) {
        return {
          success: false,
          message: 'Validation failed',
          errors: error.details.map(detail => detail.message)
        };
      }

      const { email, password } = value;

      // Find user and verify password
      const user = await (this.userRepository as any).verifyPassword(email, password);
      if (!user) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Check if user is active
      if (!user.isActive) {
        return {
          success: false,
          message: 'Account is deactivated. Please contact support.'
        };
      }

      // Create session and JWT token
      const { token, session } = await this.sessionService.createSession(
        user.id,
        userAgent,
        ipAddress
      );

      // Update last login
      await this.userRepository.updateLastLogin(user.id);

      // Remove password from response
      const { password: __, ...userResponse } = user;

      return {
        success: true,
        user: userResponse as Omit<User, 'password'>,
        token,
        session,
        message: 'Login successful'
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed due to server error'
      };
    }
  }

  public async logout(token: string): Promise<{ success: boolean; message: string }> {
    try {
      // Decode token to get session ID
      const decoded = this.sessionService.decodeTokenWithoutVerification(token);
      if (!decoded || !decoded.sessionId) {
        return {
          success: false,
          message: 'Invalid token'
        };
      }

      // Revoke session
      const revoked = await this.sessionService.revokeSession(decoded.sessionId);
      
      return {
        success: revoked,
        message: revoked ? 'Logout successful' : 'Session not found'
      };

    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        message: 'Logout failed due to server error'
      };
    }
  }

  public async validateToken(token: string): Promise<{
    isValid: boolean;
    user?: Omit<User, 'password'>;
    session?: SessionEntity;
    error?: string;
  }> {
    try {
      // Validate session using session service
      const validation = await this.sessionService.validateSession(token);
      
      if (!validation.isValid) {
        return {
          isValid: false,
          error: validation.error || 'Validation failed'
        };
      }

      // Get user details
      const user = await this.userRepository.findById(validation.userId!);
      if (!user) {
        return {
          isValid: false,
          error: 'User not found'
        };
      }

      if (!user.isActive) {
        return {
          isValid: false,
          error: 'User account is deactivated'
        };
      }

      // Remove password from response
      const { password: ___, ...userResponse } = user;

      return {
        isValid: true,
        user: userResponse as Omit<User, 'password'>,
        session: validation.session!
      };

    } catch (error) {
      console.error('Token validation error:', error);
      return {
        isValid: false,
        error: 'Token validation failed'
      };
    }
  }

  public async revokeAllUserSessions(userId: string): Promise<{
    success: boolean;
    revokedCount: number;
    message: string;
  }> {
    try {
      const revokedCount = await this.sessionService.revokeUserSessions(userId);
      
      return {
        success: true,
        revokedCount,
        message: `Successfully revoked ${revokedCount} sessions`
      };

    } catch (error) {
      console.error('Revoke sessions error:', error);
      return {
        success: false,
        revokedCount: 0,
        message: 'Failed to revoke sessions due to server error'
      };
    }
  }

  public async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate new password
      const passwordValidation = Joi.string().min(6).max(128).validate(newPassword);
      if (passwordValidation.error) {
        return {
          success: false,
          message: 'New password must be between 6 and 128 characters'
        };
      }

      // Get user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Verify current password
      const isCurrentPasswordValid = await (this.userRepository as any).verifyPassword(user.email, currentPassword);
      if (!isCurrentPasswordValid) {
        return {
          success: false,
          message: 'Current password is incorrect'
        };
      }

      // Update password
      const updated = await this.userRepository.update(userId, {
        password: newPassword,
        updatedAt: new Date()
      });

      if (!updated) {
        return {
          success: false,
          message: 'Failed to update password'
        };
      }

      // Revoke all existing sessions for security
      await this.sessionService.revokeUserSessions(userId);

      return {
        success: true,
        message: 'Password changed successfully. Please login again.'
      };

    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: 'Password change failed due to server error'
      };
    }
  }
}