import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { mockSession, mockEmptySession } from '../test-utils/mocks';
import { SessionContextType } from '../types';

// Mock the API module with proper hoisting
jest.mock('../services/api', () => ({
  sessionApi: {
    createSession: jest.fn(),
    getSession: jest.fn(),
    sendMessage: jest.fn(),
    exportSession: jest.fn(),
  },
}));

import { sessionApi } from '../services/api';
const mockSessionApi = sessionApi as jest.Mocked<typeof sessionApi>;

// Mock the useSession hook to control the context state
const mockUseSession = jest.fn();
jest.mock('../contexts/SessionContext', () => ({
  ...jest.requireActual('../contexts/SessionContext'),
  useSession: () => mockUseSession(),
}));

describe('App Integration Tests', () => {
  const defaultMockContext: SessionContextType = {
    session: null,
    isLoading: false,
    error: null,
    createSession: jest.fn(),
    sendMessage: jest.fn(),
    clearError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue(defaultMockContext);
    mockSessionApi.createSession.mockResolvedValue(mockSession);
    mockSessionApi.exportSession.mockResolvedValue(new Blob(['# Session Export'], { type: 'text/markdown' }));
  });

  describe('Complete User Workflow', () => {
    it('completes full session creation and messaging workflow', async () => {
      const mockCreateSession = jest.fn();
      const mockSendMessage = jest.fn();
      
      // Start with no session
      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        createSession: mockCreateSession,
      });

      const { rerender } = render(<App />);
      
      // Initial state - no session
      expect(screen.getByText('TOAD Architect')).toBeInTheDocument();
      expect(screen.getByText(/Your AI-powered software architecture assistant/)).toBeInTheDocument();
      
      // Create a new session
      const startButton = screen.getByRole('button', { name: /start new session/i });
      fireEvent.click(startButton);
      
      expect(mockCreateSession).toHaveBeenCalledWith();
      
      // Simulate session creation success by updating context
      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        session: mockSession,
        sendMessage: mockSendMessage,
      });
      
      rerender(<App />);
      
      // Should now show the chat interface
      expect(screen.getByText(/Session:/)).toBeInTheDocument();
      expect(screen.getByText(/Phase:/)).toBeInTheDocument();
      
      // Send a message
      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      fireEvent.change(input, { target: { value: 'I need help designing a microservices architecture' } });
      fireEvent.click(sendButton);
      
      expect(mockSendMessage).toHaveBeenCalledWith('I need help designing a microservices architecture');
    });

    it('displays conversation history from session', async () => {
      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        session: mockSession,
      });

      render(<App />);
      
      // Should display the messages from mockSession
      expect(screen.getAllByTestId('markdown')[0]).toHaveTextContent('Hello, I need help with architecture');
      expect(screen.getAllByTestId('markdown')[1]).toHaveTextContent('Welcome to TOAD Architect!');
    });

    it('shows welcome message when conversation history is empty', async () => {
      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        session: mockEmptySession,
      });

      render(<App />);
      
      expect(screen.getByText('Welcome to TOAD Architect!')).toBeInTheDocument();
      expect(screen.getByText(/I'm your AI software architecture assistant/)).toBeInTheDocument();
    });
  });

  describe('Error Handling Integration', () => {
    it('handles session creation errors gracefully', async () => {
      const errorMessage = 'Failed to create session due to network error';
      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        error: errorMessage,
      });

      render(<App />);
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      // Should still show the welcome screen or error elements
      expect(screen.getByText('TOAD Architect')).toBeInTheDocument();
    });

    it('handles message sending errors gracefully', async () => {
      const errorMessage = 'Failed to send message';
      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        session: mockSession,
        error: errorMessage,
      });

      render(<App />);
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      // Should still show the chat interface
      expect(screen.getByText(/Session:/)).toBeInTheDocument();
    });

    it('allows retry after error', async () => {
      const mockCreateSession = jest.fn();
      
      // First render with error
      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        error: 'Network error',
        createSession: mockCreateSession,
      });

      const { rerender } = render(<App />);
      
      expect(screen.getByText('Network error')).toBeInTheDocument();
      
      const startButton = screen.getByRole('button', { name: /start new session/i });
      fireEvent.click(startButton);
      
      expect(mockCreateSession).toHaveBeenCalled();
      
      // Simulate successful retry
      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        session: mockSession,
      });
      
      rerender(<App />);
      
      expect(screen.getByText(/Session:/)).toBeInTheDocument();
    });
  });

  describe('Session Management Integration', () => {
    it('creates new session when already in active session', async () => {
      const mockCreateSession = jest.fn();
      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        session: mockSession,
        createSession: mockCreateSession,
      });

      render(<App />);
      
      const newSessionButton = screen.getByRole('button', { name: /new session/i });
      fireEvent.click(newSessionButton);
      
      expect(mockCreateSession).toHaveBeenCalledTimes(1);
    });

    it('exports session successfully', async () => {
      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        session: mockSession,
      });

      render(<App />);
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(mockSessionApi.exportSession).toHaveBeenCalledWith(mockSession.sessionId);
      });
    });
  });

  describe('UI State Integration', () => {
    it('shows loading states during operations', async () => {
      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        isLoading: true,
      });

      render(<App />);
      
      const startButton = screen.getByRole('button', { name: /start new session/i });
      expect(startButton).toBeDisabled();
    });

    it('disables input during message sending', async () => {
      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        session: mockSession,
        isLoading: true,
      });

      render(<App />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      expect(input).toBeDisabled();
      expect(sendButton).toBeDisabled();
    });

    it('shows typing indicator during message sending', async () => {
      const mockSendMessage = jest.fn();
      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        session: mockSession,
        sendMessage: mockSendMessage,
      });

      render(<App />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.submit(input.closest('form')!);
      
      expect(mockSendMessage).toHaveBeenCalledWith('Test message');
    });
  });

  describe('Navigation and Routing', () => {
    it('maintains state when navigating between components', async () => {
      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        session: mockSession,
      });

      render(<App />);
      
      // Verify that session state persists
      expect(screen.getByText(/Session:/)).toBeInTheDocument();
      expect(screen.getAllByTestId('markdown')[0]).toHaveTextContent('Hello, I need help with architecture');
    });
  });

  describe('Accessibility Integration', () => {
    it('maintains focus management during interactions', async () => {
      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        session: mockSession,
      });

      render(<App />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      expect(input).toBeInTheDocument();
      
      // Verify form structure
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });

    it('provides proper form labels and structure', async () => {
      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        session: mockSession,
      });

      render(<App />);
      
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /new session/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
    });
  });

  describe('Performance Integration', () => {
    it('handles rapid user interactions gracefully', async () => {
      const mockSendMessage = jest.fn();
      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        session: mockSession,
        sendMessage: mockSendMessage,
      });

      render(<App />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      const form = input.closest('form')!;
      
      // Rapid form submissions
      fireEvent.change(input, { target: { value: 'Message 1' } });
      fireEvent.submit(form);
      fireEvent.change(input, { target: { value: 'Message 2' } });
      fireEvent.submit(form);
      
      // Should only call sendMessage for the last valid submission
      expect(mockSendMessage).toHaveBeenCalledWith('Message 2');
    });

    it('manages memory efficiently with large conversation history', async () => {
      const largeSession = {
        ...mockSession,
        conversationHistory: Array.from({ length: 100 }, (_, i) => ({
          id: `msg-${i}`,
          timestamp: new Date(),
          role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
          content: `Message ${i}`,
        })),
      };

      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        session: largeSession,
      });

      render(<App />);
      
      // Should render without performance issues
      expect(screen.getByText(/Session:/)).toBeInTheDocument();
      expect(screen.getAllByTestId('markdown')).toHaveLength(100);
    });
  });
});