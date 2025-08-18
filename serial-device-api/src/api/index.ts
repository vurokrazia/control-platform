import express from 'express';
import v1Routes from './v1';
import { authMiddleware } from './v1/middleware/authMiddleware';

const router = express.Router();

// Global authentication middleware for ALL API requests
// Exclude only auth endpoints
router.use((req, res, next) => {
  // Allow auth endpoints without token
  if (req.path.startsWith('/v1/auth/register') || req.path.startsWith('/v1/auth/login')) {
    return next();
  }
  
  // Use fast JWT-only authentication for MQTT publish endpoints
  if (req.path.includes('/mqtt-topics/publish')) {
    return authMiddleware.requireAuthFast(req, res, next);
  }
  
  // Require full authentication for all other endpoints
  return authMiddleware.requireAuth(req, res, next);
});

// Mount API versions
router.use('/v1', v1Routes);

// API root endpoint
router.get('/', (_req, res) => {
  res.json({
    name: 'Control Platform Serial Device API',
    description: 'RESTful API for managing Arduino serial connections and communication',
    versions: {
      'v1': {
        version: '1.0.0',
        status: 'stable',
        path: '/api/v1',
        documentation: '/docs/v1'
      }
    },
    currentVersion: 'v1',
    repository: 'https://github.com/your-repo/control-platform',
    support: 'https://github.com/your-repo/control-platform/issues'
  });
});

export default router;