export interface Message {
    id: string;
    timestamp: Date;
    role: 'user' | 'assistant';
    content: string;
}

export interface ConversationSummary {
    keyPoints: string[];
    currentPhase: number;
    nextSteps: string[];
    lastUpdated: Date;
}

export interface Session {
    sessionId: string;
    createdAt: Date;
    lastAccessed: Date;
    currentPhase: number;
    customInstructions?: string;
    conversationHistory: Message[];
    summary?: ConversationSummary;
}

export interface CreateSessionRequest {
    customInstructions?: string;
}

export interface SendMessageRequest {
    content: string;
}

export interface SendMessageResponse {
    sessionId: string;
    message: Message;
    conversationHistory: Message[];
}

export interface ApiError {
    error: string;
    message: string;
    statusCode: number;
    correlationId?: string;
}

export interface SessionContextType {
    session: Session | null;
    isLoading: boolean;
    error: string | null;
    createSession: (customInstructions?: string) => Promise<void>;
    sendMessage: (content: string) => Promise<void>;
    clearError: () => void;
} 