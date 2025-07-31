import { Session, Message } from '../types';
export declare class SessionModel {
    static create(session: Omit<Session, 'createdAt' | 'lastAccessed'>): Promise<Session>;
    static getById(sessionId: string): Promise<Session | null>;
    static update(sessionId: string, updates: Partial<Session>): Promise<void>;
    static delete(sessionId: string): Promise<void>;
    static getOldSessions(daysOld: number): Promise<Session[]>;
    static cleanupOldSessions(daysOld: number): Promise<number>;
    static addMessage(sessionId: string, message: Message): Promise<void>;
    private static generateConversationSummary;
}
//# sourceMappingURL=session.d.ts.map