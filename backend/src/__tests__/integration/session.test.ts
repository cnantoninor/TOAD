import request from 'supertest';
import express from 'express';
import sessionRoutes from '../../routes/sessionRoutes';

// Mock OpenAIService
jest.mock('../../services/openai', () => ({
    OpenAIService: {
        generateResponse: jest.fn().mockResolvedValue('Mock AI response'),
        validateApiKey: jest.fn().mockResolvedValue(true)
    }
}));

// Set up environment variables for testing
process.env.OPENAI_API_KEY = 'test-api-key';
process.env.NODE_ENV = 'test';

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
                .get('/api/sessions/123e4567-e89b-42d3-a456-426614174000')
                .expect(404);
        });
    });

    describe('GET /health', () => {
        it('should return health status', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('correlationId');
            expect(response.body).toHaveProperty('services');
        });
    });
}); 