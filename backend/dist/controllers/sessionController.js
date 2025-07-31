"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionController = void 0;
const uuid_1 = require("uuid");
const session_1 = require("../models/session");
const openai_1 = require("../services/openai");
const logger_1 = require("../utils/logger");
class SessionController {
    static async createSession(req, res) {
        const { correlationId } = req;
        const { customInstructions } = req.body;
        try {
            const sessionId = (0, uuid_1.v4)();
            const session = {
                sessionId,
                currentPhase: 1,
                customInstructions,
                conversationHistory: []
            };
            const createdSession = await session_1.SessionModel.create(session);
            logger_1.Logger.logSessionCreated(sessionId, correlationId);
            res.status(201).json(createdSession);
        }
        catch (error) {
            logger_1.Logger.logError(error, correlationId);
            res.status(500).json({
                error: 'Failed to create session',
                message: 'Internal server error',
                correlationId
            });
        }
    }
    static async getSession(req, res) {
        const { correlationId } = req;
        const { sessionId } = req.params;
        try {
            const session = await session_1.SessionModel.getById(sessionId);
            if (!session) {
                logger_1.Logger.warn('Session not found', { sessionId, correlationId });
                return res.status(404).json({
                    error: 'Session not found',
                    message: 'The requested session does not exist',
                    correlationId
                });
            }
            res.json(session);
        }
        catch (error) {
            logger_1.Logger.logError(error, correlationId, sessionId);
            res.status(500).json({
                error: 'Failed to get session',
                message: 'Internal server error',
                correlationId
            });
        }
    }
    static async sendMessage(req, res) {
        const { correlationId } = req;
        const { sessionId } = req.params;
        const { content } = req.body;
        try {
            const session = await session_1.SessionModel.getById(sessionId);
            if (!session) {
                logger_1.Logger.warn('Session not found for message', { sessionId, correlationId });
                return res.status(404).json({
                    error: 'Session not found',
                    message: 'The requested session does not exist',
                    correlationId
                });
            }
            // Add user message
            const userMessage = {
                id: (0, uuid_1.v4)(),
                timestamp: new Date(),
                role: 'user',
                content
            };
            await session_1.SessionModel.addMessage(sessionId, userMessage);
            logger_1.Logger.logMessageSent(sessionId, correlationId, content.length);
            // Generate AI response
            const aiResponse = await openai_1.OpenAIService.generateResponse([...session.conversationHistory, userMessage], session.customInstructions, correlationId);
            // Add AI message
            const aiMessage = {
                id: (0, uuid_1.v4)(),
                timestamp: new Date(),
                role: 'assistant',
                content: aiResponse
            };
            await session_1.SessionModel.addMessage(sessionId, aiMessage);
            // Get updated session
            const updatedSession = await session_1.SessionModel.getById(sessionId);
            if (!updatedSession) {
                throw new Error('Session not found after update');
            }
            const response = {
                sessionId,
                message: aiMessage,
                conversationHistory: updatedSession.conversationHistory
            };
            res.json(response);
        }
        catch (error) {
            logger_1.Logger.logError(error, correlationId, sessionId);
            if (error instanceof Error) {
                if (error.message.includes('Rate limit') || error.message.includes('quota')) {
                    return res.status(429).json({
                        error: 'Rate limit exceeded',
                        message: error.message,
                        correlationId
                    });
                }
            }
            res.status(500).json({
                error: 'Failed to send message',
                message: 'Internal server error',
                correlationId
            });
        }
    }
    static async exportSession(req, res) {
        const { correlationId } = req;
        const { sessionId } = req.params;
        try {
            const session = await session_1.SessionModel.getById(sessionId);
            if (!session) {
                logger_1.Logger.warn('Session not found for export', { sessionId, correlationId });
                return res.status(404).json({
                    error: 'Session not found',
                    message: 'The requested session does not exist',
                    correlationId
                });
            }
            const markdown = generateMarkdownExport(session);
            res.setHeader('Content-Type', 'text/markdown');
            res.setHeader('Content-Disposition', `attachment; filename="session-${sessionId}.md"`);
            res.send(markdown);
            logger_1.Logger.info('Session exported successfully', { sessionId, correlationId });
        }
        catch (error) {
            logger_1.Logger.logError(error, correlationId, sessionId);
            res.status(500).json({
                error: 'Failed to export session',
                message: 'Internal server error',
                correlationId
            });
        }
    }
    static async healthCheck(req, res) {
        const { correlationId } = req;
        try {
            // Check database connection
            const testSession = await session_1.SessionModel.getById('health-check');
            // Check OpenAI API
            const openaiValid = await openai_1.OpenAIService.validateApiKey();
            const status = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                correlationId,
                services: {
                    database: 'connected',
                    openai: openaiValid ? 'connected' : 'error'
                }
            };
            const statusCode = openaiValid ? 200 : 503;
            res.status(statusCode).json(status);
        }
        catch (error) {
            logger_1.Logger.logError(error, correlationId);
            res.status(503).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                correlationId,
                error: 'Health check failed'
            });
        }
    }
}
exports.SessionController = SessionController;
function generateMarkdownExport(session) {
    let markdown = `# Software Architecture Session\n\n`;
    markdown += `**Session ID:** ${session.sessionId}\n`;
    markdown += `**Created:** ${session.createdAt.toISOString()}\n`;
    markdown += `**Last Accessed:** ${session.lastAccessed.toISOString()}\n`;
    markdown += `**Current Phase:** ${session.currentPhase}\n\n`;
    if (session.customInstructions) {
        markdown += `## Custom Instructions\n\n${session.customInstructions}\n\n`;
    }
    if (session.summary && typeof session.summary === 'object') {
        markdown += `## Conversation Summary\n\n`;
        markdown += `**Key Points:**\n`;
        if (Array.isArray(session.summary.keyPoints)) {
            session.summary.keyPoints.forEach((point) => {
                markdown += `- ${point}\n`;
            });
        }
        markdown += `\n**Current Phase:** ${session.summary.currentPhase || 1}\n`;
        markdown += `**Next Steps:**\n`;
        if (Array.isArray(session.summary.nextSteps)) {
            session.summary.nextSteps.forEach((step) => {
                markdown += `- ${step}\n`;
            });
        }
        markdown += `\n`;
    }
    markdown += `## Conversation History\n\n`;
    session.conversationHistory.forEach((message, index) => {
        const role = message.role === 'user' ? '👤 User' : '🤖 AI Assistant';
        const timestamp = message.timestamp.toISOString();
        markdown += `### ${role} (${timestamp})\n\n`;
        markdown += `${message.content}\n\n`;
        if (index < session.conversationHistory.length - 1) {
            markdown += `---\n\n`;
        }
    });
    return markdown;
}
//# sourceMappingURL=sessionController.js.map