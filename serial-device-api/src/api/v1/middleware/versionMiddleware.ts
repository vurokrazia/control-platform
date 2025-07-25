import { Request, Response, NextFunction } from 'express';

export const versionMiddleware = (_req: Request, res: Response, next: NextFunction) => {
  // Add API version headers to all responses
  res.setHeader('API-Version', '1.0.0');
  res.setHeader('API-Namespace', 'v1');
  res.setHeader('X-API-Version', '1.0.0');
  
  // Add version info to response body for JSON responses
  const originalJson = res.json;
  res.json = function(obj: any) {
    if (obj && typeof obj === 'object') {
      obj.apiVersion = '1.0.0';
      obj.namespace = 'v1';
    }
    return originalJson.call(this, obj);
  };
  
  next();
};