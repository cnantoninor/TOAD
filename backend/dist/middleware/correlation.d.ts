import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            correlationId: string;
        }
    }
}
export declare const addCorrelationId: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=correlation.d.ts.map