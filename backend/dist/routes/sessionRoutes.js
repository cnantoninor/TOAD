"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sessionController_1 = require("../controllers/sessionController");
const validation_1 = require("../middleware/validation");
const correlation_1 = require("../middleware/correlation");
const router = (0, express_1.Router)();
// Add correlation ID to all requests
router.use(correlation_1.addCorrelationId);
// Sanitize all inputs
router.use(validation_1.sanitizeInput);
// Session routes
router.post('/sessions', validation_1.validateCreateSession, sessionController_1.SessionController.createSession);
router.get('/sessions/:sessionId', validation_1.validateSessionId, sessionController_1.SessionController.getSession);
router.post('/sessions/:sessionId/messages', validation_1.validateSendMessage, sessionController_1.SessionController.sendMessage);
router.get('/sessions/:sessionId/export', validation_1.validateSessionId, sessionController_1.SessionController.exportSession);
// Health check
router.get('/health', sessionController_1.SessionController.healthCheck);
exports.default = router;
//# sourceMappingURL=sessionRoutes.js.map