"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeInput = exports.validateSessionId = exports.validateSendMessage = exports.validateCreateSession = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
const logger_1 = require("../utils/logger");
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg);
        logger_1.Logger.warn('Validation error', {
            errors: errorMessages,
            path: req.path,
            method: req.method
        });
        return res.status(400).json({
            error: 'Validation failed',
            message: 'Invalid input data',
            details: errorMessages
        });
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
exports.validateCreateSession = [
    (0, express_validator_1.body)('customInstructions')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Custom instructions must be a string with maximum 2000 characters')
        .escape(),
    exports.handleValidationErrors
];
exports.validateSendMessage = [
    (0, express_validator_1.param)('sessionId')
        .isUUID(4)
        .withMessage('Session ID must be a valid UUID'),
    (0, express_validator_1.body)('content')
        .isString()
        .trim()
        .isLength({ min: 1, max: 5000 })
        .withMessage('Message content must be between 1 and 5000 characters')
        .escape(),
    exports.handleValidationErrors
];
exports.validateSessionId = [
    (0, express_validator_1.param)('sessionId')
        .isUUID(4)
        .withMessage('Session ID must be a valid UUID'),
    exports.handleValidationErrors
];
const sanitizeInput = (req, res, next) => {
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
                req.query[key] = req.query[key].trim();
            }
        });
    }
    next();
};
exports.sanitizeInput = sanitizeInput;
//# sourceMappingURL=validation.js.map