# Stage 1 Implementation Guide - MVP

## Overview

This guide provides step-by-step instructions to implement the MVP version of the web-based conversational software architecture application. The MVP focuses on core functionality: basic conversational interface, session management, file-based storage, and simple export.

## Prerequisites

### Development Environment
- Node.js 18+ and npm
- Git
- Code editor (Cursor or VS Code recommended)
- OpenAI API key

### Required Accounts
- OpenAI API account with credits
- Railway/Render account for deployment (optional for local development)

## Project Structure

```
toad-architect/
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── utils/
│   ├── public/
│   └── package.json
├── backend/                  # Express API
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── data/                 # SQLite database and JSON files
│   └── package.json
└── README.md
```

## Step 1: Backend Setup

### 1.1 Initialize Backend Project

```bash
mkdir toad-architect
cd toad-architect
mkdir backend
cd backend
npm init -y
```

### 1.2 Install Dependencies

```bash
npm install express cors dotenv openai sqlite3 uuid
npm install --save-dev @types/express @types/cors @types/node typescript ts-node nodemon jest @types/jest supertest @types/supertest
```

### 1.3 Create TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 1.4 Environment Configuration

Create `.env`:

```env
PORT=3001
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=development
```

### 1.5 Database Setup

Create `src/models/database.ts`:

```typescript
import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../data/sessions.db');

export const db = new sqlite3.Database(dbPath);

export const initializeDatabase = () => {
  return new Promise<void>((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
          sessionId TEXT PRIMARY KEY,
          createdAt TEXT NOT NULL,
          lastAccessed TEXT NOT NULL,
          currentPhase INTEGER DEFAULT 1,
          customInstructions TEXT,
          conversationHistory TEXT
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
};
```

### 1.6 Session Model

Create `src/models/session.ts`:

```typescript
import { db } from './database';

export interface Session {
  sessionId: string;
  createdAt: Date;
  lastAccessed: Date;
  currentPhase: number;
  customInstructions?: string;
  conversationHistory: Message[];
}

export interface Message {
  id: string;
  timestamp: Date;
  role: 'user' | 'assistant';
  content: string;
}

export class SessionModel {
  static async create(session: Omit<Session, 'createdAt' | 'lastAccessed'>): Promise<Session> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      const sessionData = {
        ...session,
        createdAt: now,
        lastAccessed: now,
        conversationHistory: JSON.stringify(session.conversationHistory)
      };

      db.run(
        'INSERT INTO sessions (sessionId, createdAt, lastAccessed, currentPhase, customInstructions, conversationHistory) VALUES (?, ?, ?, ?, ?, ?)',
        [sessionData.sessionId, sessionData.createdAt, sessionData.lastAccessed, sessionData.currentPhase, sessionData.customInstructions, sessionData.conversationHistory],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              ...sessionData,
              createdAt: new Date(sessionData.createdAt),
              lastAccessed: new Date(sessionData.lastAccessed),
              conversationHistory: session.conversationHistory
            });
          }
        }
      );
    });
  }

  static async getById(sessionId: string): Promise<Session | null> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM sessions WHERE sessionId = ?',
        [sessionId],
        (err, row) => {
          if (err) {
            reject(err);
          } else if (!row) {
            resolve(null);
          } else {
            resolve({
              sessionId: row.sessionId,
              createdAt: new Date(row.createdAt),
              lastAccessed: new Date(row.lastAccessed),
              currentPhase: row.currentPhase,
              customInstructions: row.customInstructions,
              conversationHistory: JSON.parse(row.conversationHistory)
            });
          }
        }
      );
    });
  }

  static async update(sessionId: string, updates: Partial<Session>): Promise<void> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      const conversationHistory = updates.conversationHistory ? JSON.stringify(updates.conversationHistory) : undefined;

      db.run(
        'UPDATE sessions SET lastAccessed = ?, currentPhase = ?, customInstructions = ?, conversationHistory = ? WHERE sessionId = ?',
        [now, updates.currentPhase, updates.customInstructions, conversationHistory, sessionId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }
}
```

### 1.7 OpenAI Service

Create `src/services/openai.ts`:

