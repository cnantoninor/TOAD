import axios from 'axios';
import { Session, CreateSessionRequest, SendMessageRequest, SendMessageResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add correlation ID
api.interceptors.request.use((config) => {
    config.headers['x-correlation-id'] = crypto.randomUUID();
    return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.data?.message) {
            error.message = error.response.data.message;
        }
        return Promise.reject(error);
    }
);

export const sessionApi = {
    createSession: async (data: CreateSessionRequest): Promise<Session> => {
        const response = await api.post<Session>('/sessions', data);
        return {
            ...response.data,
            createdAt: new Date(response.data.createdAt),
            lastAccessed: new Date(response.data.lastAccessed),
            conversationHistory: response.data.conversationHistory.map(msg => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
            }))
        };
    },

    getSession: async (sessionId: string): Promise<Session> => {
        const response = await api.get<Session>(`/sessions/${sessionId}`);
        return {
            ...response.data,
            createdAt: new Date(response.data.createdAt),
            lastAccessed: new Date(response.data.lastAccessed),
            conversationHistory: response.data.conversationHistory.map(msg => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
            }))
        };
    },

    sendMessage: async (sessionId: string, data: SendMessageRequest): Promise<SendMessageResponse> => {
        const response = await api.post<SendMessageResponse>(`/sessions/${sessionId}/messages`, data);
        return {
            ...response.data,
            message: {
                ...response.data.message,
                timestamp: new Date(response.data.message.timestamp)
            },
            conversationHistory: response.data.conversationHistory.map(msg => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
            }))
        };
    },

    exportSession: async (sessionId: string): Promise<Blob> => {
        const response = await api.get(`/sessions/${sessionId}/export`, {
            responseType: 'blob'
        });
        return response.data;
    }
};

export const healthApi = {
    checkHealth: async () => {
        const response = await api.get('/health');
        return response.data;
    }
};

export default api; 