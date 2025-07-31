import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
    namespace Express {
        interface Request {
            correlationId: string;
        }
    }
}

export const addCorrelationId = (req: Request, res: Response, next: NextFunction) => {
    // Use existing correlation ID from headers or generate new one
    req.correlationId = req.headers['x-correlation-id'] as string || uuidv4();

    // Add correlation ID to response headers
    res.setHeader('x-correlation-id', req.correlationId);

    next();
}; 