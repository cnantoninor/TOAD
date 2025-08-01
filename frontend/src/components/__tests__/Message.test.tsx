import React from 'react';
import { render, screen } from '../../test-utils/test-providers';
import { Message } from '../Message';
import { mockMessage, mockAssistantMessage } from '../../test-utils/mocks';

describe('Message Component', () => {
  describe('User Message', () => {
    it('renders user message correctly', () => {
      render(<Message message={mockMessage} />);
      
      expect(screen.getByText(mockMessage.content)).toBeInTheDocument();
      expect(screen.getByRole('img', { hidden: true })).toHaveClass('w-3', 'h-3'); // User icon
    });

    it('displays timestamp for user message', () => {
      render(<Message message={mockMessage} />);
      
      const timestamp = mockMessage.timestamp.toLocaleTimeString();
      expect(screen.getByText(timestamp)).toBeInTheDocument();
    });

    it('applies correct styling for user message', () => {
      render(<Message message={mockMessage} />);
      
      const messageContainer = screen.getByText(mockMessage.content).closest('.message-bubble');
      expect(messageContainer).toHaveClass('message-user');
    });
  });

  describe('Assistant Message', () => {
    it('renders assistant message correctly', () => {
      render(<Message message={mockAssistantMessage} />);
      
      const markdown = screen.getByTestId('markdown');
      expect(markdown).toHaveTextContent('Welcome to TOAD Architect!');
      expect(markdown).toHaveTextContent('I can help you with software architecture design.');
    });

    it('displays bot icon for assistant message', () => {
      render(<Message message={mockAssistantMessage} />);
      
      const botIcons = screen.getAllByRole('img', { hidden: true });
      expect(botIcons[0]).toHaveClass('w-5', 'h-5'); // Bot icon in avatar
    });

    it('applies correct styling for assistant message', () => {
      render(<Message message={mockAssistantMessage} />);
      
      const messageContainer = screen.getByTestId('markdown').closest('.message-bubble');
      expect(messageContainer).toHaveClass('message-assistant');
    });

    it('renders markdown content correctly', () => {
      const markdownMessage = {
        ...mockAssistantMessage,
        content: '# Heading\n\n**Bold text** and `code`',
      };
      
      render(<Message message={markdownMessage} />);
      
      const markdown = screen.getByTestId('markdown');
      expect(markdown).toHaveTextContent('Heading');
      expect(markdown).toHaveTextContent('Bold text');
      expect(markdown).toHaveTextContent('code');
    });

    it('renders code blocks correctly', () => {
      const codeMessage = {
        ...mockAssistantMessage,
        content: '```javascript\nconst hello = "world";\n```',
      };
      
      render(<Message message={codeMessage} />);
      
      const markdown = screen.getByTestId('markdown');
      expect(markdown).toHaveTextContent('javascript');
      expect(markdown).toHaveTextContent('const hello = "world";');
    });

    it('renders lists correctly', () => {
      const listMessage = {
        ...mockAssistantMessage,
        content: '## Features:\n\n- Feature 1\n- Feature 2\n\n1. First step\n2. Second step',
      };
      
      render(<Message message={listMessage} />);
      
      const markdown = screen.getByTestId('markdown');
      expect(markdown).toHaveTextContent('Features:');
      expect(markdown).toHaveTextContent('Feature 1');
      expect(markdown).toHaveTextContent('Feature 2');
      expect(markdown).toHaveTextContent('First step');
      expect(markdown).toHaveTextContent('Second step');
    });
  });

  describe('Layout and Structure', () => {
    it('user message is right-aligned', () => {
      render(<Message message={mockMessage} />);
      
      const container = screen.getByText(mockMessage.content).closest('.flex.gap-3');
      expect(container).toHaveClass('justify-end');
    });

    it('assistant message is left-aligned', () => {
      render(<Message message={mockAssistantMessage} />);
      
      const container = screen.getByTestId('markdown').closest('.flex.gap-3');
      expect(container).toHaveClass('justify-start');
    });

    it('limits message width with max-w-3xl', () => {
      render(<Message message={mockMessage} />);
      
      const contentContainer = screen.getByText(mockMessage.content).closest('.max-w-3xl');
      expect(contentContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      render(<Message message={mockAssistantMessage} />);
      
      expect(screen.getByTestId('markdown')).toBeInTheDocument();
    });

    it('provides accessible timestamp information', () => {
      render(<Message message={mockMessage} />);
      
      const timestamp = mockMessage.timestamp.toLocaleTimeString();
      expect(screen.getByText(timestamp)).toBeInTheDocument();
    });
  });
});