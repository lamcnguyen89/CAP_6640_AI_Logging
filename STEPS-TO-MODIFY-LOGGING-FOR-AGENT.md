Implementation Strategy
You need to make three key changes:

1. Switch to JSON Format in Winston
   Your current logger uses a custom printf format. For AI parsing, you need JSON format with a correlationId field:

In logger.ts, modify the format (around lines 43-52):

```
// Replace the current format with:
this.winstonLogger = winston.createLogger({
  level: this.getWinstonLevel(),
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.errors({ stack: true }),
    winston.format.json() // JSON format for AI parsing
  ),
  transports: this.getTransports(),
  silent: this.isTestMode,
});
```

2. Create Middleware to Generate and Track Correlation IDs
   You'll need Express middleware that:

Generates a unique requestId for each HTTP request
Stores it in a way that's accessible throughout the request lifecycle
Optionally accepts an existing correlationId from client headers
Create a new file: `server/src/middleware/correlationId.ts:`

```
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
```

3. Modify Logger to Include Correlation ID
   Update logger.ts to include correlationId in every log:

```
// Add import at top
import { asyncLocalStorage } from '../middleware/correlationId';

// Modify the logging methods (error, warn, info, debug) to include correlationId
// For example, update the error method around line 164:

error(message: string, meta?: any): void {
  const correlationId = asyncLocalStorage.getStore()?.correlationId;
  this.winstonLogger.error(message, {
    correlationId,
    ...meta
  });
}

warn(message: string, meta?: any): void {
  const correlationId = asyncLocalStorage.getStore()?.correlationId;
  this.winstonLogger.warn(message, {
    correlationId,
    ...meta
  });
}

info(message: string, meta?: any): void {
  const correlationId = asyncLocalStorage.getStore()?.correlationId;
  this.winstonLogger.info(message, {
    correlationId,
    ...meta
  });
}

debug(message: string, meta?: any): void {
  const correlationId = asyncLocalStorage.getStore()?.correlationId;
  this.winstonLogger.debug(message, {
    correlationId,
    ...meta
  });
}
```

4. Register Middleware in Server
   In server.ts, add the middleware before routes (around line 59, after bodyParser):

```
import { correlationIdMiddleware } from './middleware/correlationId';

// Add after express.json() and before routes
app.use(correlationIdMiddleware);
```

5. Usage Example
   Once implemented, your logs will automatically include correlationId:

```
// In any route or service
logger.info('User logged in', { userId: user.id, email: user.email });
logger.debug('Fetching experiments for user', { userId: user.id });
logger.error('Database query failed', { error: err.message });
```

MongoDB documents will look like:

```
{
  "timestamp": "2026-04-06 10:30:15",
  "level": "info",
  "message": "User logged in",
  "correlationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "userId": "123",
  "email": "user@example.com"
}
```
