import React, { useState, useRef, useEffect } from 'react';
import { Send, Download, Plus } from 'lucide-react';
import { Message } from './Message';
import { useSession } from '../contexts/SessionContext';
import { sessionApi } from '../services/api';

export function Chat() {
    const { session, isLoading, error, sendMessage, createSession } = useSession();
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [session?.conversationHistory]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const message = inputValue.trim();
        setInputValue('');
        setIsTyping(true);

        try {
            await sendMessage(message);
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsTyping(false);
        }
    };

    const handleNewSession = async () => {
        try {
            await createSession();
        } catch (error) {
            console.error('Failed to create new session:', error);
        }
    };

    const handleExport = async () => {
        if (!session) return;

        try {
            const blob = await sessionApi.exportSession(session.sessionId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `session-${session.sessionId}.md`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Failed to export session:', error);
        }
    };

    if (!session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-8">
                <div className="text-center max-w-md">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        TOAD Architect
                    </h1>
                    <p className="text-gray-600 mb-8">
                        Your AI-powered software architecture assistant. Start a new session to begin designing your software architecture.
                    </p>
                    <button
                        onClick={handleNewSession}
                        disabled={isLoading}
                        className="btn-primary flex items-center gap-2 mx-auto"
                    >
                        <Plus className="w-5 h-5" />
                        Start New Session
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">TOAD Architect</h1>
                        <p className="text-sm text-gray-500">
                            Session: {session.sessionId.slice(0, 8)}... | Phase: {session.currentPhase}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleNewSession}
                            className="btn-outline flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            New Session
                        </button>
                        <button
                            onClick={handleExport}
                            className="btn-outline flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {session.conversationHistory.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bot className="w-8 h-8 text-primary-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Welcome to TOAD Architect!
                        </h2>
                        <p className="text-gray-600 max-w-md mx-auto">
                            I'm your AI software architecture assistant. I can help you design, plan, and iterate on software architectures through systematic trade-off analysis.
                        </p>
                    </div>
                ) : (
                    session.conversationHistory.map((message) => (
                        <Message key={message.id} message={message} />
                    ))
                )}

                {/* Typing indicator */}
                {isTyping && (
                    <div className="flex gap-3 mb-6">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div className="message-bubble message-assistant">
                            <div className="typing-indicator">
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Error display */}
            {error && (
                <div className="bg-red-50 border border-red-200 px-6 py-3">
                    <p className="text-red-800 text-sm">{error}</p>
                </div>
            )}

            {/* Input form */}
            <div className="bg-white border-t border-gray-200 p-6">
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type your message..."
                            disabled={isLoading || isTyping}
                            className="input flex-1"
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim() || isLoading || isTyping}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            Send
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Import Bot icon for the welcome message
import { Bot } from 'lucide-react'; 