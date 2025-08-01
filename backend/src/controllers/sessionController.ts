import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { SessionModel } from '../models/session';
import { OpenAIService } from '../services/openai';
import { Logger } from '../utils/logger';
import { Session, Message, CreateSessionRequest, SendMessageRequest, SendMessageResponse } from '../types';

export class SessionController {
    static async createSession(req: Request, res: Response): Promise<void> {
        const { correlationId } = req;
        const { customInstructions } = req.body as CreateSessionRequest;

        try {
            const sessionId = uuidv4();

            const session: Omit<Session, 'createdAt' | 'lastAccessed'> = {
                sessionId,
                currentPhase: 1,
                customInstructions,
                conversationHistory: []
            };

            const createdSession = await SessionModel.create(session);

            Logger.logSessionCreated(sessionId, correlationId);

            res.status(201).json(createdSession);
        } catch (error) {
            Logger.logError(error as Error, correlationId);
            res.status(500).json({
                error: 'Failed to create session',
                message: 'Internal server error',
                correlationId
            });
        }
    }

    static async getSession(req: Request, res: Response): Promise<void> {
        const { correlationId } = req;
        const { sessionId } = req.params;

        try {
            const session = await SessionModel.getById(sessionId);

            if (!session) {
                Logger.warn('Session not found', { sessionId, correlationId });
                res.status(404).json({
                    error: 'Session not found',
                    message: 'The requested session does not exist',
                    correlationId
                });
                return;
            }

            res.json(session);
        } catch (error) {
            Logger.logError(error as Error, correlationId, sessionId);
            res.status(500).json({
                error: 'Failed to get session',
                message: 'Internal server error',
                correlationId
            });
        }
    }

    static async sendMessage(req: Request, res: Response): Promise<void> {
        const { correlationId } = req;
        const { sessionId } = req.params;
        const { content } = req.body as SendMessageRequest;

        try {
            const session = await SessionModel.getById(sessionId);
            if (!session) {
                Logger.warn('Session not found for message', { sessionId, correlationId });
                res.status(404).json({
                    error: 'Session not found',
                    message: 'The requested session does not exist',
                    correlationId
                });
                return;
            }

            // Add user message
            const userMessage: Message = {
                id: uuidv4(),
                timestamp: new Date(),
                role: 'user',
                content
            };

            await SessionModel.addMessage(sessionId, userMessage);
            Logger.logMessageSent(sessionId, correlationId, content.length);

            // Generate AI response
            const aiResponse = await OpenAIService.generateResponse(
                [...session.conversationHistory, userMessage],
                session.customInstructions,
                correlationId
            );

            // Add AI message
            const aiMessage: Message = {
                id: uuidv4(),
                timestamp: new Date(),
                role: 'assistant',
                content: aiResponse
            };

            await SessionModel.addMessage(sessionId, aiMessage);

            // Get updated session
            const updatedSession = await SessionModel.getById(sessionId);
            if (!updatedSession) {
                throw new Error('Session not found after update');
            }

            const response: SendMessageResponse = {
                sessionId,
                message: aiMessage,
                conversationHistory: updatedSession.conversationHistory
            };

            res.json(response);
        } catch (error) {
            Logger.logError(error as Error, correlationId, sessionId);

            if (error instanceof Error) {
                if (error.message.includes('Rate limit') || error.message.includes('quota')) {
                    res.status(429).json({
                        error: 'Rate limit exceeded',
                        message: error.message,
                        correlationId
                    });
                    return;
                }
            }

            res.status(500).json({
                error: 'Failed to send message',
                message: 'Internal server error',
                correlationId
            });
        }
    }

    static async exportSession(req: Request, res: Response): Promise<void> {
        const { correlationId } = req;
        const { sessionId } = req.params;

        try {
            const session = await SessionModel.getById(sessionId);

            if (!session) {
                Logger.warn('Session not found for export', { sessionId, correlationId });
                res.status(404).json({
                    error: 'Session not found',
                    message: 'The requested session does not exist',
                    correlationId
                });
                return;
            }

            const markdown = generateMarkdownExport(session);

            res.setHeader('Content-Type', 'text/markdown');
            res.setHeader('Content-Disposition', `attachment; filename="session-${sessionId}.md"`);
            res.send(markdown);

            Logger.info('Session exported successfully', { sessionId, correlationId });
        } catch (error) {
            Logger.logError(error as Error, correlationId, sessionId);
            res.status(500).json({
                error: 'Failed to export session',
                message: 'Internal server error',
                correlationId
            });
        }
    }

    static async healthCheck(req: Request, res: Response): Promise<void> {
        const { correlationId } = req;

        try {
            // Check database connection
            await SessionModel.getById('health-check');

            // Check OpenAI API
            const openaiValid = await OpenAIService.validateApiKey();

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
        } catch (error) {
            Logger.logError(error as Error, correlationId);
            res.status(503).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                correlationId,
                error: 'Health check failed'
            });
        }
    }
}

function generateMarkdownExport(session: Session): string {
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
            session.summary.keyPoints.forEach((point: string) => {
                markdown += `- ${point}\n`;
            });
        }
        markdown += `\n**Current Phase:** ${session.summary.currentPhase || 1}\n`;
        markdown += `**Next Steps:**\n`;
        if (Array.isArray(session.summary.nextSteps)) {
            session.summary.nextSteps.forEach((step: string) => {
                markdown += `- ${step}\n`;
            });
        }
        markdown += `\n`;
    }

    markdown += `## Conversation History\n\n`;

    session.conversationHistory.forEach((message, index) => {
        const role = message.role === 'user' ? '👤 User' : '🤖 AI Assistant';
        const timestamp = message.timestamp instanceof Date 
            ? message.timestamp.toISOString() 
            : new Date(message.timestamp).toISOString();

        markdown += `### ${role} (${timestamp})\n\n`;
        markdown += `${message.content}\n\n`;

        if (index < session.conversationHistory.length - 1) {
            markdown += `---\n\n`;
        }
    });

    return markdown;
} 