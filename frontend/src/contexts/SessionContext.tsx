import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Session, SessionContextType } from '../types';
import { sessionApi } from '../services/api';

interface SessionState {
    session: Session | null;
    isLoading: boolean;
    error: string | null;
}

type SessionAction =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_SESSION'; payload: Session }
    | { type: 'SET_ERROR'; payload: string }
    | { type: 'CLEAR_ERROR' }
    | { type: 'UPDATE_SESSION'; payload: Partial<Session> };

const initialState: SessionState = {
    session: null,
    isLoading: false,
    error: null,
};

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_SESSION':
            return { ...state, session: action.payload, error: null, isLoading: false };
        case 'SET_ERROR':
            return { ...state, error: action.payload, isLoading: false };
        case 'CLEAR_ERROR':
            return { ...state, error: null };
        case 'UPDATE_SESSION':
            return {
                ...state,
                session: state.session ? { ...state.session, ...action.payload } : null,
            };
        default:
            return state;
    }
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(sessionReducer, initialState);
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();

    // Load session from URL parameter
    useEffect(() => {
        if (sessionId) {
            loadSession(sessionId);
        }
    }, [sessionId]);

    const loadSession = async (id: string) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            dispatch({ type: 'CLEAR_ERROR' });
            
            const session = await sessionApi.getSession(id);
            dispatch({ type: 'SET_SESSION', payload: session });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load session';
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            // Redirect to home if session not found
            if (error instanceof Error && error.message.includes('not found')) {
                navigate('/', { replace: true });
            }
        }
    };

    const createSession = async (customInstructions?: string) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            dispatch({ type: 'CLEAR_ERROR' });
            
            const session = await sessionApi.createSession({ customInstructions });
            dispatch({ type: 'SET_SESSION', payload: session });
            
            // Update URL to include session ID
            navigate(`/session/${session.sessionId}`, { replace: true });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to create session' });
        }
    };

    const sendMessage = async (content: string) => {
        if (!state.session) {
            dispatch({ type: 'SET_ERROR', payload: 'No active session' });
            return;
        }

        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const response = await sessionApi.sendMessage(state.session.sessionId, { content });

            // Update session with new conversation history
            const updatedSession = {
                ...state.session,
                conversationHistory: response.conversationHistory,
                lastAccessed: new Date(),
            };

            dispatch({ type: 'SET_SESSION', payload: updatedSession });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to send message' });
        }
    };

    const clearError = () => {
        dispatch({ type: 'CLEAR_ERROR' });
    };

    const value: SessionContextType = {
        session: state.session,
        isLoading: state.isLoading,
        error: state.error,
        createSession,
        sendMessage,
        clearError,
    };

    return (
        <SessionContext.Provider value={value}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    const context = useContext(SessionContext);
    if (context === undefined) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
} 