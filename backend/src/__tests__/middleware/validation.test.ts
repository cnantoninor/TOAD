import { Request, Response, NextFunction } from 'express';
import { sanitizeInput } from '../../middleware/validation';

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
}); 