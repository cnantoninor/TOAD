import request from 'supertest';
import express from 'express';

import sessionRoutes from '../../routes/sessionRoutes';

const app = express();
app.use(express.json());
app.use('/api', sessionRoutes);

describe('Session API Integration Tests', () => {
    describe('POST /api/sessions', () => {
        it('should create a new session', async () => {
            const response = await request(app)
                .post('/api/sessions')
                .send({ customInstructions: 'Test instructions' })
                .expect(201);

            expect(response.body).toHaveProperty('sessionId');
            expect(response.body).toHaveProperty('createdAt');
            expect(response.body).toHaveProperty('lastAccessed');
            expect(response.body.currentPhase).toBe(1);
            expect(response.body.customInstructions).toBe('Test instructions');
            expect(response.body.conversationHistory).toEqual([]);
        });

        it('should create session without custom instructions', async () => {
            const response = await request(app)
                .post('/api/sessions')
                .send({})
                .expect(201);

            expect(response.body.customInstructions).toBeUndefined();
        });

        it('should validate custom instructions length', async () => {
            const longInstructions = 'a'.repeat(2001);
            const response = await request(app)
                .post('/api/sessions')
                .send({ customInstructions: longInstructions })
                .expect(400);

            expect(response.body.error).toBe('Validation failed');
        });
    });

    describe('GET /api/sessions/:sessionId', () => {
        it('should return session by ID', async () => {
            // Create session first
            const createResponse = await request(app)
                .post('/api/sessions')
                .send({ customInstructions: 'Test instructions' });

            const sessionId = createResponse.body.sessionId;

            const response = await request(app)
                .get(`/api/sessions/${sessionId}`)
                .expect(200);

            expect(response.body.sessionId).toBe(sessionId);
            expect(response.body.customInstructions).toBe('Test instructions');
        });

        it('should return 404 for non-existent session', async () => {
            await request(app)
                .get('/api/sessions/non-existent-id')
                .expect(404);
        });

        it('should validate session ID format', async () => {
            await request(app)
                .get('/api/sessions/invalid-uuid')
                .expect(400);
        });
    });

    describe('POST /api/sessions/:sessionId/messages', () => {
        it('should send message and get AI response', async () => {
            // Create session first
            const createResponse = await request(app)
                .post('/api/sessions')
                .send({});

            const sessionId = createResponse.body.sessionId;

            const response = await request(app)
                .post(`/api/sessions/${sessionId}/messages`)
                .send({ content: 'Hello AI' })
                .expect(200);

            expect(response.body).toHaveProperty('sessionId');
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('conversationHistory');
            expect(response.body.message.role).toBe('assistant');
            expect(response.body.conversationHistory).toHaveLength(2); // user + ai messages
        });

        it('should return 404 for non-existent session', async () => {
            await request(app)
                .post('/api/sessions/non-existent-id/messages')
                .send({ content: 'Hello' })
                .expect(404);
        });

        it('should validate message content', async () => {
            const createResponse = await request(app)
                .post('/api/sessions')
                .send({});

            const sessionId = createResponse.body.sessionId;

            // Test empty message
            await request(app)
                .post(`/api/sessions/${sessionId}/messages`)
                .send({ content: '' })
                .expect(400);

            // Test message too long
            const longMessage = 'a'.repeat(5001);
            await request(app)
                .post(`/api/sessions/${sessionId}/messages`)
                .send({ content: longMessage })
                .expect(400);
        });
    });

    describe('GET /api/sessions/:sessionId/export', () => {
        it('should export session as markdown', async () => {
            // Create session and add message first
            const createResponse = await request(app)
                .post('/api/sessions')
                .send({ customInstructions: 'Test instructions' });

            const sessionId = createResponse.body.sessionId;

            await request(app)
                .post(`/api/sessions/${sessionId}/messages`)
                .send({ content: 'Test message' });

            const response = await request(app)
                .get(`/api/sessions/${sessionId}/export`)
                .expect(200);

            expect(response.headers['content-type']).toContain('text/markdown');
            expect(response.headers['content-disposition']).toContain(`session-${sessionId}.md`);
            expect(response.text).toContain('Software Architecture Session');
            expect(response.text).toContain(sessionId);
            expect(response.text).toContain('Test instructions');
            expect(response.text).toContain('Test message');
        });

        it('should return 404 for non-existent session', async () => {
            await request(app)
                .get('/api/sessions/non-existent-id/export')
                .expect(404);
        });
    });

    describe('GET /health', () => {
        it('should return health status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('correlationId');
            expect(response.body).toHaveProperty('services');
        });
    });
}); 