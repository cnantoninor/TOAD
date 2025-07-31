import { Logger } from '../../utils/logger';

// Mock winston
jest.mock('winston', () => ({
    createLogger: jest.fn(() => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    })),
    format: {
        combine: jest.fn(),
        timestamp: jest.fn(),
        errors: jest.fn(),
        json: jest.fn(),
        colorize: jest.fn(),
        simple: jest.fn()
    },
    transports: {
        File: jest.fn(),
        Console: jest.fn()
    }
}));

describe('Logger', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('basic logging methods', () => {
        it('should call info method', () => {
            const spy = jest.spyOn(Logger, 'info');
            Logger.info('Test info message');
            expect(spy).toHaveBeenCalledWith('Test info message');
        });

        it('should call error method', () => {
            const spy = jest.spyOn(Logger, 'error');
            const error = new Error('Test error');
            Logger.error('Test error message', error);
            expect(spy).toHaveBeenCalledWith('Test error message', error);
        });

        it('should call warn method', () => {
            const spy = jest.spyOn(Logger, 'warn');
            Logger.warn('Test warning message');
            expect(spy).toHaveBeenCalledWith('Test warning message');
        });

        it('should call debug method', () => {
            const spy = jest.spyOn(Logger, 'debug');
            Logger.debug('Test debug message');
            expect(spy).toHaveBeenCalledWith('Test debug message');
        });
    });

    describe('specialized logging methods', () => {
        it('should log API request', () => {
            const spy = jest.spyOn(Logger, 'info');
            Logger.logApiRequest('GET', '/api/sessions', 'test-correlation-id', 'test-session-id');

            expect(spy).toHaveBeenCalledWith('API Request', {
                correlationId: 'test-correlation-id',
                sessionId: 'test-session-id',
                action: 'api_request',
                method: 'GET',
                url: '/api/sessions',
                timestamp: expect.any(Date)
            });
        });

        it('should log API response', () => {
            const spy = jest.spyOn(Logger, 'info');
            Logger.logApiResponse(200, 'test-correlation-id', 'test-session-id');

            expect(spy).toHaveBeenCalledWith('API Response', {
                correlationId: 'test-correlation-id',
                sessionId: 'test-session-id',
                action: 'api_response',
                statusCode: 200,
                timestamp: expect.any(Date)
            });
        });

        it('should log session creation', () => {
            const spy = jest.spyOn(Logger, 'info');
            Logger.logSessionCreated('test-session-id', 'test-correlation-id');

            expect(spy).toHaveBeenCalledWith('Session Created', {
                correlationId: 'test-correlation-id',
                sessionId: 'test-session-id',
                action: 'session_created',
                timestamp: expect.any(Date)
            });
        });

        it('should log message sent', () => {
            const spy = jest.spyOn(Logger, 'info');
            Logger.logMessageSent('test-session-id', 'test-correlation-id', 100);

            expect(spy).toHaveBeenCalledWith('Message Sent', {
                correlationId: 'test-correlation-id',
                sessionId: 'test-session-id',
                action: 'message_sent',
                messageLength: 100,
                timestamp: expect.any(Date)
            });
        });

        it('should log AI response', () => {
            const spy = jest.spyOn(Logger, 'info');
            Logger.logAiResponse('test-session-id', 'test-correlation-id', 500, 1000);

            expect(spy).toHaveBeenCalledWith('AI Response Generated', {
                correlationId: 'test-correlation-id',
                sessionId: 'test-session-id',
                action: 'ai_response',
                responseLength: 500,
                duration: 1000,
                timestamp: expect.any(Date)
            });
        });

        it('should log error', () => {
            const spy = jest.spyOn(Logger, 'error');
            const error = new Error('Test error');
            Logger.logError(error, 'test-correlation-id', 'test-session-id');

            expect(spy).toHaveBeenCalledWith('Application Error', error, {
                correlationId: 'test-correlation-id',
                sessionId: 'test-session-id',
                action: 'error',
                timestamp: expect.any(Date)
            });
        });
    });

    describe('context handling', () => {
        it('should handle optional context parameters', () => {
            const spy = jest.spyOn(Logger, 'info');
            Logger.logApiRequest('GET', '/api/sessions', 'test-correlation-id');

            expect(spy).toHaveBeenCalledWith('API Request', {
                correlationId: 'test-correlation-id',
                sessionId: undefined,
                action: 'api_request',
                method: 'GET',
                url: '/api/sessions',
                timestamp: expect.any(Date)
            });
        });

        it('should handle error without session ID', () => {
            const spy = jest.spyOn(Logger, 'error');
            const error = new Error('Test error');
            Logger.logError(error, 'test-correlation-id');

            expect(spy).toHaveBeenCalledWith('Application Error', error, {
                correlationId: 'test-correlation-id',
                sessionId: undefined,
                action: 'error',
                timestamp: expect.any(Date)
            });
        });
    });
}); 