"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
// Create logs directory if it doesn't exist
const fs_1 = __importDefault(require("fs"));
const logsDir = path_1.default.join(__dirname, '../../logs');
if (!fs_1.default.existsSync(logsDir)) {
    fs_1.default.mkdirSync(logsDir, { recursive: true });
}
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    defaultMeta: { service: 'toad-architect-backend' },
    transports: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'error.log'),
            level: 'error'
        }),
        new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'combined.log')
        }),
    ],
});
// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
    }));
}
class Logger {
    static info(message, context) {
        logger.info(message, context);
    }
    static error(message, error, context) {
        logger.error(message, {
            error: error?.message,
            stack: error?.stack,
            ...context
        });
    }
    static warn(message, context) {
        logger.warn(message, context);
    }
    static debug(message, context) {
        logger.debug(message, context);
    }
    static logApiRequest(method, url, correlationId, sessionId) {
        this.info('API Request', {
            correlationId,
            sessionId,
            action: 'api_request',
            method,
            url,
            timestamp: new Date()
        });
    }
    static logApiResponse(statusCode, correlationId, sessionId) {
        this.info('API Response', {
            correlationId,
            sessionId,
            action: 'api_response',
            statusCode,
            timestamp: new Date()
        });
    }
    static logSessionCreated(sessionId, correlationId) {
        this.info('Session Created', {
            correlationId,
            sessionId,
            action: 'session_created',
            timestamp: new Date()
        });
    }
    static logMessageSent(sessionId, correlationId, messageLength) {
        this.info('Message Sent', {
            correlationId,
            sessionId,
            action: 'message_sent',
            messageLength,
            timestamp: new Date()
        });
    }
    static logAiResponse(sessionId, correlationId, responseLength, duration) {
        this.info('AI Response Generated', {
            correlationId,
            sessionId,
            action: 'ai_response',
            responseLength,
            duration,
            timestamp: new Date()
        });
    }
    static logError(error, correlationId, sessionId) {
        this.error('Application Error', error, {
            correlationId,
            sessionId,
            action: 'error',
            timestamp: new Date()
        });
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map