import express from 'express';
import v1Routes from './v1';

const router = express.Router();

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