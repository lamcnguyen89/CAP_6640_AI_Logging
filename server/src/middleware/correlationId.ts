// This file creates a correlation ID for each request in order to track an individual users's activity across thee application.

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid'; // npm install uuid @types/uuid
import { AsyncLocalStorage } from 'async_hooks';

// AsyncLocalStorage maintains context throughout async operations
export const asyncLocalStorage = new AsyncLocalStorage<{ correlationId: string }>();

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction) {
  // Check if client sent a correlation ID (for multi-service tracking)
  const correlationId = 
    req.headers['x-correlation-id'] as string || 
    req.headers['x-request-id'] as string ||
    uuidv4();

  // Store in response header for client reference
  res.setHeader('x-correlation-id', correlationId);

  // Store in async context - available to all code during this request
  asyncLocalStorage.run({ correlationId }, () => {
    next();
  });
}