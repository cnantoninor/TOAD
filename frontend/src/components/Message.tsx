import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message as MessageType } from '../types';
import { User, Bot } from 'lucide-react';

interface MessageProps {
    message: MessageType;
}

export function Message({ message }: MessageProps) {
    const isUser = message.role === 'user';
    const timestamp = new Date(message.timestamp).toLocaleTimeString();

    return (
        <div className={`flex gap-3 mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                </div>
            )}

            <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-3xl`}>
                <div className={`message-bubble ${isUser ? 'message-user' : 'message-assistant'}`}>
                    <ReactMarkdown
                        className={`prose ${isUser ? 'prose-invert' : ''} max-w-none`}
                        components={{
                            code({ node, inline, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '');
                                return !inline && match ? (
                                    <pre className="bg-gray-100 rounded p-3 overflow-x-auto">
                                        <code className={className} {...props}>
                                            {children}
                                        </code>
                                    </pre>
                                ) : (
                                    <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>
                                        {children}
                                    </code>
                                );
                            },
                            p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                            li: ({ children }) => <li className="text-sm">{children}</li>,
                            h1: ({ children }) => <h1 className="text-xl font-bold mb-3">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-lg font-semibold mb-2">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-base font-semibold mb-2">{children}</h3>,
                            blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-primary-500 pl-4 italic bg-gray-50 p-3 rounded-r">
                                    {children}
                                </blockquote>
                            ),
                        }}
                    >
                        {message.content}
                    </ReactMarkdown>
                </div>

                <div className={`flex items-center gap-2 mt-2 text-xs text-gray-500 ${isUser ? 'flex-row-reverse' : ''}`}>
                    {isUser && (
                        <div className="flex-shrink-0 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-white" />
                        </div>
                    )}
                    <span>{timestamp}</span>
                </div>
            </div>
        </div>
    );
} 