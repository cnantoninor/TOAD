import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { Logger } from '../utils/logger';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg);
        Logger.warn('Validation error', {
            errors: errorMessages,
            path: req.path,
            method: req.method
        });

        res.status(400).json({
            error: 'Validation failed',
            message: 'Invalid input data',
            details: errorMessages
        });
        return;
    }
    next();
};

export const validateCreateSession = [
    body('customInstructions')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Custom instructions must be a string with maximum 2000 characters')
        .escape(),
    handleValidationErrors
];

export const validateSendMessage = [
    param('sessionId')
        .isUUID(4)
        .withMessage('Session ID must be a valid UUID'),
    body('content')
        .isString()
        .trim()
        .isLength({ min: 1, max: 5000 })
        .withMessage('Message content must be between 1 and 5000 characters')
        .escape(),
    handleValidationErrors
];

export const validateSessionId = [
    param('sessionId')
        .isUUID(4)
        .withMessage('Session ID must be a valid UUID'),
    handleValidationErrors
];

export const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
    // Sanitize body
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = req.body[key].trim();
            }
        });
    }

    // Sanitize query parameters
    if (req.query) {
        Object.keys(req.query).forEach(key => {
            if (typeof req.query[key] === 'string') {
                req.query[key] = (req.query[key] as string).trim();
            }
        });
    }

    next();
}; 