"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDatabase = exports.initializeDatabase = exports.db = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
const dbPath = process.env.DB_PATH || path_1.default.join(__dirname, '../../data/sessions.db');
// Ensure data directory exists
const fs_1 = __importDefault(require("fs"));
const dataDir = path_1.default.dirname(dbPath);
if (!fs_1.default.existsSync(dataDir)) {
    fs_1.default.mkdirSync(dataDir, { recursive: true });
}
exports.db = new sqlite3_1.default.Database(dbPath, (err) => {
    if (err) {
        logger_1.Logger.error('Error opening database', err);
        throw err;
    }
    logger_1.Logger.info('Connected to SQLite database', { dbPath });
});
const initializeDatabase = () => {
    return new Promise((resolve, reject) => {
        exports.db.serialize(() => {
            // Enable foreign keys
            exports.db.run('PRAGMA foreign_keys = ON');
            // Create sessions table
            exports.db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
          sessionId TEXT PRIMARY KEY,
          createdAt TEXT NOT NULL,
          lastAccessed TEXT NOT NULL,
          currentPhase INTEGER DEFAULT 1,
          customInstructions TEXT,
          conversationHistory TEXT,
          summary TEXT
        )
      `, (err) => {
                if (err) {
                    logger_1.Logger.error('Error creating sessions table', err);
                    reject(err);
                }
                else {
                    logger_1.Logger.info('Sessions table initialized successfully');
                    resolve();
                }
            });
        });
    });
};
exports.initializeDatabase = initializeDatabase;
const closeDatabase = () => {
    return new Promise((resolve) => {
        exports.db.close((err) => {
            if (err) {
                logger_1.Logger.error('Error closing database', err);
            }
            else {
                logger_1.Logger.info('Database connection closed');
            }
            resolve();
        });
    });
};
exports.closeDatabase = closeDatabase;
//# sourceMappingURL=database.js.map