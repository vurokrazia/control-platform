import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const authController = new AuthController();

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - name
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           minLength: 6
 *           maxLength: 128
 *           example: mySecurePassword123
 *           description: User's password (min 6 characters)
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: John Doe
 *           description: User's full name
 *     
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           example: mySecurePassword123
 *           description: User's password
 *     
 *     ChangePasswordRequest:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           format: password
 *           example: currentPassword123
 *           description: User's current password
 *         newPassword:
 *           type: string
 *           format: password
 *           minLength: 6
 *           maxLength: 128
 *           example: newSecurePassword456
 *           description: New password (min 6 characters)
 *     
 *     UserResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: a1b2c3d4-e5f6-7890-abcd-ef1234567890
 *           description: Unique user identifier (UUID)
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *           description: User's email address
 *         name:
 *           type: string
 *           example: John Doe
 *           description: User's full name
 *         isActive:
 *           type: boolean
 *           example: true
 *           description: Whether the user account is active
 *         emailVerified:
 *           type: boolean
 *           example: false
 *           description: Whether the user's email is verified
 *         lastLoginAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: 2024-01-20T10:30:00.000Z
 *           description: Last login timestamp
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2024-01-20T10:00:00.000Z
 *           description: Account creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2024-01-20T10:30:00.000Z
 *           description: Last update timestamp
 *   
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT token for authentication. Include as "Bearer {token}" in Authorization header.
 */

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication and session management
 */

// Public routes (no authentication required)
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes (authentication required)
router.post('/logout', authMiddleware.requireAuth, authController.logout);
router.get('/me', authMiddleware.requireAuth, authController.getProfile);
router.post('/sessions/revoke', authMiddleware.requireAuth, authController.revokeAllSessions);
router.post('/password/change', authMiddleware.requireAuth, authController.changePassword);

export default router;