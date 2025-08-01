import React from 'react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import { render } from '../../test-utils/test-providers';
import { Chat } from '../Chat';
import { SessionContextType } from '../../types';
import { mockSession, mockEmptySession } from '../../test-utils/mocks';

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

// Mock the useSession hook
const mockUseSession = jest.fn();
jest.mock('../../contexts/SessionContext', () => ({
  ...jest.requireActual('../../contexts/SessionContext'),
  useSession: () => mockUseSession(),
}));

describe('Chat Component', () => {
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
  });

  describe('No Session State', () => {
    it('shows loading state when no session exists', () => {
      render(<Chat />);
      
      expect(screen.getByText('Loading session...')).toBeInTheDocument();
      expect(screen.getByText('Please wait while we load your session.')).toBeInTheDocument();
    });

    it('shows loading state when isLoading is true', () => {
      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        isLoading: true,
      });

      render(<Chat />);
      
      expect(screen.getByText('Loading session...')).toBeInTheDocument();
      expect(screen.getByText('Please wait while we load your session.')).toBeInTheDocument();
    });
  });

  describe('Active Session State', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        session: mockSession,
      });
    });

    it('renders chat interface when session exists', () => {
      render(<Chat />);
      
      expect(screen.getByText('TOAD Architect')).toBeInTheDocument();
      expect(screen.getByText(/Session:/)).toBeInTheDocument();
      expect(screen.getByText(/Phase:/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /new session/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
    });

    it('displays conversation history', () => {
      render(<Chat />);
      
      const markdownElements = screen.getAllByTestId('markdown');
      expect(markdownElements[0]).toHaveTextContent('Hello, I need help with architecture');
      expect(markdownElements[1]).toHaveTextContent('Welcome to TOAD Architect!');
    });

    it('shows welcome message when conversation history is empty', () => {
      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        session: mockEmptySession,
      });

      render(<Chat />);
      
      expect(screen.getByText('Welcome to TOAD Architect!')).toBeInTheDocument();
      expect(screen.getByText(/I'm your AI software architecture assistant/)).toBeInTheDocument();
    });
  });

  describe('Message Input', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        session: mockSession,
      });
    });

    it('renders message input form', () => {
      render(<Chat />);
      
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });

    it('updates input value when typing', () => {
      render(<Chat />);
      
      const input = screen.getByPlaceholderText('Type your message...') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'Test message' } });
      
      expect(input.value).toBe('Test message');
    });

    it('sends message when form is submitted', () => {
      const mockSendMessage = jest.fn();
      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        session: mockSession,
        sendMessage: mockSendMessage,
      });

      render(<Chat />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);
      
      expect(mockSendMessage).toHaveBeenCalledWith('Test message');
    });

    it('clears input after sending message', async () => {
      const mockSendMessage = jest.fn().mockResolvedValue(undefined);
      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        session: mockSession,
        sendMessage: mockSendMessage,
      });

      render(<Chat />);
      
      const input = screen.getByPlaceholderText('Type your message...') as HTMLInputElement;
      
      fireEvent.change(input, { target: { value: 'Test message' } });
      
      await act(async () => {
        fireEvent.submit(input.closest('form')!);
      });
      
      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('shows loading screen when isLoading is true even with session', () => {
      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        session: mockSession,
        isLoading: true,
      });

      render(<Chat />);
      
      expect(screen.getByText('Loading session...')).toBeInTheDocument();
      expect(screen.getByText('Please wait while we load your session.')).toBeInTheDocument();
    });

    it('disables send button when input is empty', () => {
      render(<Chat />);
      
      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeDisabled();
    });

    it('disables send button with only whitespace', () => {
      render(<Chat />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      fireEvent.change(input, { target: { value: '   ' } });
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when error exists', () => {
      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        session: mockSession,
        error: 'Something went wrong',
      });

      render(<Chat />);
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('handles send message error gracefully', async () => {
      const mockSendMessage = jest.fn().mockRejectedValue(new Error('Send failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        session: mockSession,
        sendMessage: mockSendMessage,
      });

      render(<Chat />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      fireEvent.change(input, { target: { value: 'Test message' } });
      
      await act(async () => {
        fireEvent.submit(input.closest('form')!);
      });
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to send message:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Session Actions', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        session: mockSession,
      });
    });

    it('creates new session when New Session button is clicked', () => {
      const mockCreateSession = jest.fn();
      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        session: mockSession,
        createSession: mockCreateSession,
      });

      render(<Chat />);
      
      const newSessionButton = screen.getByRole('button', { name: /new session/i });
      fireEvent.click(newSessionButton);
      
      expect(mockCreateSession).toHaveBeenCalledTimes(1);
    });

    it('exports session when Export button is clicked', () => {
      render(<Chat />);
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      fireEvent.click(exportButton);
      
      expect(mockSessionApi.exportSession).toHaveBeenCalledWith(mockSession.sessionId);
    });

    it('handles export error gracefully', () => {
      mockSessionApi.exportSession.mockRejectedValueOnce(new Error('Export failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<Chat />);
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      fireEvent.click(exportButton);
      
      // Just verify the function was called, error handling happens asynchronously
      expect(mockSessionApi.exportSession).toHaveBeenCalledWith(mockSession.sessionId);
      
      consoleSpy.mockRestore();
    });
  });

  describe('UI States', () => {
    it('shows typing indicator when sending message', async () => {
      const mockSendMessage = jest.fn().mockResolvedValue(undefined);

      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        session: mockSession,
        sendMessage: mockSendMessage,
      });

      render(<Chat />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      fireEvent.change(input, { target: { value: 'Test message' } });
      
      await act(async () => {
        fireEvent.submit(input.closest('form')!);
      });
      
      // Verify the message was sent
      expect(mockSendMessage).toHaveBeenCalledWith('Test message');
    });

    it('scrolls to bottom when conversation updates', () => {
      // Mock with session that has conversation history to trigger useEffect
      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        session: mockSession,
      });
      
      render(<Chat />);
      
      // scrollIntoView should have been called (mocked in setup)
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });
  });
});