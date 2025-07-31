import { Message, ConversationSummary } from '../types';
export declare class OpenAIService {
    static generateResponse(messages: Message[], customInstructions?: string, correlationId?: string): Promise<string>;
    static summarizeConversation(messages: Message[], correlationId?: string): Promise<ConversationSummary>;
    static validateApiKey(): Promise<boolean>;
}
//# sourceMappingURL=openai.d.ts.map