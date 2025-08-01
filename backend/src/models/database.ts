import path from 'path';
import sqlite3 from 'sqlite3';
import { Logger } from '../utils/logger';

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/TOAD.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    Logger.error('Error opening database', err);
    throw err;
  }
  Logger.info('Connected to SQLite database', { dbPath });
});

export const initializeDatabase = (): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    db.serialize(() => {
      // Enable foreign keys
      db.run('PRAGMA foreign_keys = ON');

      // Create sessions table
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
          Logger.error('Error creating sessions table', err);
          reject(err);
        } else {
          Logger.info('Sessions table initialized successfully');
          resolve();
        }
      });
    });
  });
};

export const closeDatabase = (): Promise<void> => {
  return new Promise<void>((resolve) => {
    db.close((err) => {
      if (err) {
        Logger.error('Error closing database', err);
      } else {
        Logger.info('Database connection closed');
      }
      resolve();
    });
  });
}; 