import { Request, Response, NextFunction } from 'express';
export declare const handleValidationErrors: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateCreateSession: (((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined) | import("express-validator").ValidationChain)[];
export declare const validateSendMessage: (((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined) | import("express-validator").ValidationChain)[];
export declare const validateSessionId: (((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined) | import("express-validator").ValidationChain)[];
export declare const sanitizeInput: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validation.d.ts.map