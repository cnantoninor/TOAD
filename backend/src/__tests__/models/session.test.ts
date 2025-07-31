import { SessionModel } from '../../models/session';
import { Session, Message } from '../../types';

describe('SessionModel', () => {
    const mockSession: Omit<Session, 'createdAt' | 'lastAccessed'> = {
        sessionId: 'test-session-id',
        currentPhase: 1,
        customInstructions: 'Test instructions',
        conversationHistory: []
    };

    const mockMessage: Message = {
        id: 'test-message-id',
        timestamp: new Date(),
        role: 'user',
        content: 'Test message'
    };

    describe('create', () => {
        it('should create a new session', async () => {
            const result = await SessionModel.create(mockSession);

            expect(result.sessionId).toBe(mockSession.sessionId);
            expect(result.currentPhase).toBe(mockSession.currentPhase);
            expect(result.customInstructions).toBe(mockSession.customInstructions);
            expect(result.conversationHistory).toEqual(mockSession.conversationHistory);
            expect(result.createdAt).toBeInstanceOf(Date);
            expect(result.lastAccessed).toBeInstanceOf(Date);
        });

        it('should throw error for duplicate session ID', async () => {
            await SessionModel.create(mockSession);

            await expect(SessionModel.create(mockSession)).rejects.toThrow();
        });
    });

    describe('getById', () => {
        it('should return session by ID', async () => {
            await SessionModel.create(mockSession);
            const result = await SessionModel.getById(mockSession.sessionId);

            expect(result).not.toBeNull();
            expect(result?.sessionId).toBe(mockSession.sessionId);
        });

        it('should return null for non-existent session', async () => {
            const result = await SessionModel.getById('non-existent-id');
            expect(result).toBeNull();
        });
    });

    describe('update', () => {
        it('should update session data', async () => {
            await SessionModel.create(mockSession);

            const updates = {
                currentPhase: 2,
                conversationHistory: [mockMessage]
            };

            await SessionModel.update(mockSession.sessionId, updates);

            const updatedSession = await SessionModel.getById(mockSession.sessionId);
            expect(updatedSession?.currentPhase).toBe(2);
            expect(updatedSession?.conversationHistory).toHaveLength(1);
            expect(updatedSession?.conversationHistory[0].id).toBe(mockMessage.id);
            expect(updatedSession?.conversationHistory[0].content).toBe(mockMessage.content);
            expect(updatedSession?.conversationHistory[0].role).toBe(mockMessage.role);
        });
    });

    describe('delete', () => {
        it('should delete session', async () => {
            await SessionModel.create(mockSession);

            await SessionModel.delete(mockSession.sessionId);

            const deletedSession = await SessionModel.getById(mockSession.sessionId);
            expect(deletedSession).toBeNull();
        });
    });

    describe('getOldSessions', () => {
        it('should return sessions older than specified days', async () => {
            // Create a session with old date
            const oldSession = {
                ...mockSession,
                sessionId: 'old-session-id',
                currentPhase: 1,
                conversationHistory: []
            };
            await SessionModel.create(oldSession);

            // Manually update the lastAccessed to be old
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 31);
            await SessionModel.update(oldSession.sessionId, {
                lastAccessed: oldDate
            });

            const oldSessions = await SessionModel.getOldSessions(30);
            expect(oldSessions.length).toBeGreaterThan(0);
            expect(oldSessions[0].sessionId).toBe('old-session-id');
        });
    });

    describe('addMessage', () => {
        it('should add message to session', async () => {
            await SessionModel.create(mockSession);

            await SessionModel.addMessage(mockSession.sessionId, mockMessage);

            const updatedSession = await SessionModel.getById(mockSession.sessionId);
            expect(updatedSession?.conversationHistory).toHaveLength(1);
            expect(updatedSession?.conversationHistory[0].id).toBe(mockMessage.id);
            expect(updatedSession?.conversationHistory[0].content).toBe(mockMessage.content);
            expect(updatedSession?.conversationHistory[0].role).toBe(mockMessage.role);
        });

        it('should throw error for non-existent session', async () => {
            await expect(SessionModel.addMessage('non-existent-id', mockMessage))
                .rejects.toThrow('Session not found');
        });
    });
}); 