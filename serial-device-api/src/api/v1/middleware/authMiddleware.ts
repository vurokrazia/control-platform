import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from '../../../domain/services/AuthService';
import { UserRepository } from '../../../infrastructure/database/repositories/UserRepository';
import { User } from '../../../domain/entities/User';
import { SessionEntity } from '../../../domain/entities/Session';

// Extend Express Request interface to include user and session
declare global {
  namespace Express {
    interface Request {
      user?: Omit<User, 'password'> | undefined;
      session?: SessionEntity | undefined;
      userId?: string | undefined;
    }
  }
}

interface AuthMiddlewareOptions {
  required?: boolean;
  roles?: string[];
  jwtOnly?: boolean; // Fast JWT-only validation for high-frequency endpoints
}

export class AuthMiddleware {
  private authService: AuthService;

  constructor() {
    const userRepository = new UserRepository();
    this.authService = new AuthService(userRepository);
  }

  // Main authentication middleware
  public authenticate = (options: AuthMiddlewareOptions = { required: true }) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const authStartTime = Date.now();
      console.log(`🔐 [${new Date().toISOString()}] AUTH MIDDLEWARE START - ${req.method} ${req.path}`);
      
      try {
        const token = this.extractToken(req);

        // If no token and auth is not required, continue
        if (!token && !options.required) {
          const authEndTime = Date.now();
          console.log(`✅ [${new Date().toISOString()}] AUTH MIDDLEWARE END (NO TOKEN REQUIRED) - Duration: ${authEndTime - authStartTime}ms`);
          return next();
        }

        // If no token and auth is required, return unauthorized
        if (!token && options.required) {
          const authEndTime = Date.now();
          console.log(`❌ [${new Date().toISOString()}] AUTH MIDDLEWARE END (NO TOKEN) - Duration: ${authEndTime - authStartTime}ms`);
          res.status(401).json({
            success: false,
            error: 'Access token is required',
            message: 'Please provide a valid authentication token',
            apiVersion: '1.0.0',
            namespace: 'v1'
          });
          return;
        }

        // Validate token - use fast JWT-only mode for high-frequency endpoints
        const tokenValidationStartTime = Date.now();
        console.log(`🔍 [${new Date().toISOString()}] TOKEN VALIDATION START - Mode: ${options.jwtOnly ? 'JWT-ONLY' : 'FULL'}`);
        
        let validation;
        if (options.jwtOnly) {
          validation = await this.validateJwtOnly(token!);
        } else {
          validation = await this.authService.validateToken(token!);
        }
        
        const tokenValidationEndTime = Date.now();
        console.log(`🔍 [${new Date().toISOString()}] TOKEN VALIDATION END - Duration: ${tokenValidationEndTime - tokenValidationStartTime}ms`);

        if (!validation.isValid) {
          const authEndTime = Date.now();
          console.log(`❌ [${new Date().toISOString()}] AUTH MIDDLEWARE END (INVALID TOKEN) - Duration: ${authEndTime - authStartTime}ms`);
          res.status(401).json({
            success: false,
            error: 'Invalid or expired token',
            message: validation.error || 'Authentication failed',
            apiVersion: '1.0.0',
            namespace: 'v1'
          });
          return;
        }

        // Attach user and session to request
        req.user = validation.user;
        req.session = validation.session;
        req.userId = validation.user?.id;

        // Role-based authorization (if roles specified)
        if (options.roles && options.roles.length > 0) {
          // For now, we don't have role-based system, but this is where it would go
          // const userRoles = validation.user?.roles || [];
          // const hasRequiredRole = options.roles.some(role => userRoles.includes(role));
          // if (!hasRequiredRole) {
          //   return res.status(403).json({
          //     success: false,
          //     error: 'Insufficient permissions',
          //     message: 'You do not have permission to access this resource'
          //   });
          // }
        }

        const authEndTime = Date.now();
        console.log(`✅ [${new Date().toISOString()}] AUTH MIDDLEWARE END (SUCCESS) - Duration: ${authEndTime - authStartTime}ms`);
        next();

      } catch (error) {
        const authEndTime = Date.now();
        console.log(`❌ [${new Date().toISOString()}] AUTH MIDDLEWARE END (ERROR) - Duration: ${authEndTime - authStartTime}ms`);
        console.error('Authentication middleware error:', error);
        res.status(500).json({
          success: false,
          error: 'Authentication service error',
          message: 'An internal error occurred during authentication',
          apiVersion: '1.0.0',
          namespace: 'v1'
        });
      }
    };
  };

  // Extract token from Authorization header
  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return null;
    }

    // Check for Bearer token format
    const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
    if (bearerMatch) {
      return bearerMatch[1];
    }

    // Fallback: treat entire header as token (less secure)
    return authHeader;
  }

  // Fast JWT-only validation (no Redis/DB calls)
  private async validateJwtOnly(token: string): Promise<{
    isValid: boolean;
    user?: any;
    session?: any;
    error?: string;
  }> {
    try {
      const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
      const decoded = jwt.verify(token, jwtSecret) as any;
      
      if (!decoded.sessionId || !decoded.userId) {
        return {
          isValid: false,
          error: 'Invalid token payload'
        };
      }

      // Create minimal user object from JWT claims
      const user = {
        id: decoded.userId,
        isActive: true // Assume active for JWT-only validation
      };

      return {
        isValid: true,
        user,
        session: { sessionId: decoded.sessionId, userId: decoded.userId }
      };

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
        return {
          isValid: false,
          error: 'Invalid or expired token'
        };
      }
      
      return {
        isValid: false,
        error: 'Token validation failed'
      };
    }
  }

  // Convenience methods for common use cases
  public requireAuth = this.authenticate({ required: true });
  
  public optionalAuth = this.authenticate({ required: false });

  public requireRole = (roles: string[]) => this.authenticate({ required: true, roles });

  // Fast authentication for high-frequency endpoints
  public requireAuthFast = this.authenticate({ required: true, jwtOnly: true });

  // Middleware to check if user is active
  public requireActiveUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please authenticate to access this resource',
        apiVersion: '1.0.0',
        namespace: 'v1'
      });
      return;
    }

    if (!req.user.isActive) {
      res.status(403).json({
        success: false,
        error: 'Account deactivated',
        message: 'Your account has been deactivated. Please contact support.',
        apiVersion: '1.0.0',
        namespace: 'v1'
      });
      return;
    }

    next();
  };

  // Middleware to check if email is verified (if we implement email verification)
  public requireVerifiedEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please authenticate to access this resource',
        apiVersion: '1.0.0',
        namespace: 'v1'
      });
      return;
    }

    if (!req.user.emailVerified) {
      res.status(403).json({
        success: false,
        error: 'Email verification required',
        message: 'Please verify your email address to access this resource',
        apiVersion: '1.0.0',
        namespace: 'v1'
      });
      return;
    }

    next();
  };

  // Middleware to ensure user can only access their own resources
  public requireOwnership = (userIdField: string = 'userId') => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Please authenticate to access this resource',
          apiVersion: '1.0.0',
          namespace: 'v1'
        });
        return;
      }

      const resourceUserId = req.params[userIdField] || req.body[userIdField] || req.query[userIdField];
      
      if (!resourceUserId) {
        res.status(400).json({
          success: false,
          error: 'User ID required',
          message: `${userIdField} is required to verify ownership`,
          apiVersion: '1.0.0',
          namespace: 'v1'
        });
        return;
      }

      if (req.user.id !== resourceUserId) {
        res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You can only access your own resources',
          apiVersion: '1.0.0',
          namespace: 'v1'
        });
        return;
      }

      next();
    };
  };
}

// Export singleton instance
export const authMiddleware = new AuthMiddleware();