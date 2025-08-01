import { SessionModel } from '../../models/session';
import { cleanupOldSessions } from '../../scripts/cleanup';

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

    const result = await cleanupOldSessions();

    expect(mockCleanup).toHaveBeenCalledWith(30); // Default 30 days
    expect(result).toBe(5);
  });

  it('should handle cleanup errors gracefully', async () => {
    const mockCleanup = SessionModel.cleanupOldSessions as jest.MockedFunction<typeof SessionModel.cleanupOldSessions>;
    const testError = new Error('Cleanup failed');
    mockCleanup.mockRejectedValue(testError);

    // Should throw the error in test environment
    await expect(cleanupOldSessions()).rejects.toThrow('Cleanup failed');
  });
}); 