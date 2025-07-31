"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../models/database");
beforeAll(async () => {
    // Initialize test database
    await new Promise((resolve, reject) => {
        database_1.db.serialize(() => {
            database_1.db.run(`
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
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    });
});
afterEach(async () => {
    // Clean up test data after each test
    await new Promise((resolve, reject) => {
        database_1.db.run('DELETE FROM sessions', (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
});
afterAll(async () => {
    // Close database connection
    await new Promise((resolve) => {
        database_1.db.close((err) => {
            if (err) {
                console.error('Error closing database:', err);
            }
            resolve();
        });
    });
});
//# sourceMappingURL=setup.js.map