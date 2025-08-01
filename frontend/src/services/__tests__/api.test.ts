import { sessionApi, healthApi } from '../api';
import { mockSession, mockSendMessageResponse } from '../../test-utils/mocks';

// Mock crypto.randomUUID
const mockUUID = 'test-correlation-id';
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn().mockReturnValue(mockUUID),
  },
});

// Mock axios with proper hoisting
jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  
  return {
    __esModule: true,
    default: {
      create: jest.fn(() => mockAxiosInstance),
      get: jest.fn(),
      post: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    },
  };
});

import axios from 'axios';
const mockAxios = axios as jest.Mocked<typeof axios>;
const mockAxiosInstance = mockAxios.create() as jest.Mocked<ReturnType<typeof mockAxios.create>>;

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sessionApi', () => {
    describe('createSession', () => {
      it('creates session successfully', async () => {
        const mockResponse = {
          data: {
            ...mockSession,
            createdAt: mockSession.createdAt.toISOString(),
            lastAccessed: mockSession.lastAccessed.toISOString(),
            conversationHistory: mockSession.conversationHistory.map(msg => ({
              ...msg,
              timestamp: msg.timestamp.toISOString(),
            })),
          },
        };
        
        mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);
        
        const result = await sessionApi.createSession({ customInstructions: 'test' });
        
        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/sessions', {
          customInstructions: 'test',
        });
        expect(result.sessionId).toBe(mockSession.sessionId);
        expect(result.createdAt).toBeInstanceOf(Date);
      });

      it('handles API errors', async () => {
        const error = new Error('Network error');
        mockAxiosInstance.post.mockRejectedValueOnce(error);
        
        await expect(sessionApi.createSession({})).rejects.toThrow('Network error');
      });
    });

    describe('getSession', () => {
      it('retrieves session successfully', async () => {
        const mockResponse = {
          data: {
            ...mockSession,
            createdAt: mockSession.createdAt.toISOString(),
            lastAccessed: mockSession.lastAccessed.toISOString(),
            conversationHistory: mockSession.conversationHistory.map(msg => ({
              ...msg,
              timestamp: msg.timestamp.toISOString(),
            })),
          },
        };
        
        mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);
        
        const result = await sessionApi.getSession('test-session-id');
        
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/sessions/test-session-id');
        expect(result.sessionId).toBe(mockSession.sessionId);
      });
    });

    describe('sendMessage', () => {
      it('sends message successfully', async () => {
        const mockResponse = {
          data: {
            ...mockSendMessageResponse,
            message: {
              ...mockSendMessageResponse.message,
              timestamp: mockSendMessageResponse.message.timestamp.toISOString(),
            },
            conversationHistory: mockSendMessageResponse.conversationHistory.map(msg => ({
              ...msg,
              timestamp: msg.timestamp.toISOString(),
            })),
          },
        };
        
        mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);
        
        const result = await sessionApi.sendMessage('test-session-id', {
          content: 'test message',
        });
        
        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/sessions/test-session-id/messages', {
          content: 'test message',
        });
        expect(result.sessionId).toBe(mockSendMessageResponse.sessionId);
      });
    });

    describe('exportSession', () => {
      it('exports session successfully', async () => {
        const mockBlob = new Blob(['# Session Export'], { type: 'text/markdown' });
        const mockResponse = { data: mockBlob };
        
        mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);
        
        const result = await sessionApi.exportSession('test-session-id');
        
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/sessions/test-session-id/export', {
          responseType: 'blob',
        });
        expect(result).toBe(mockBlob);
      });
    });
  });

  describe('healthApi', () => {
    it('checks health successfully', async () => {
      const mockHealthResponse = { status: 'OK' };
      const mockResponse = { data: mockHealthResponse };
      
      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);
      
      const result = await healthApi.checkHealth();
      
      expect(result).toEqual(mockHealthResponse);
    });
  });
});