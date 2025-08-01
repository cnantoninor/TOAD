import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, Bot } from 'lucide-react';
import { useSession } from '../contexts/SessionContext';

export function SessionCreation() {
    const { createSession, isLoading, error } = useSession();
    const [sessionId, setSessionId] = useState('');
    const [customInstructions, setCustomInstructions] = useState('');
    const navigate = useNavigate();

    const handleNewSession = async () => {
        try {
            await createSession(customInstructions || undefined);
            // Navigation will be handled by the SessionContext
        } catch (error) {
            console.error('Failed to create new session:', error);
        }
    };

    const handleContinueSession = () => {
        if (sessionId.trim()) {
            navigate(`/session/${sessionId.trim()}`);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleContinueSession();
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bot className="w-8 h-8 text-primary-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        TOAD Architect
                    </h1>
                    <p className="text-gray-600">
                        Your AI-powered software architecture assistant
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                    {/* Continue Existing Session */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-3">
                            Continue Existing Session
                        </h2>
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={sessionId}
                                onChange={(e) => setSessionId(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Enter session ID..."
                                className="input w-full"
                            />
                            <button
                                onClick={handleContinueSession}
                                disabled={!sessionId.trim()}
                                className="btn-primary w-full flex items-center justify-center gap-2"
                            >
                                <ArrowRight className="w-4 h-4" />
                                Continue Session
                            </button>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">or</span>
                        </div>
                    </div>

                    {/* Start New Session */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-3">
                            Start New Session
                        </h2>
                        <div className="space-y-3">
                            <textarea
                                value={customInstructions}
                                onChange={(e) => setCustomInstructions(e.target.value)}
                                placeholder="Optional: Add custom instructions for the AI..."
                                rows={3}
                                className="input w-full resize-none"
                            />
                            <button
                                onClick={handleNewSession}
                                disabled={isLoading}
                                className="btn-primary w-full flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                {isLoading ? 'Creating...' : 'Start New Session'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Error display */}
                {error && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                        <p className="text-red-800 text-sm">{error}</p>
                    </div>
                )}

                {/* Help text */}
                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>
                        Sessions are automatically saved and can be continued anytime by using the session ID.
                    </p>
                    <p className="mt-1">
                        Sessions are automatically cleaned up after 30 days of inactivity.
                    </p>
                </div>
            </div>
        </div>
    );
} 