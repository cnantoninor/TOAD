import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SessionCreation } from '../components/SessionCreation';
import { Chat } from '../components/Chat';
import { mockSession } from '../test-utils/mocks';
import { SessionContextType } from '../types';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Plus: () => <span data-testid="plus-icon">Plus</span>,
  ArrowRight: () => <span data-testid="arrow-right-icon">ArrowRight</span>,
  Bot: () => <span data-testid="bot-icon">Bot</span>,
  Send: () => <span data-testid="send-icon">Send</span>,
  Download: () => <span data-testid="download-icon">Download</span>,
  Home: () => <span data-testid="home-icon">Home</span>,
  Copy: () => <span data-testid="copy-icon">Copy</span>,
  Check: () => <span data-testid="check-icon">Check</span>,
  User: () => <span data-testid="user-icon">User</span>,
}));

// Mock the API module
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

// Mock the useSession hook
const mockUseSession = jest.fn();
jest.mock('../contexts/SessionContext', () => ({
  ...jest.requireActual('../contexts/SessionContext'),
  useSession: () => mockUseSession(),
}));

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ sessionId: 'test-session-id' }),
}));

describe('Session Continuation Tests', () => {
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
    mockSessionApi.getSession.mockResolvedValue(mockSession);
  });

  describe('SessionCreation Component', () => {
    it('allows users to continue session by entering session ID', async () => {
      render(
        <BrowserRouter>
          <SessionCreation />
        </BrowserRouter>
      );

      // Find the session ID input
      const sessionIdInput = screen.getByPlaceholderText('Enter session ID...');
      const continueButton = screen.getByRole('button', { name: /continue session/i });

      // Enter a session ID
      fireEvent.change(sessionIdInput, { target: { value: 'test-session-id' } });
      fireEvent.click(continueButton);

      // Should navigate to the session URL
      expect(mockNavigate).toHaveBeenCalledWith('/session/test-session-id');
    });

    it('allows users to continue session by pressing Enter', async () => {
      render(
        <BrowserRouter>
          <SessionCreation />
        </BrowserRouter>
      );

      const sessionIdInput = screen.getByPlaceholderText('Enter session ID...');

      // Enter a session ID and press Enter
      fireEvent.change(sessionIdInput, { target: { value: 'test-session-id' } });
      fireEvent.keyPress(sessionIdInput, { key: 'Enter', code: 'Enter', charCode: 13 });

      // Should navigate to the session URL
      expect(mockNavigate).toHaveBeenCalledWith('/session/test-session-id');
    });

    it('disables continue button when session ID is empty', () => {
      render(
        <BrowserRouter>
          <SessionCreation />
        </BrowserRouter>
      );

      const continueButton = screen.getByRole('button', { name: /continue session/i });
      expect(continueButton).toBeDisabled();
    });

    it('enables continue button when session ID is entered', () => {
      render(
        <BrowserRouter>
          <SessionCreation />
        </BrowserRouter>
      );

      const sessionIdInput = screen.getByPlaceholderText('Enter session ID...');
      const continueButton = screen.getByRole('button', { name: /continue session/i });

      fireEvent.change(sessionIdInput, { target: { value: 'test-session-id' } });
      expect(continueButton).not.toBeDisabled();
    });
  });

  describe('Chat Component - Session Loading', () => {
    it('shows loading state when session is being loaded', () => {
      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        isLoading: true,
      });

      render(
        <BrowserRouter>
          <Chat />
        </BrowserRouter>
      );

      expect(screen.getByText('Loading session...')).toBeInTheDocument();
      expect(screen.getByText('Please wait while we load your session.')).toBeInTheDocument();
    });

    it('redirects to home when no session is available', () => {
      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        session: null,
        isLoading: false,
      });

      render(
        <BrowserRouter>
          <Chat />
        </BrowserRouter>
      );

      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });

    it('displays session information when loaded', () => {
      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        session: mockSession,
        isLoading: false,
      });

      render(
        <BrowserRouter>
          <Chat />
        </BrowserRouter>
      );

      expect(screen.getByText(/Session:/)).toBeInTheDocument();
      expect(screen.getByText(/Phase:/)).toBeInTheDocument();
    });
  });

  describe('Copy Session URL Feature', () => {
    beforeEach(() => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn(),
        },
      });
    });

    it('copies session URL to clipboard', async () => {
      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        session: mockSession,
        isLoading: false,
      });

      // Mock window.location.origin
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://localhost:3000' },
        writable: true,
      });

      render(
        <BrowserRouter>
          <Chat />
        </BrowserRouter>
      );

      const copyButton = screen.getByRole('button', { name: /copy url/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          'http://localhost:3000/session/test-session-id'
        );
      });

      // Should show "Copied!" feedback
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });

    it('provides fallback for older browsers', async () => {
      // Mock clipboard API to fail
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockRejectedValue(new Error('Clipboard API not supported')),
        },
      });

      // Mock document.execCommand
      const mockExecCommand = jest.fn();
      Object.defineProperty(document, 'execCommand', {
        value: mockExecCommand,
        writable: true,
      });

      mockUseSession.mockReturnValue({
        ...defaultMockContext,
        session: mockSession,
        isLoading: false,
      });

      Object.defineProperty(window, 'location', {
        value: { origin: 'http://localhost:3000' },
        writable: true,
      });

      render(
        <BrowserRouter>
          <Chat />
        </BrowserRouter>
      );

      const copyButton = screen.getByRole('button', { name: /copy url/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockExecCommand).toHaveBeenCalledWith('copy');
      });
    });
  });
}); 