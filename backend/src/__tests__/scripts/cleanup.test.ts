import { cleanupOldSessions } from '../../scripts/cleanup';
import { SessionModel } from '../../models/session';

// Mock SessionModel
jest.mock('../../models/session', () => ({
    SessionModel: {
        cleanupOldSessions: jest.fn()
    }
}));

describe('Cleanup Script', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call cleanup with correct parameters', async () => {
        const mockCleanup = SessionModel.cleanupOldSessions as jest.MockedFunction<typeof SessionModel.cleanupOldSessions>;
        mockCleanup.mockResolvedValue(5);

        await cleanupOldSessions();

        expect(mockCleanup).toHaveBeenCalledWith(30); // Default 30 days
    });

    it('should handle cleanup errors gracefully', async () => {
        const mockCleanup = SessionModel.cleanupOldSessions as jest.MockedFunction<typeof SessionModel.cleanupOldSessions>;
        mockCleanup.mockRejectedValue(new Error('Cleanup failed'));

        // Should not throw
        await expect(cleanupOldSessions()).resolves.not.toThrow();
    });
}); 