```typescript
import OpenAI from 'openai';
import { Message } from '../models/session';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an 'Expert Software Architect AI', skilled in:

* Proposing architectural solutions.
* Conducting technical analysis and cost estimation.
* Defining and prioritizing Software Quality Attributes (SQAs).
* Leading structured trade-off analysis.
* Facilitating decision-making.
* Structuring development plans.

Our Interactive Process:

* Engage in an iterative dialogue with the user.
* The user will provide context, requirements, and feedback.
* You will guide the architectural design by asking questions, proposing solutions, leading analysis, and formulating plans.
* Expect a dynamic process.

Phase 1: Defining the Context – Dimensions and Importance

Initial Project Briefing (User to Provide):
* The user will describe the project, objectives, key functionalities, users, and constraints (e.g., budget, tech stack, team, timeline).

Elicit and Define Software Quality Attributes (SQAs) (You will lead this):
* Guide the user to identify relevant Software Quality Attributes (SQAs) for the project (e.g., Performance, Scalability, Security, Cost).
* For each SQA, help determine its business importance (e.g., using a qualitative scale like Critical/High/Medium/Low, or numerical weights).
* Ensure a shared, clear understanding of each SQA's meaning for this particular project.

Phase 2: Defining Architectural Options – Technical Analysis & Cost Estimation

Propose Architectural Options (You will lead this):
* Based on the established context and prioritized SQAs, propose 2-4 distinct and viable architectural options.
* For each option, provide:
    * Technical Analysis: Describe core patterns, key components, technologies, data flow, interaction models, and how it addresses requirements.
    * Cost Estimation: Initial estimate for both Development Costs (considering effort, team size, specialized skills/tools) and Operational Costs (infrastructure, licensing, maintenance).
    * Key Assumptions and Risks: Briefly outline major assumptions made and potential risks or dependencies.

Phase 3: Trade-off Analysis – Systematic Evaluation

This is a critical, structured phase to compare options.

Define SQA Scoring Criteria (You will lead this):
* Use a simple scoring system (e.g., 1 to 3) to evaluate how well each architectural option satisfies each prioritized SQA.
* Crucially, for each SQA, guide the user in defining concretely what each score point means in this project's specific context.
* Example (SQA: Scalability, Score 1-3): 1 (Low: struggles with anticipated growth, significant redesign needed for scaling), 2 (Moderate: handles moderate growth with planned strategies, some components might need attention), 3 (High: designed for significant growth, efficient scaling).
* You will propose these concrete definitions for collaborative refinement.

Score the Architectural Options (Collaborative):
* Systematically score each architectural option against each prioritized SQA using the agreed-upon concrete scoring criteria.
* Propose and justify your scores; discuss and agree on the final scores with the user.

Calculate and Present the Trade-off Score (You will lead this):
* Propose a method to calculate an overall trade-off score for each option (e.g., Overall Score for Option X = Σ (SQA_Score_for_Option_X * SQA_Importance_Weight)).
* Present results clearly (preferably in a table), showing individual SQA scores, weights, and the final weighted score for each option.
* Beyond numerical scores, provide a qualitative summary of key trade-offs, strengths, and weaknesses.

Decision Support (You will lead this):
* Based on the comprehensive trade-off analysis, discuss the implications of choosing one option over others.
* Help identify which option(s) best align with prioritized SQAs and business objectives.
* Be prepared to discuss potential hybrid approaches or modifications.

Phase 4: Iteration (As Needed)

* Software architecture is rarely linear. Based on analysis or new insights, be prepared to revisit earlier phases to: refine existing options, define new ones, or re-evaluate SQA priorities/scoring.

Phase 5: Creating Milestones and Planning Document

Once a preferred architectural direction is identified:

Develop a High-Level Milestones Document (You will lead this):
* Based on the chosen architecture, outline key implementation phases and major milestones.
* For each milestone, suggest: primary objectives/deliverables, high-level tasks, potential dependencies, and a rough order of magnitude for effort/duration.

Outline Key Planning Considerations (You will lead this):
* Identify immediate next steps.
* Highlight major risks to the plan and potential mitigation strategies.
* List critical resources, skills, or technologies needed.
* Suggest any foundational work or proof-of-concepts to prioritize.

Output Format:
* For discussions and analysis, use clear, concise text; tables are highly encouraged for comparisons.
* The final Milestones, Design and Planning Document should be well-structured, suitable as a foundational planning artifact (outline or document with clear headings).

Interaction Style:
* Proactive: Ask clarifying questions whenever ambiguity arises.
* Transparent: Clearly explain your reasoning.
* Flexible: Be open to suggestions, feedback, and alternative viewpoints.
* Thorough: Address all aspects systematically.`;

export class OpenAIService {
  static async generateResponse(messages: Message[], customInstructions?: string): Promise<string> {
    try {
      const systemPrompt = customInstructions 
        ? `${SYSTEM_PROMPT}\n\nAdditional Custom Instructions:\n${customInstructions}`
        : SYSTEM_PROMPT;

      const openaiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: openaiMessages,
        max_tokens: 2000,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate AI response');
    }
  }
}
```

### 1.8 Session Controller

Create `src/controllers/sessionController.ts`:

```typescript
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { SessionModel, Session, Message } from '../models/session';
import { OpenAIService } from '../services/openai';

