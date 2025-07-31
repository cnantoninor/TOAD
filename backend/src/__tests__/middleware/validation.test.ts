import { Request, Response, NextFunction } from 'express';
import { validateCreateSession, validateSendMessage, validateSessionId, sanitizeInput } from '../../middleware/validation';

// Mock express-validator
jest.mock('express-validator', () => ({
    body: jest.fn(() => ({
        optional: jest.fn(() => ({
            isString: jest.fn(() => ({
                trim: jest.fn(() => ({
                    isLength: jest.fn(() => ({
                        withMessage: jest.fn(() => ({
                            escape: jest.fn(() => jest.fn())
                        }))
                    }))
                }))
            }))
        }))
    })),
    param: jest.fn(() => ({
        isUUID: jest.fn(() => ({
            withMessage: jest.fn(() => jest.fn())
        }))
    })),
    validationResult: jest.fn(() => ({
        isEmpty: jest.fn(() => true),
        array: jest.fn(() => [])
    }))
}));

describe('Validation Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction = jest.fn();

    beforeEach(() => {
        mockRequest = {
            body: {},
            params: {},
            query: {}
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        nextFunction = jest.fn();
    });

    describe('sanitizeInput', () => {
        it('should sanitize body strings', () => {
            mockRequest.body = {
                customInstructions: '  test instructions  ',
                content: '  test content  '
            };

            sanitizeInput(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockRequest.body.customInstructions).toBe('test instructions');
            expect(mockRequest.body.content).toBe('test content');
            expect(nextFunction).toHaveBeenCalled();
        });

        it('should sanitize query parameters', () => {
            mockRequest.query = {
                search: '  test search  '
            };

            sanitizeInput(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockRequest.query.search).toBe('test search');
            expect(nextFunction).toHaveBeenCalled();
        });

        it('should handle non-string values', () => {
            mockRequest.body = {
                number: 123,
                boolean: true,
                array: ['test']
            };

            sanitizeInput(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockRequest.body.number).toBe(123);
            expect(mockRequest.body.boolean).toBe(true);
            expect(mockRequest.body.array).toEqual(['test']);
            expect(nextFunction).toHaveBeenCalled();
        });
    });

    describe('validateCreateSession', () => {
        it('should pass validation for valid input', () => {
            mockRequest.body = {
                customInstructions: 'Valid instructions'
            };

            // Since we're mocking validationResult to return empty, this should pass
            validateCreateSession[0](mockRequest as Request, mockResponse as Response, nextFunction);

            expect(nextFunction).toHaveBeenCalled();
        });
    });

    describe('validateSendMessage', () => {
        it('should pass validation for valid input', () => {
            mockRequest.params = { sessionId: '550e8400-e29b-41d4-a716-446655440000' };
            mockRequest.body = { content: 'Valid message' };

            // Since we're mocking validationResult to return empty, this should pass
            validateSendMessage[0](mockRequest as Request, mockResponse as Response, nextFunction);
            validateSendMessage[1](mockRequest as Request, mockResponse as Response, nextFunction);

            expect(nextFunction).toHaveBeenCalled();
        });
    });

    describe('validateSessionId', () => {
        it('should pass validation for valid session ID', () => {
            mockRequest.params = { sessionId: '550e8400-e29b-41d4-a716-446655440000' };

            // Since we're mocking validationResult to return empty, this should pass
            validateSessionId[0](mockRequest as Request, mockResponse as Response, nextFunction);

            expect(nextFunction).toHaveBeenCalled();
        });
    });
}); 