"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionModel = void 0;
const database_1 = require("./database");
const logger_1 = require("../utils/logger");
class SessionModel {
    static async create(session) {
        return new Promise((resolve, reject) => {
            const now = new Date().toISOString();
            const sessionData = {
                ...session,
                createdAt: now,
                lastAccessed: now,
                conversationHistory: JSON.stringify(session.conversationHistory),
                summary: session.summary ? JSON.stringify(session.summary) : null
            };
            database_1.db.run('INSERT INTO sessions (sessionId, createdAt, lastAccessed, currentPhase, customInstructions, conversationHistory, summary) VALUES (?, ?, ?, ?, ?, ?, ?)', [
                sessionData.sessionId,
                sessionData.createdAt,
                sessionData.lastAccessed,
                sessionData.currentPhase,
                sessionData.customInstructions,
                sessionData.conversationHistory,
                sessionData.summary
            ], function (err) {
                if (err) {
                    logger_1.Logger.error('Error creating session', err);
                    reject(err);
                }
                else {
                    logger_1.Logger.info('Session created successfully', { sessionId: sessionData.sessionId });
                    resolve({
                        ...sessionData,
                        createdAt: new Date(sessionData.createdAt),
                        lastAccessed: new Date(sessionData.lastAccessed),
                        conversationHistory: session.conversationHistory,
                        summary: session.summary
                    });
                }
            });
        });
    }
    static async getById(sessionId) {
        return new Promise((resolve, reject) => {
            database_1.db.get('SELECT * FROM sessions WHERE sessionId = ?', [sessionId], (err, row) => {
                if (err) {
                    logger_1.Logger.error('Error getting session', err, { sessionId });
                    reject(err);
                }
                else if (!row) {
                    logger_1.Logger.info('Session not found', { sessionId });
                    resolve(null);
                }
                else {
                    try {
                        const session = {
                            sessionId: row.sessionId,
                            createdAt: new Date(row.createdAt),
                            lastAccessed: new Date(row.lastAccessed),
                            currentPhase: row.currentPhase,
                            customInstructions: row.customInstructions,
                            conversationHistory: JSON.parse(row.conversationHistory || '[]'),
                            summary: row.summary ? JSON.parse(row.summary) : undefined
                        };
                        resolve(session);
                    }
                    catch (parseError) {
                        logger_1.Logger.error('Error parsing session data', parseError, { sessionId });
                        reject(parseError);
                    }
                }
            });
        });
    }
    static async update(sessionId, updates) {
        return new Promise((resolve, reject) => {
            const now = new Date().toISOString();
            const conversationHistory = updates.conversationHistory ? JSON.stringify(updates.conversationHistory) : undefined;
            const summary = updates.summary ? JSON.stringify(updates.summary) : undefined;
            const updateFields = [];
            const updateValues = [];
            if (updates.currentPhase !== undefined) {
                updateFields.push('currentPhase = ?');
                updateValues.push(updates.currentPhase);
            }
            if (updates.customInstructions !== undefined) {
                updateFields.push('customInstructions = ?');
                updateValues.push(updates.customInstructions);
            }
            if (conversationHistory !== undefined) {
                updateFields.push('conversationHistory = ?');
                updateValues.push(conversationHistory);
            }
            if (summary !== undefined) {
                updateFields.push('summary = ?');
                updateValues.push(summary);
            }
            updateFields.push('lastAccessed = ?');
            updateValues.push(now);
            updateValues.push(sessionId);
            const query = `UPDATE sessions SET ${updateFields.join(', ')} WHERE sessionId = ?`;
            database_1.db.run(query, updateValues, function (err) {
                if (err) {
                    logger_1.Logger.error('Error updating session', err, { sessionId });
                    reject(err);
                }
                else {
                    logger_1.Logger.info('Session updated successfully', { sessionId, changes: this.changes });
                    resolve();
                }
            });
        });
    }
    static async delete(sessionId) {
        return new Promise((resolve, reject) => {
            database_1.db.run('DELETE FROM sessions WHERE sessionId = ?', [sessionId], function (err) {
                if (err) {
                    logger_1.Logger.error('Error deleting session', err, { sessionId });
                    reject(err);
                }
                else {
                    logger_1.Logger.info('Session deleted successfully', { sessionId, changes: this.changes });
                    resolve();
                }
            });
        });
    }
    static async getOldSessions(daysOld) {
        return new Promise((resolve, reject) => {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            const cutoffISO = cutoffDate.toISOString();
            database_1.db.all('SELECT * FROM sessions WHERE lastAccessed < ?', [cutoffISO], (err, rows) => {
                if (err) {
                    logger_1.Logger.error('Error getting old sessions', err);
                    reject(err);
                }
                else {
                    try {
                        const sessions = rows.map(row => ({
                            sessionId: row.sessionId,
                            createdAt: new Date(row.createdAt),
                            lastAccessed: new Date(row.lastAccessed),
                            currentPhase: row.currentPhase,
                            customInstructions: row.customInstructions,
                            conversationHistory: JSON.parse(row.conversationHistory || '[]'),
                            summary: row.summary ? JSON.parse(row.summary) : undefined
                        }));
                        resolve(sessions);
                    }
                    catch (parseError) {
                        logger_1.Logger.error('Error parsing old sessions data', parseError);
                        reject(parseError);
                    }
                }
            });
        });
    }
    static async cleanupOldSessions(daysOld) {
        const oldSessions = await this.getOldSessions(daysOld);
        let deletedCount = 0;
        for (const session of oldSessions) {
            try {
                await this.delete(session.sessionId);
                deletedCount++;
            }
            catch (error) {
                logger_1.Logger.error('Error deleting old session', error, { sessionId: session.sessionId });
            }
        }
        logger_1.Logger.info('Session cleanup completed', { deletedCount, daysOld });
        return deletedCount;
    }
    static async addMessage(sessionId, message) {
        const session = await this.getById(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        const updatedHistory = [...session.conversationHistory, message];
        // Check if conversation is getting long and needs summarization
        if (updatedHistory.length > 20) {
            const summary = await this.generateConversationSummary(updatedHistory);
            await this.update(sessionId, {
                conversationHistory: updatedHistory,
                summary
            });
        }
        else {
            await this.update(sessionId, {
                conversationHistory: updatedHistory
            });
        }
    }
    static async generateConversationSummary(history) {
        // Simple summarization logic - in a real implementation, this would use AI
        const userMessages = history.filter(msg => msg.role === 'user');
        const assistantMessages = history.filter(msg => msg.role === 'assistant');
        const keyPoints = userMessages.slice(-5).map(msg => msg.content.substring(0, 100) + '...');
        // Determine current phase based on conversation content
        let currentPhase = 1;
        const lastMessages = history.slice(-3);
        const content = lastMessages.map(msg => msg.content).join(' ').toLowerCase();
        if (content.includes('architectural option') || content.includes('cost estimate')) {
            currentPhase = 2;
        }
        else if (content.includes('trade-off') || content.includes('scoring')) {
            currentPhase = 3;
        }
        else if (content.includes('milestone') || content.includes('planning')) {
            currentPhase = 5;
        }
        return {
            keyPoints,
            currentPhase,
            nextSteps: ['Continue architectural discussion'],
            lastUpdated: new Date()
        };
    }
}
exports.SessionModel = SessionModel;
//# sourceMappingURL=session.js.map