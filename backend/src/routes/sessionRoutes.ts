import { Router } from 'express';
import { SessionController } from '../controllers/sessionController';
import {
    validateCreateSession,
    validateSendMessage,
    validateSessionId,
    sanitizeInput
} from '../middleware/validation';
import { addCorrelationId } from '../middleware/correlation';

const router = Router();

// Add correlation ID to all requests
router.use(addCorrelationId);

// Sanitize all inputs
router.use(sanitizeInput);

// Session routes
router.post('/sessions', validateCreateSession, SessionController.createSession);
router.get('/sessions/:sessionId', validateSessionId, SessionController.getSession);
router.post('/sessions/:sessionId/messages', validateSendMessage, SessionController.sendMessage);
router.get('/sessions/:sessionId/export', validateSessionId, SessionController.exportSession);

// Health check
router.get('/health', SessionController.healthCheck);

export default router; 