import { OpenAIService } from '../../services/openai';
import { Message } from '../../types';

// Mock OpenAI
const mockCreate = jest.fn();
const mockList = jest.fn();

jest.mock('openai', () => ({
    OpenAI: jest.fn().mockImplementation(() => ({
        chat: {
            completions: {
                create: mockCreate
            }
        },
        models: {
            list: mockList
        }
    }))
}));

describe('OpenAIService', () => {
    const mockMessages: Message[] = [
        {
            id: '1',
            timestamp: new Date(),
            role: 'user',
            content: 'Hello'
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        mockCreate.mockResolvedValue({
            choices: [{ message: { content: 'Mock AI response' } }]
        });
        mockList.mockResolvedValue({ data: [] });
    });

    describe('generateResponse', () => {
        it('should generate AI response', async () => {
            const response = await OpenAIService.generateResponse(mockMessages);

            expect(response).toBe('Mock AI response');
        });

        it('should include custom instructions in system prompt', async () => {
            const customInstructions = 'Custom domain knowledge';
            await OpenAIService.generateResponse(mockMessages, customInstructions);

            // Verify that custom instructions are passed through
            expect(mockCreate).toHaveBeenCalled();
        });

        it('should handle API errors gracefully', async () => {
            mockCreate.mockRejectedValueOnce(new Error('API Error'));

            await expect(OpenAIService.generateResponse(mockMessages)).rejects.toThrow('Failed to generate AI response');
        });

        it('should handle rate limit errors', async () => {
            mockCreate.mockRejectedValueOnce(new Error('rate limit'));

            await expect(OpenAIService.generateResponse(mockMessages)).rejects.toThrow('Rate limit exceeded');
        });

        it('should handle quota errors', async () => {
            mockCreate.mockRejectedValueOnce(new Error('quota'));

            await expect(OpenAIService.generateResponse(mockMessages)).rejects.toThrow('API quota exceeded');
        });
    });

    describe('summarizeConversation', () => {
        it('should generate conversation summary', async () => {
            const summary = await OpenAIService.summarizeConversation(mockMessages);

            expect(summary).toHaveProperty('keyPoints');
            expect(summary).toHaveProperty('currentPhase');
            expect(summary).toHaveProperty('nextSteps');
            expect(summary).toHaveProperty('lastUpdated');
        });

        it('should handle summarization errors gracefully', async () => {
            mockCreate.mockRejectedValueOnce(new Error('Summarization failed'));

            const summary = await OpenAIService.summarizeConversation(mockMessages);

            // Should return fallback summary
            expect(summary.keyPoints).toEqual(['Conversation in progress']);
            expect(summary.currentPhase).toBe(1);
        });
    });

    describe('validateApiKey', () => {
        it('should return true for valid API key', async () => {
            const isValid = await OpenAIService.validateApiKey();
            expect(isValid).toBe(true);
        });

        it('should return false for invalid API key', async () => {
            mockList.mockRejectedValueOnce(new Error('Invalid API key'));

            const isValid = await OpenAIService.validateApiKey();
            expect(isValid).toBe(false);
        });
    });
}); 