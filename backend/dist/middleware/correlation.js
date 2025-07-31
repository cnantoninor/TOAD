"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCorrelationId = void 0;
const uuid_1 = require("uuid");
const addCorrelationId = (req, res, next) => {
    // Use existing correlation ID from headers or generate new one
    req.correlationId = req.headers['x-correlation-id'] || (0, uuid_1.v4)();
    // Add correlation ID to response headers
    res.setHeader('x-correlation-id', req.correlationId);
    next();
};
exports.addCorrelationId = addCorrelationId;
//# sourceMappingURL=correlation.js.map