import { Request, Response } from 'express';
export declare class SessionController {
    static createSession(req: Request, res: Response): Promise<void>;
    static getSession(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static sendMessage(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static exportSession(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static healthCheck(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=sessionController.d.ts.map