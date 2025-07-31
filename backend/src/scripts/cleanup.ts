import { SessionModel } from '../models/session';
import { Logger } from '../utils/logger';
import { closeDatabase } from '../models/database';

async function cleanupOldSessions() {
    const daysOld = parseInt(process.env.SESSION_CLEANUP_DAYS || '30');

    Logger.info('Starting session cleanup', { daysOld });

    try {
        const deletedCount = await SessionModel.cleanupOldSessions(daysOld);

        Logger.info('Session cleanup completed successfully', {
            deletedCount,
            daysOld,
            message: `Deleted ${deletedCount} sessions older than ${daysOld} days`
        });

        console.log(`✅ Cleanup completed: Deleted ${deletedCount} sessions older than ${daysOld} days`);
    } catch (error) {
        Logger.error('Session cleanup failed', error as Error);
        console.error('❌ Cleanup failed:', error);

        // Only exit if not in test environment
        if (process.env.NODE_ENV !== 'test') {
            process.exit(1);
        }
    } finally {
        await closeDatabase();
    }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
    cleanupOldSessions();
}

export { cleanupOldSessions }; 