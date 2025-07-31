export declare class Logger {
    static info(message: string, context?: Record<string, any>): void;
    static error(message: string, error?: Error, context?: Record<string, any>): void;
    static warn(message: string, context?: Record<string, any>): void;
    static debug(message: string, context?: Record<string, any>): void;
    static logApiRequest(method: string, url: string, correlationId: string, sessionId?: string): void;
    static logApiResponse(statusCode: number, correlationId: string, sessionId?: string): void;
    static logSessionCreated(sessionId: string, correlationId: string): void;
    static logMessageSent(sessionId: string, correlationId: string, messageLength: number): void;
    static logAiResponse(sessionId: string, correlationId: string, responseLength: number, duration: number): void;
    static logError(error: Error, correlationId: string, sessionId?: string): void;
}
//# sourceMappingURL=logger.d.ts.map