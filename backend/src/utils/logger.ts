import winston from 'winston';
import path from 'path';

// Create logs directory if it doesn't exist
import fs from 'fs';
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'toad-architect-backend' },
    transports: [
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error'
        }),
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log')
        }),
    ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

export class Logger {
    static info(message: string, context?: Record<string, any>) {
        logger.info(message, context);
    }

    static error(message: string, error?: Error, context?: Record<string, any>) {
        logger.error(message, {
            error: error?.message,
            stack: error?.stack,
            ...context
        });
    }

    static warn(message: string, context?: Record<string, any>) {
        logger.warn(message, context);
    }

    static debug(message: string, context?: Record<string, any>) {
        logger.debug(message, context);
    }

    static logApiRequest(method: string, url: string, correlationId: string, sessionId?: string) {
        this.info('API Request', {
            correlationId,
            sessionId,
            action: 'api_request',
            method,
            url,
            timestamp: new Date()
        });
    }

    static logApiResponse(statusCode: number, correlationId: string, sessionId?: string) {
        this.info('API Response', {
            correlationId,
            sessionId,
            action: 'api_response',
            statusCode,
            timestamp: new Date()
        });
    }

    static logSessionCreated(sessionId: string, correlationId: string) {
        this.info('Session Created', {
            correlationId,
            sessionId,
            action: 'session_created',
            timestamp: new Date()
        });
    }

    static logMessageSent(sessionId: string, correlationId: string, messageLength: number) {
        this.info('Message Sent', {
            correlationId,
            sessionId,
            action: 'message_sent',
            messageLength,
            timestamp: new Date()
        });
    }

    static logAiResponse(sessionId: string, correlationId: string, responseLength: number, duration: number) {
        this.info('AI Response Generated', {
            correlationId,
            sessionId,
            action: 'ai_response',
            responseLength,
            duration,
            timestamp: new Date()
        });
    }

    static logError(error: Error, correlationId: string, sessionId?: string) {
        this.error('Application Error', error, {
            correlationId,
            sessionId,
            action: 'error',
            timestamp: new Date()
        });
    }
} 