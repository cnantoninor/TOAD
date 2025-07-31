import { db } from './database';
import { Session, Message, ConversationSummary } from '../types';
import { Logger } from '../utils/logger';

interface DatabaseRow {
    sessionId: string;
    createdAt: string;
    lastAccessed: string;
    currentPhase: number;
    customInstructions?: string;
    conversationHistory: string;
    summary?: string;
}

export class SessionModel {
    static async create(session: Omit<Session, 'createdAt' | 'lastAccessed'>): Promise<Session> {
        return new Promise((resolve, reject) => {
            const now = new Date().toISOString();
            const sessionData = {
                ...session,
                createdAt: now,
                lastAccessed: now,
                conversationHistory: JSON.stringify(session.conversationHistory),
                summary: session.summary ? JSON.stringify(session.summary) : null
            };

            db.run(
                'INSERT INTO sessions (sessionId, createdAt, lastAccessed, currentPhase, customInstructions, conversationHistory, summary) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    sessionData.sessionId,
                    sessionData.createdAt,
                    sessionData.lastAccessed,
                    sessionData.currentPhase,
                    sessionData.customInstructions,
                    sessionData.conversationHistory,
                    sessionData.summary
                ],
                function (err) {
                    if (err) {
                        Logger.error('Error creating session', err);
                        reject(err);
                    } else {
                        Logger.info('Session created successfully', { sessionId: sessionData.sessionId });
                        resolve({
                            ...sessionData,
                            createdAt: new Date(sessionData.createdAt),
                            lastAccessed: new Date(sessionData.lastAccessed),
                            conversationHistory: session.conversationHistory,
                            summary: session.summary
                        });
                    }
                }
            );
        });
    }

    static async getById(sessionId: string): Promise<Session | null> {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM sessions WHERE sessionId = ?',
                [sessionId],
                (err, row: DatabaseRow | undefined) => {
                    if (err) {
                        Logger.error('Error getting session', err, { sessionId });
                        reject(err);
                    } else if (!row) {
                        Logger.info('Session not found', { sessionId });
                        resolve(null);
                    } else {
                        try {
                            const session: Session = {
                                sessionId: row.sessionId,
                                createdAt: new Date(row.createdAt),
                                lastAccessed: new Date(row.lastAccessed),
                                currentPhase: row.currentPhase,
                                customInstructions: row.customInstructions,
                                conversationHistory: JSON.parse(row.conversationHistory || '[]'),
                                summary: row.summary ? JSON.parse(row.summary) : undefined
                            };
                            resolve(session);
                        } catch (parseError) {
                            Logger.error('Error parsing session data', parseError as Error, { sessionId });
                            reject(parseError);
                        }
                    }
                }
            );
        });
    }

    static async update(sessionId: string, updates: Partial<Session>): Promise<void> {
        return new Promise((resolve, reject) => {
            const now = new Date().toISOString();
            const conversationHistory = updates.conversationHistory ? JSON.stringify(updates.conversationHistory) : undefined;
            const summary = updates.summary ? JSON.stringify(updates.summary) : undefined;

            const updateFields: string[] = [];
            const updateValues: any[] = [];

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

            db.run(query, updateValues, function (err) {
                if (err) {
                    Logger.error('Error updating session', err, { sessionId });
                    reject(err);
                } else {
                    Logger.info('Session updated successfully', { sessionId, changes: this.changes });
                    resolve();
                }
            });
        });
    }

    static async delete(sessionId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM sessions WHERE sessionId = ?', [sessionId], function (err) {
                if (err) {
                    Logger.error('Error deleting session', err, { sessionId });
                    reject(err);
                } else {
                    Logger.info('Session deleted successfully', { sessionId, changes: this.changes });
                    resolve();
                }
            });
        });
    }

    static async getOldSessions(daysOld: number): Promise<Session[]> {
        return new Promise((resolve, reject) => {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            const cutoffISO = cutoffDate.toISOString();

            db.all(
                'SELECT * FROM sessions WHERE lastAccessed < ?',
                [cutoffISO],
                (err, rows: DatabaseRow[]) => {
                    if (err) {
                        Logger.error('Error getting old sessions', err);
                        reject(err);
                    } else {
                        try {
                            const sessions: Session[] = rows.map(row => ({
                                sessionId: row.sessionId,
                                createdAt: new Date(row.createdAt),
                                lastAccessed: new Date(row.lastAccessed),
                                currentPhase: row.currentPhase,
                                customInstructions: row.customInstructions,
                                conversationHistory: JSON.parse(row.conversationHistory || '[]'),
                                summary: row.summary ? JSON.parse(row.summary) : undefined
                            }));
                            resolve(sessions);
                        } catch (parseError) {
                            Logger.error('Error parsing old sessions data', parseError as Error);
                            reject(parseError);
                        }
                    }
                }
            );
        });
    }

    static async cleanupOldSessions(daysOld: number): Promise<number> {
        const oldSessions = await this.getOldSessions(daysOld);
        let deletedCount = 0;

        for (const session of oldSessions) {
            try {
                await this.delete(session.sessionId);
                deletedCount++;
            } catch (error) {
                Logger.error('Error deleting old session', error as Error, { sessionId: session.sessionId });
            }
        }

        Logger.info('Session cleanup completed', { deletedCount, daysOld });
        return deletedCount;
    }

    static async addMessage(sessionId: string, message: Message): Promise<void> {
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
        } else {
            await this.update(sessionId, {
                conversationHistory: updatedHistory
            });
        }
    }

    private static async generateConversationSummary(history: Message[]): Promise<ConversationSummary> {
        // Simple summarization logic - in a real implementation, this would use AI
        const userMessages = history.filter(msg => msg.role === 'user');

        const keyPoints = userMessages.slice(-5).map(msg => msg.content.substring(0, 100) + '...');

        // Determine current phase based on conversation content
        let currentPhase = 1;
        const lastMessages = history.slice(-3);
        const content = lastMessages.map(msg => msg.content).join(' ').toLowerCase();

        if (content.includes('architectural option') || content.includes('cost estimate')) {
            currentPhase = 2;
        } else if (content.includes('trade-off') || content.includes('scoring')) {
            currentPhase = 3;
        } else if (content.includes('milestone') || content.includes('planning')) {
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