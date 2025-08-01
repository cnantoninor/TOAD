import { closeDatabase } from '../models/database';
import { SessionModel } from '../models/session';
import { Logger } from '../utils/logger';

async function cleanupOldSessions() {
  const daysOld = parseInt(process.env.SESSION_CLEANUP_DAYS || '30');
  const isTestEnvironment = process.env.NODE_ENV === 'test';

  Logger.info('Starting session cleanup', { daysOld, isTestEnvironment });

  try {
    const deletedCount = await SessionModel.cleanupOldSessions(daysOld);

    Logger.info('Session cleanup completed successfully', {
      deletedCount,
      daysOld,
      message: `Deleted ${deletedCount} sessions older than ${daysOld} days`
    });

    console.log(`✅ Cleanup completed: Deleted ${deletedCount} sessions older than ${daysOld} days`);

    return deletedCount;
  } catch (error) {
    Logger.error('Session cleanup failed', error as Error);
    console.error('❌ Cleanup failed:', error);

    // In test environment, always throw the error instead of exiting
    if (isTestEnvironment) {
      throw error;
    }

    // Only exit if not in test environment
    process.exit(1);
  } finally {
    // Only close database if not in test environment
    if (!isTestEnvironment) {
      await closeDatabase();
    }
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupOldSessions();
}

export { cleanupOldSessions };