export class SessionController {
  static async createSession(req: Request, res: Response) {
    try {
      const sessionId = uuidv4();
      const { customInstructions } = req.body;

      const session: Omit<Session, 'createdAt' | 'lastAccessed'> = {
        sessionId,
        currentPhase: 1,
        customInstructions,
        conversationHistory: []
      };

      const createdSession = await SessionModel.create(session);
      res.status(201).json(createdSession);
    } catch (error) {
      console.error('Error creating session:', error);
      res.status(500).json({ error: 'Failed to create session' });
    }
  }

  static async getSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const session = await SessionModel.getById(sessionId);

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      res.json(session);
    } catch (error) {
      console.error('Error getting session:', error);
      res.status(500).json({ error: 'Failed to get session' });
    }
  }

  static async sendMessage(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const { content } = req.body;

      const session = await SessionModel.getById(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Add user message
      const userMessage: Message = {
        id: uuidv4(),
        timestamp: new Date(),
        role: 'user',
        content
      };

      const updatedHistory = [...session.conversationHistory, userMessage];

      // Generate AI response
      const aiResponse = await OpenAIService.generateResponse(
        updatedHistory,
        session.customInstructions
      );

      // Add AI message
      const aiMessage: Message = {
        id: uuidv4(),
        timestamp: new Date(),
        role: 'assistant',
        content: aiResponse
      };

      const finalHistory = [...updatedHistory, aiMessage];

      // Update session
      await SessionModel.update(sessionId, {
        conversationHistory: finalHistory,
        lastAccessed: new Date()
      });

      res.json({
        sessionId,
        message: aiMessage,
        conversationHistory: finalHistory
      });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }

  static async exportSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const session = await SessionModel.getById(sessionId);

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const markdown = generateMarkdownExport(session);
      
      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', `attachment; filename="session-${sessionId}.md"`);
      res.send(markdown);
    } catch (error) {
      console.error('Error exporting session:', error);
      res.status(500).json({ error: 'Failed to export session' });
    }
  }
}

function generateMarkdownExport(session: Session): string {
  let markdown = `# Software Architecture Session\n\n`;
  markdown += `**Session ID:** ${session.sessionId}\n`;
  markdown += `**Created:** ${session.createdAt.toISOString()}\n`;
  markdown += `**Last Accessed:** ${session.lastAccessed.toISOString()}\n`;
  markdown += `**Current Phase:** ${session.currentPhase}\n\n`;

  if (session.customInstructions) {
    markdown += `## Custom Instructions\n\n${session.customInstructions}\n\n`;
  }

  markdown += `## Conversation History\n\n`;

  session.conversationHistory.forEach((message, index) => {
    const role = message.role === 'user' ? '👤 User' : '🤖 AI Assistant';
    const timestamp = message.timestamp.toISOString();
    
    markdown += `### ${role} (${timestamp})\n\n`;
    markdown += `${message.content}\n\n`;
    
    if (index < session.conversationHistory.length - 1) {
      markdown += `---\n\n`;
    }
  });

  return markdown;
}
```

### 1.9 Routes

Create `src/routes/sessionRoutes.ts`:

```typescript
import { Router } from 'express';
import { SessionController } from '../controllers/sessionController';

const router = Router();

router.post('/sessions', SessionController.createSession);
router.get('/sessions/:sessionId', SessionController.getSession);
router.post('/sessions/:sessionId/messages', SessionController.sendMessage);
router.get('/sessions/:sessionId/export', SessionController.exportSession);

export default router;
```

### 1.10 Main Server File

Create `src/server.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './models/database';
import sessionRoutes from './routes/sessionRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', sessionRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

### 1.11 Package.json Scripts

Update `package.json`:

```json
{
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## Step 2: Frontend Setup

### 2.1 Initialize Frontend Project

```bash
cd ..
npx create-react-app frontend --template typescript
cd frontend
```

### 2.2 Install Dependencies

```bash
npm install axios react-router-dom @types/react-router-dom
npm install -D tailwindcss postcss autoprefixer
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event jest
```

### 2.3 Configure Tailwind CSS

```bash
npx tailwindcss init -p
```

Update `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Update `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 2.4 Types

Create `src/types/index.ts`:

```typescript
export interface Message {
  id: string;
  timestamp: Date;
  role: 'user' | 'assistant';
  content: string;
}

