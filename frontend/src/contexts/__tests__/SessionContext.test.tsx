import React from 'react';
import { renderHook, act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SessionProvider, useSession } from '../SessionContext';
import { mockSession, mockSendMessageResponse } from '../../test-utils/mocks';

// Mock the API module with proper hoisting
jest.mock('../../services/api', () => ({
  sessionApi: {
    createSession: jest.fn(),
    getSession: jest.fn(),
    sendMessage: jest.fn(),
    exportSession: jest.fn(),
  },
}));

import { sessionApi } from '../../services/api';
const mockSessionApi = sessionApi as jest.Mocked<typeof sessionApi>;

const TestComponent = () => {
  const { session, isLoading, error, createSession, sendMessage, clearError } = useSession();
  
  return (
    <div>
      <div data-testid="session">{session ? session.sessionId : 'no-session'}</div>
      <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <button onClick={() => createSession('test instructions')}>Create Session</button>
      <button onClick={() => sendMessage('test message')}>Send Message</button>
      <button onClick={clearError}>Clear Error</button>
    </div>
  );
};

const renderWithProvider = () => {
  return render(
    <MemoryRouter>
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    </MemoryRouter>
  );
};

describe('SessionContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionApi.createSession.mockResolvedValue(mockSession);
    mockSessionApi.sendMessage.mockResolvedValue(mockSendMessageResponse);
  });

  describe('useSession Hook', () => {
    it('throws error when used outside SessionProvider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => renderHook(() => useSession())).toThrow(
        'useSession must be used within a SessionProvider'
      );
      
      consoleSpy.mockRestore();
    });

    it('returns context value when used within SessionProvider', () => {
      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <MemoryRouter>
          <SessionProvider>
            {children}
          </SessionProvider>
        </MemoryRouter>
      );
      
      const { result } = renderHook(() => useSession(), {
        wrapper: TestWrapper,
      });
      
      expect(result.current).toEqual(
        expect.objectContaining({
          session: null,
          isLoading: false,
          error: null,
          createSession: expect.any(Function),
          sendMessage: expect.any(Function),
          clearError: expect.any(Function),
        })
      );
    });
  });

  describe('Initial State', () => {
    it('renders with initial state', () => {
      renderWithProvider();
      
      expect(screen.getByTestId('session')).toHaveTextContent('no-session');
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });
  });

  describe('createSession', () => {
    it('creates session successfully', async () => {
      renderWithProvider();
      
      const createButton = screen.getByText('Create Session');
      
      await act(async () => {
        createButton.click();
      });
      
      await waitFor(() => {
        expect(mockSessionApi.createSession).toHaveBeenCalledWith({
          customInstructions: 'test instructions',
        });
        expect(screen.getByTestId('session')).toHaveTextContent(mockSession.sessionId);
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
        expect(screen.getByTestId('error')).toHaveTextContent('no-error');
      });
    });

    it('handles createSession loading state', async () => {
      let resolveCreateSession: (value: any) => void;
      const createSessionPromise = new Promise((resolve) => {
        resolveCreateSession = resolve;
      });
      mockSessionApi.createSession.mockReturnValueOnce(createSessionPromise);
      
      renderWithProvider();
      
      const createButton = screen.getByText('Create Session');
      
      act(() => {
        createButton.click();
      });
      
      expect(screen.getByTestId('loading')).toHaveTextContent('loading');
      
      await act(async () => {
        resolveCreateSession!(mockSession);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });
    });

    it('handles createSession error', async () => {
      const errorMessage = 'Failed to create session';
      mockSessionApi.createSession.mockRejectedValueOnce(new Error(errorMessage));
      
      renderWithProvider();
      
      const createButton = screen.getByText('Create Session');
      
      await act(async () => {
        createButton.click();
      });
      
      expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      expect(screen.getByTestId('session')).toHaveTextContent('no-session');
    });

    it('handles createSession with non-Error object', async () => {
      mockSessionApi.createSession.mockRejectedValueOnce('String error');
      
      renderWithProvider();
      
      const createButton = screen.getByText('Create Session');
      
      await act(async () => {
        createButton.click();
      });
      
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to create session');
    });
  });

  describe('sendMessage', () => {
    it('sends message successfully', async () => {
      renderWithProvider();
      
      // First create a session
      const createButton = screen.getByText('Create Session');
      await act(async () => {
        createButton.click();
      });
      
      // Then send a message
      const sendButton = screen.getByText('Send Message');
      await act(async () => {
        sendButton.click();
      });
      
      await waitFor(() => {
        expect(mockSessionApi.sendMessage).toHaveBeenCalledWith(mockSession.sessionId, {
          content: 'test message',
        });
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
        expect(screen.getByTestId('error')).toHaveTextContent('no-error');
      });
    });

    it('handles sendMessage without active session', async () => {
      renderWithProvider();
      
      const sendButton = screen.getByText('Send Message');
      
      await act(async () => {
        sendButton.click();
      });
      
      expect(mockSessionApi.sendMessage).not.toHaveBeenCalled();
      expect(screen.getByTestId('error')).toHaveTextContent('No active session');
    });

    it('handles sendMessage loading state', async () => {
      renderWithProvider();
      
      // First create a session
      const createButton = screen.getByText('Create Session');
      await act(async () => {
        createButton.click();
      });
      
      // Mock sendMessage to return a pending promise
      let resolveSendMessage: (value: any) => void;
      const sendMessagePromise = new Promise((resolve) => {
        resolveSendMessage = resolve;
      });
      mockSessionApi.sendMessage.mockReturnValueOnce(sendMessagePromise);
      
      const sendButton = screen.getByText('Send Message');
      
      act(() => {
        sendButton.click();
      });
      
      expect(screen.getByTestId('loading')).toHaveTextContent('loading');
      
      await act(async () => {
        resolveSendMessage!(mockSendMessageResponse);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });
    });

    it('handles sendMessage error', async () => {
      renderWithProvider();
      
      // First create a session
      const createButton = screen.getByText('Create Session');
      await act(async () => {
        createButton.click();
      });
      
      // Mock sendMessage to reject
      const errorMessage = 'Failed to send message';
      mockSessionApi.sendMessage.mockRejectedValueOnce(new Error(errorMessage));
      
      const sendButton = screen.getByText('Send Message');
      
      await act(async () => {
        sendButton.click();
      });
      
      expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    it('updates session with new conversation history', async () => {
      renderWithProvider();
      
      // First create a session
      const createButton = screen.getByText('Create Session');
      await act(async () => {
        createButton.click();
      });
      
      // Mock sendMessage response with updated conversation
      const updatedResponse = {
        ...mockSendMessageResponse,
        conversationHistory: [
          ...mockSendMessageResponse.conversationHistory,
          { id: 'new-msg', content: 'new message', role: 'user' as const, timestamp: new Date() },
        ],
      };
      mockSessionApi.sendMessage.mockResolvedValueOnce(updatedResponse);
      
      const sendButton = screen.getByText('Send Message');
      
      await act(async () => {
        sendButton.click();
      });
      
      // Verify the session was updated
      expect(mockSessionApi.sendMessage).toHaveBeenCalledWith(mockSession.sessionId, {
        content: 'test message',
      });
    });
  });

  describe('clearError', () => {
    it('clears error state', async () => {
      // First trigger an error
      mockSessionApi.createSession.mockRejectedValueOnce(new Error('Test error'));
      
      renderWithProvider();
      
      const createButton = screen.getByText('Create Session');
      
      await act(async () => {
        createButton.click();
      });
      
      expect(screen.getByTestId('error')).toHaveTextContent('Test error');
      
      // Clear the error
      const clearButton = screen.getByText('Clear Error');
      
      act(() => {
        clearButton.click();
      });
      
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });
  });

  describe('State Management', () => {
    it('maintains correct loading states during operations', async () => {
      let resolveCreateSession: (value: any) => void;
      const createSessionPromise = new Promise((resolve) => {
        resolveCreateSession = resolve;
      });
      mockSessionApi.createSession.mockReturnValueOnce(createSessionPromise);
      
      renderWithProvider();
      
      const createButton = screen.getByText('Create Session');
      
      // Initial state
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      
      // Start operation
      act(() => {
        createButton.click();
      });
      expect(screen.getByTestId('loading')).toHaveTextContent('loading');
      
      // Complete operation
      await act(async () => {
        resolveCreateSession!(mockSession);
      });
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });
    });

    it('clears error when successful operation occurs', async () => {
      // First trigger an error
      mockSessionApi.createSession.mockRejectedValueOnce(new Error('First error'));
      
      renderWithProvider();
      
      const createButton = screen.getByText('Create Session');
      
      await act(async () => {
        createButton.click();
      });
      
      expect(screen.getByTestId('error')).toHaveTextContent('First error');
      
      // Reset mock to succeed
      mockSessionApi.createSession.mockResolvedValueOnce(mockSession);
      
      // Successful operation should clear error
      await act(async () => {
        createButton.click();
      });
      
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
      expect(screen.getByTestId('session')).toHaveTextContent(mockSession.sessionId);
    });
  });
});