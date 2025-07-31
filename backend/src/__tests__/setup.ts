import { db } from '../models/database';

beforeAll(async () => {
    // Initialize test database
    await new Promise<void>((resolve, reject) => {
        db.serialize(() => {
            db.run(`
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
                } else {
                    resolve();
                }
            });
        });
    });
});

afterEach(async () => {
    // Clean up test data after each test
    await new Promise<void>((resolve, reject) => {
        db.run('DELETE FROM sessions', (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
});

afterAll(async () => {
    // Close database connection
    await new Promise<void>((resolve) => {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err);
            }
            resolve();
        });
    });
}); 