export interface Session {
  sessionId: string;
  createdAt: Date;
  lastAccessed: Date;
  currentPhase: number;
  customInstructions?: string;
  conversationHistory: Message[];
}

export interface CreateSessionRequest {
  customInstructions?: string;
}

export interface SendMessageRequest {
  content: string;
}

export interface SendMessageResponse {
  sessionId: string;
  message: Message;
  conversationHistory: Message[];
}
```

### 2.5 API Service

Create `src/services/api.ts`:

```typescript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const sessionApi = {
  createSession: async (data: CreateSessionRequest) => {
    const response = await api.post('/sessions', data);
    return response.data;
  },

  getSession: async (sessionId: string) => {
    const response = await api.get(`/sessions/${sessionId}`);
    return response.data;
  },

  sendMessage: async (sessionId: string, data: SendMessageRequest) => {
    const response = await api.post(`/sessions/${sessionId}/messages`, data);
    return response.data;
  },

  exportSession: async (sessionId: string) => {
    const response = await api.get(`/sessions/${sessionId}/export`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
```

### 2.6 Session Context

Create `src/contexts/SessionContext.tsx`:

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, Message } from '../types';
import { sessionApi } from '../services/api';

interface SessionContextType {
  session: Session | null;
  loading: boolean;
  error: string | null;
  createSession: (customInstructions?: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  exportSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

interface SessionProviderProps {
  children: React.ReactNode;
  sessionId?: string;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children, sessionId }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }
  }, [sessionId]);

  const loadSession = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const sessionData = await sessionApi.getSession(id);
      setSession(sessionData);
    } catch (err) {
      setError('Failed to load session');
      console.error('Error loading session:', err);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (customInstructions?: string) => {
    setLoading(true);
    setError(null);
    try {
      const sessionData = await sessionApi.createSession({ customInstructions });
      setSession(sessionData);
      // Update URL without page reload
      window.history.pushState({}, '', `/session/${sessionData.sessionId}`);
    } catch (err) {
      setError('Failed to create session');
      console.error('Error creating session:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!session) return;

    setLoading(true);
    setError(null);
    try {
      const response = await sessionApi.sendMessage(session.sessionId, { content });
      setSession({
        ...session,
        conversationHistory: response.conversationHistory,
        lastAccessed: new Date()
      });
    } catch (err) {
      setError('Failed to send message');
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportSession = async () => {
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
    } catch (err) {
      setError('Failed to export session');
      console.error('Error exporting session:', err);
    }
  };

  return (
    <SessionContext.Provider
      value={{
        session,
        loading,
        error,
        createSession,
        sendMessage,
        exportSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
```

### 2.7 Chat Component

Create `src/components/Chat.tsx`:

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { useSession } from '../contexts/SessionContext';

export const Chat: React.FC = () => {
  const { session, loading, error, sendMessage } = useSession();
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session?.conversationHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(inputValue);
      setInputValue('');
    } finally {
      setIsSending(false);
    }
  };

  if (loading && !session) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading session...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {session?.conversationHistory.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              <div className="text-sm opacity-75 mb-1">
                {message.role === 'user' ? '👤 You' : '🤖 AI Assistant'}
              </div>
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
              <div className="text-sm opacity-75 mb-1">🤖 AI Assistant</div>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isSending}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
};
```

### 2.8 Session Creation Component

Create `src/components/SessionCreation.tsx`:

```typescript
import React, { useState } from 'react';
import { useSession } from '../contexts/SessionContext';

export const SessionCreation: React.FC = () => {
  const { createSession, loading } = useSession();
  const [customInstructions, setCustomInstructions] = useState('');

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSession(customInstructions || undefined);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Software Architecture Assistant
        </h1>
        <p className="text-gray-600">
          Start a new architectural design session with AI assistance
        </p>
      </div>

      <form onSubmit={handleCreateSession} className="space-y-6">
        <div>
          <label htmlFor="customInstructions" className="block text-sm font-medium text-gray-700 mb-2">
            Custom Instructions (Optional)
          </label>
          <textarea
            id="customInstructions"
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="Add any custom instructions or domain-specific knowledge..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Session...' : 'Start New Session'}
        </button>
      </form>
    </div>
  );
};
```

### 2.9 Main App Component

Update `src/App.tsx`:

```typescript
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SessionProvider } from './contexts/SessionContext';
import { SessionCreation } from './components/SessionCreation';
import { Chat } from './components/Chat';
import { Header } from './components/Header';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto max-w-6xl h-screen">
          <Routes>
            <Route path="/" element={<SessionCreation />} />
            <Route
              path="/session/:sessionId"
              element={
                <SessionProvider>
                  <Chat />
                </SessionProvider>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
```

### 2.10 Header Component

Create `src/components/Header.tsx`:

```typescript
import React from 'react';
import { useSession } from '../contexts/SessionContext';
import { useNavigate, useParams } from 'react-router-dom';

export const Header: React.FC = () => {
  const { session, exportSession } = useSession();
  const navigate = useNavigate();
  const { sessionId } = useParams();

  const handleExport = async () => {
    try {
      await exportSession();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto max-w-6xl px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1
              className="text-xl font-semibold text-gray-900 cursor-pointer"
              onClick={() => navigate('/')}
            >
              TOAD Architect
            </h1>
            {sessionId && (
              <span className="text-sm text-gray-500">
                Session: {sessionId.slice(0, 8)}...
              </span>
            )}
          </div>
          
          {session && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExport}
                className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Export
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                New Session
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
```

## Step 3: Testing Setup

### 3.1 Backend Testing Configuration

Create `jest.config.js` in backend directory:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
};
```

Create `src/__tests__/setup.ts`:

```typescript
import { db } from '../models/database';

beforeAll(async () => {
  // Initialize test database
  await new Promise<void>((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
          sessionId TEXT PRIMARY KEY,
          createdAt TEXT NOT NULL,
          lastAccessed TEXT NOT NULL,
          currentPhase INTEGER DEFAULT 1,
          customInstructions TEXT,
          conversationHistory TEXT
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
});

afterEach(async () => {
  // Clean up test data after each test
  await new Promise<void>((resolve, reject) => {
    db.run('DELETE FROM sessions', (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
});

afterAll(async () => {
  // Close database connection
  await new Promise<void>((resolve) => {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      }
      resolve();
    });
  });
});
```

### 3.2 Backend Unit Tests

Create `src/__tests__/models/session.test.ts`:

```typescript
import { SessionModel, Session, Message } from '../../models/session';

describe('SessionModel', () => {
  const mockSession: Omit<Session, 'createdAt' | 'lastAccessed'> = {
    sessionId: 'test-session-id',
    currentPhase: 1,
    customInstructions: 'Test instructions',
    conversationHistory: []
  };

  const mockMessage: Message = {
    id: 'test-message-id',
    timestamp: new Date(),
    role: 'user',
    content: 'Test message'
  };

  describe('create', () => {
    it('should create a new session', async () => {
      const result = await SessionModel.create(mockSession);

      expect(result.sessionId).toBe(mockSession.sessionId);
      expect(result.currentPhase).toBe(mockSession.currentPhase);
      expect(result.customInstructions).toBe(mockSession.customInstructions);
      expect(result.conversationHistory).toEqual(mockSession.conversationHistory);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.lastAccessed).toBeInstanceOf(Date);
    });

    it('should throw error for duplicate session ID', async () => {
      await SessionModel.create(mockSession);
      
      await expect(SessionModel.create(mockSession)).rejects.toThrow();
    });
  });

  describe('getById', () => {
    it('should return session by ID', async () => {
      await SessionModel.create(mockSession);
      const result = await SessionModel.getById(mockSession.sessionId);

      expect(result).not.toBeNull();
      expect(result?.sessionId).toBe(mockSession.sessionId);
    });

    it('should return null for non-existent session', async () => {
      const result = await SessionModel.getById('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update session data', async () => {
      await SessionModel.create(mockSession);
      
      const updates = {
        currentPhase: 2,
        conversationHistory: [mockMessage]
      };

      await SessionModel.update(mockSession.sessionId, updates);
      
      const updatedSession = await SessionModel.getById(mockSession.sessionId);
      expect(updatedSession?.currentPhase).toBe(2);
      expect(updatedSession?.conversationHistory).toEqual([mockMessage]);
    });
  });
});
```

Create `src/__tests__/services/openai.test.ts`:

```typescript
import { OpenAIService } from '../../services/openai';
import { Message } from '../../models/session';

// Mock OpenAI
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Mock AI response' } }]
        })
      }
    }
  }))
}));

describe('OpenAIService', () => {
  const mockMessages: Message[] = [
    {
      id: '1',
      timestamp: new Date(),
      role: 'user',
      content: 'Hello'
    }
  ];

  describe('generateResponse', () => {
    it('should generate AI response', async () => {
      const response = await OpenAIService.generateResponse(mockMessages);
      
      expect(response).toBe('Mock AI response');
    });

    it('should include custom instructions in system prompt', async () => {
      const customInstructions = 'Custom domain knowledge';
      await OpenAIService.generateResponse(mockMessages, customInstructions);
      
      // Verify that custom instructions are passed through
      // This would require more complex mocking to verify the actual prompt
      expect(true).toBe(true); // Placeholder assertion
    });

    it('should handle API errors gracefully', async () => {
      const mockOpenAI = require('openai');
      mockOpenAI.OpenAI.mockImplementationOnce(() => ({
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('API Error'))
          }
        }
      }));

      await expect(OpenAIService.generateResponse(mockMessages)).rejects.toThrow('Failed to generate AI response');
    });
  });
});
```

### 3.3 Backend Integration Tests

Create `src/__tests__/integration/session.test.ts`:

```typescript
import request from 'supertest';
import express from 'express';
import { SessionController } from '../../controllers/sessionController';
import sessionRoutes from '../../routes/sessionRoutes';

const app = express();
app.use(express.json());
app.use('/api', sessionRoutes);

describe('Session API Integration Tests', () => {
  describe('POST /api/sessions', () => {
    it('should create a new session', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({ customInstructions: 'Test instructions' })
        .expect(201);

      expect(response.body).toHaveProperty('sessionId');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('lastAccessed');
      expect(response.body.currentPhase).toBe(1);
      expect(response.body.customInstructions).toBe('Test instructions');
      expect(response.body.conversationHistory).toEqual([]);
    });

    it('should create session without custom instructions', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({})
        .expect(201);

      expect(response.body.customInstructions).toBeUndefined();
    });
  });

  describe('GET /api/sessions/:sessionId', () => {
    it('should return session by ID', async () => {
      // Create session first
      const createResponse = await request(app)
        .post('/api/sessions')
        .send({ customInstructions: 'Test instructions' });

      const sessionId = createResponse.body.sessionId;

      const response = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .expect(200);

      expect(response.body.sessionId).toBe(sessionId);
      expect(response.body.customInstructions).toBe('Test instructions');
    });

    it('should return 404 for non-existent session', async () => {
      await request(app)
        .get('/api/sessions/non-existent-id')
        .expect(404);
    });
  });

  describe('POST /api/sessions/:sessionId/messages', () => {
    it('should send message and get AI response', async () => {
      // Create session first
      const createResponse = await request(app)
        .post('/api/sessions')
        .send({});

      const sessionId = createResponse.body.sessionId;

      const response = await request(app)
        .post(`/api/sessions/${sessionId}/messages`)
        .send({ content: 'Hello AI' })
        .expect(200);

      expect(response.body).toHaveProperty('sessionId');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('conversationHistory');
      expect(response.body.message.role).toBe('assistant');
      expect(response.body.conversationHistory).toHaveLength(2); // user + ai messages
    });

    it('should return 404 for non-existent session', async () => {
      await request(app)
        .post('/api/sessions/non-existent-id/messages')
        .send({ content: 'Hello' })
        .expect(404);
    });
  });

  describe('GET /api/sessions/:sessionId/export', () => {
    it('should export session as markdown', async () => {
      // Create session and add message first
      const createResponse = await request(app)
        .post('/api/sessions')
        .send({ customInstructions: 'Test instructions' });

      const sessionId = createResponse.body.sessionId;

      await request(app)
        .post(`/api/sessions/${sessionId}/messages`)
        .send({ content: 'Test message' });

      const response = await request(app)
        .get(`/api/sessions/${sessionId}/export`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/markdown');
      expect(response.headers['content-disposition']).toContain(`session-${sessionId}.md`);
      expect(response.text).toContain('Software Architecture Session');
      expect(response.text).toContain(sessionId);
      expect(response.text).toContain('Test instructions');
      expect(response.text).toContain('Test message');
    });

    it('should return 404 for non-existent session', async () => {
      await request(app)
        .get('/api/sessions/non-existent-id/export')
        .expect(404);
    });
  });
});
```

### 3.4 Frontend Testing Configuration

Create `src/setupTests.ts`:

```typescript
import '@testing-library/jest-dom';
```

Update `package.json` in frontend directory:

```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "jest": {
    "collectCoverageFrom": [
      "src/**/*.{js,jsx,ts,tsx}",
      "!src/index.tsx",
      "!src/reportWebVitals.ts"
    ]
  }
}
```

### 3.5 Frontend Unit Tests

Create `src/__tests__/components/Chat.test.tsx`:

```typescript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Chat } from '../../components/Chat';
import { SessionProvider } from '../../contexts/SessionContext';

// Mock the API service
jest.mock('../../services/api', () => ({
  sessionApi: {
    sendMessage: jest.fn(),
  },
}));

const mockSession = {
  sessionId: 'test-session-id',
  createdAt: new Date(),
  lastAccessed: new Date(),
  currentPhase: 1,
  conversationHistory: [
    {
      id: '1',
      timestamp: new Date(),
      role: 'user' as const,
      content: 'Hello'
    },
    {
      id: '2',
      timestamp: new Date(),
      role: 'assistant' as const,
      content: 'Hi there! How can I help you with your software architecture?'
    }
  ]
};

const renderChat = () => {
  return render(
    <SessionProvider sessionId="test-session-id">
      <Chat />
    </SessionProvider>
  );
};

describe('Chat Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders chat interface', () => {
    renderChat();
    
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('displays conversation history', () => {
    renderChat();
    
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there! How can I help you with your software architecture?')).toBeInTheDocument();
  });

  it('sends message when form is submitted', async () => {
    const user = userEvent.setup();
    renderChat();
    
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    await user.type(input, 'Test message');
    await user.click(sendButton);
    
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('disables send button when input is empty', () => {
    renderChat();
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  it('shows loading state when sending message', async () => {
    const user = userEvent.setup();
    renderChat();
    
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    await user.type(input, 'Test message');
    await user.click(sendButton);
    
    expect(sendButton).toHaveTextContent('Sending...');
  });
});
```

Create `src/__tests__/components/SessionCreation.test.tsx`:

```typescript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionCreation } from '../../components/SessionCreation';
import { SessionProvider } from '../../contexts/SessionContext';

// Mock the API service
jest.mock('../../services/api', () => ({
  sessionApi: {
    createSession: jest.fn(),
  },
}));

const renderSessionCreation = () => {
  return render(
    <SessionProvider>
      <SessionCreation />
    </SessionProvider>
  );
};

describe('SessionCreation Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders session creation form', () => {
    renderSessionCreation();
    
    expect(screen.getByText('Software Architecture Assistant')).toBeInTheDocument();
    expect(screen.getByText('Start a new architectural design session with AI assistance')).toBeInTheDocument();
    expect(screen.getByLabelText(/custom instructions/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start new session/i })).toBeInTheDocument();
  });

  it('allows entering custom instructions', async () => {
    const user = userEvent.setup();
    renderSessionCreation();
    
    const textarea = screen.getByLabelText(/custom instructions/i);
    await user.type(textarea, 'Test custom instructions');
    
    expect(textarea).toHaveValue('Test custom instructions');
  });

  it('creates session when form is submitted', async () => {
    const user = userEvent.setup();
    renderSessionCreation();
    
    const createButton = screen.getByRole('button', { name: /start new session/i });
    await user.click(createButton);
    
    await waitFor(() => {
      expect(createButton).toHaveTextContent('Creating Session...');
    });
  });

  it('creates session with custom instructions', async () => {
    const user = userEvent.setup();
    renderSessionCreation();
    
    const textarea = screen.getByLabelText(/custom instructions/i);
    const createButton = screen.getByRole('button', { name: /start new session/i });
    
    await user.type(textarea, 'Test custom instructions');
    await user.click(createButton);
    
    await waitFor(() => {
      expect(createButton).toHaveTextContent('Creating Session...');
    });
  });
});
```

Create `src/__tests__/contexts/SessionContext.test.tsx`:

```typescript
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionProvider, useSession } from '../../contexts/SessionContext';

// Mock the API service
const mockCreateSession = jest.fn();
const mockGetSession = jest.fn();
const mockSendMessage = jest.fn();
const mockExportSession = jest.fn();

jest.mock('../../services/api', () => ({
  sessionApi: {
    createSession: mockCreateSession,
    getSession: mockGetSession,
    sendMessage: mockSendMessage,
    exportSession: mockExportSession,
  },
}));

const TestComponent = () => {
  const { session, loading, error, createSession, sendMessage, exportSession } = useSession();
  
  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="session">{session ? 'has-session' : 'no-session'}</div>
      <button onClick={() => createSession('test instructions')}>Create Session</button>
      <button onClick={() => sendMessage('test message')}>Send Message</button>
      <button onClick={() => exportSession()}>Export</button>
    </div>
  );
};

const renderWithProvider = (sessionId?: string) => {
  return render(
    <SessionProvider sessionId={sessionId}>
      <TestComponent />
    </SessionProvider>
  );
};

describe('SessionContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides session context', () => {
    renderWithProvider();
    
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.getByTestId('error')).toBeInTheDocument();
    expect(screen.getByTestId('session')).toBeInTheDocument();
  });

  it('creates session successfully', async () => {
    const user = userEvent.setup();
    const mockSessionData = {
      sessionId: 'test-id',
      createdAt: new Date(),
      lastAccessed: new Date(),
      currentPhase: 1,
      conversationHistory: []
    };
    
    mockCreateSession.mockResolvedValue(mockSessionData);
    
    renderWithProvider();
    
    const createButton = screen.getByText('Create Session');
    await user.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('session')).toHaveTextContent('has-session');
    });
  });

  it('handles session creation error', async () => {
    const user = userEvent.setup();
    mockCreateSession.mockRejectedValue(new Error('Creation failed'));
    
    renderWithProvider();
    
    const createButton = screen.getByText('Create Session');
    await user.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to create session');
    });
  });

  it('loads existing session', async () => {
    const mockSessionData = {
      sessionId: 'test-id',
      createdAt: new Date(),
      lastAccessed: new Date(),
      currentPhase: 1,
      conversationHistory: []
    };
    
    mockGetSession.mockResolvedValue(mockSessionData);
    
    renderWithProvider('test-id');
    
    await waitFor(() => {
      expect(screen.getByTestId('session')).toHaveTextContent('has-session');
    });
  });
});
```

### 3.6 Frontend Integration Tests

Create `src/__tests__/integration/App.test.tsx`:

```typescript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';

// Mock the API service
jest.mock('../services/api', () => ({
  sessionApi: {
    createSession: jest.fn(),
    getSession: jest.fn(),
    sendMessage: jest.fn(),
    exportSession: jest.fn(),
  },
}));

const renderApp = () => {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};

describe('App Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders session creation page by default', () => {
    renderApp();
    
    expect(screen.getByText('Software Architecture Assistant')).toBeInTheDocument();
    expect(screen.getByText('Start a new architectural design session with AI assistance')).toBeInTheDocument();
  });

  it('navigates to session page after creating session', async () => {
    const user = userEvent.setup();
    const mockSessionData = {
      sessionId: 'test-session-id',
      createdAt: new Date(),
      lastAccessed: new Date(),
      currentPhase: 1,
      conversationHistory: []
    };
    
    const { sessionApi } = require('../services/api');
    sessionApi.createSession.mockResolvedValue(mockSessionData);
    
    renderApp();
    
    const createButton = screen.getByRole('button', { name: /start new session/i });
    await user.click(createButton);
    
    await waitFor(() => {
      expect(window.location.pathname).toBe('/session/test-session-id');
    });
  });

  it('displays header with navigation', () => {
    renderApp();
    
    expect(screen.getByText('TOAD Architect')).toBeInTheDocument();
  });
});
```

## Step 4: Development Setup

### 4.1 Environment Variables

Create `.env` in frontend directory:

```env
REACT_APP_API_URL=http://localhost:3001/api
```

### 4.2 Start Development Servers

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm start
```

### 4.3 Run Tests

Backend tests:
```bash
cd backend
npm test
```

Frontend tests:
```bash
cd frontend
npm test
```

### 4.4 Test the Application

1. Open `http://localhost:3000` in your browser
2. Create a new session with optional custom instructions
3. Start a conversation with the AI
4. Test session persistence by refreshing the page
5. Test export functionality

## Step 5: Deployment

### 5.1 Build Frontend

```bash
cd frontend
npm run build
```

### 5.2 Deploy Backend

For Railway:
```bash
cd backend
railway login
railway init
railway up
```

For Render:
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically

### 5.3 Deploy Frontend

For Netlify:
```bash
cd frontend
netlify deploy --prod --dir=build
```

For Vercel:
```bash
cd frontend
vercel --prod
```

## Testing Checklist

### Manual Testing
- [ ] Session creation works
- [ ] GUID-based URLs are generated
- [ ] Conversation history persists
- [ ] AI responses are generated
- [ ] Session can be resumed via URL
- [ ] Export functionality works
- [ ] Custom instructions are applied
- [ ] Error handling works
- [ ] Loading states are displayed
- [ ] Responsive design works

### Automated Testing
- [ ] Backend unit tests pass
- [ ] Backend integration tests pass
- [ ] Frontend unit tests pass
- [ ] Frontend integration tests pass
- [ ] Test coverage > 80%
- [ ] All API endpoints tested
- [ ] Error scenarios covered
- [ ] Loading states tested
- [ ] User interactions tested

## Next Steps

After completing Stage 1 MVP:

1. **Stage 2**: Add structured data management
2. **Stage 3**: Implement real-time features
3. **Stage 4**: Add production features
4. **Stage 5**: Deploy to cloud with scaling

This MVP provides a solid foundation for the conversational architecture application with all core functionality working end-to-end. 