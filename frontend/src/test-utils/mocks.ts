import { Session, Message, SendMessageResponse } from '../types';

export const mockMessage: Message = {
  id: 'test-message-1',
  timestamp: new Date('2024-01-15T10:00:00Z'),
  role: 'user',
  content: 'Hello, I need help with architecture',
};

export const mockAssistantMessage: Message = {
  id: 'test-message-2',
  timestamp: new Date('2024-01-15T10:01:00Z'),
  role: 'assistant',
  content: '# Welcome to TOAD Architect!\n\nI can help you with software architecture design.',
};

export const mockSession: Session = {
  sessionId: 'test-session-123',
  createdAt: new Date('2024-01-15T09:00:00Z'),
  lastAccessed: new Date('2024-01-15T10:00:00Z'),
  currentPhase: 1,
  customInstructions: 'Focus on microservices',
  conversationHistory: [mockMessage, mockAssistantMessage],
};

export const mockEmptySession: Session = {
  sessionId: 'empty-session-456',
  createdAt: new Date('2024-01-15T09:00:00Z'),
  lastAccessed: new Date('2024-01-15T09:00:00Z'),
  currentPhase: 1,
  conversationHistory: [],
};

export const mockSendMessageResponse: SendMessageResponse = {
  sessionId: 'test-session-123',
  message: mockAssistantMessage,
  conversationHistory: [mockMessage, mockAssistantMessage],
};

// Note: Jest-specific mock implementations are defined in individual test files
// This file only contains mock data that can be safely included in production builds