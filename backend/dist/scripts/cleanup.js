"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupOldSessions = cleanupOldSessions;
const session_1 = require("../models/session");
const logger_1 = require("../utils/logger");
const database_1 = require("../models/database");
async function cleanupOldSessions() {
    const daysOld = parseInt(process.env.SESSION_CLEANUP_DAYS || '30');
    logger_1.Logger.info('Starting session cleanup', { daysOld });
    try {
        const deletedCount = await session_1.SessionModel.cleanupOldSessions(daysOld);
        logger_1.Logger.info('Session cleanup completed successfully', {
            deletedCount,
            daysOld,
            message: `Deleted ${deletedCount} sessions older than ${daysOld} days`
        });
        console.log(`✅ Cleanup completed: Deleted ${deletedCount} sessions older than ${daysOld} days`);
    }
    catch (error) {
        logger_1.Logger.error('Session cleanup failed', error);
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
    }
    finally {
        await (0, database_1.closeDatabase)();
    }
}
// Run cleanup if this script is executed directly
if (require.main === module) {
    cleanupOldSessions();
}
//# sourceMappingURL=cleanup.js.map