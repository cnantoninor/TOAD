# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TOAD Architect is a web-based conversational software architecture assistant that helps software engineers design, plan, and iterate on software architectures through systematic trade-off analysis. This is an MVP (Stage 1) implementation with intentional limitations for rapid deployment.

## Architecture

### Frontend (React SPA)
- **Location**: `frontend/` directory
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API (`SessionContext`)
- **Key Components**: 
  - `Chat.tsx` - Main chat interface
  - `Message.tsx` - Individual message display
- **API Client**: Axios in `services/api.ts`

### Backend (Express API)
- **Location**: `backend/src/` directory  
- **Framework**: Express.js with TypeScript
- **Database**: SQLite (`data/TOAD.db`)
- **AI Integration**: OpenAI GPT-4 API
- **Architecture Pattern**: MVC with services layer
- **Key Files**:
  - `server.ts` - Main application entry point
  - `models/session.ts` - Database operations
  - `services/openai.ts` - AI integration with custom system prompt
  - `controllers/sessionController.ts` - Request handlers

## Development Commands

### Backend Development
```bash
cd backend
npm run dev          # Start development server with hot reload
npm test             # Run Jest tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate test coverage report
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server
npm run cleanup      # Manual session cleanup
```

### Frontend Development
```bash
cd frontend
npm start            # Start React development server
npm test             # Run React tests
npm run build        # Create production build
```

### Environment Setup
- Backend requires `.env` file (copy from `env.example`)
- Must set `OPENAI_API_KEY` for AI functionality
- Default ports: Backend (3001), Frontend (3000)

## Key Technical Details

### Session Management
- Sessions use UUID-based identifiers
- Stored in SQLite with JSON conversation history
- Automatic cleanup after 30 days (configurable via `SESSION_CLEANUP_DAYS`)
- No authentication - sessions accessible via URL

### AI Integration
- Uses OpenAI GPT-4 with extensive system prompt for architectural guidance
- Structured 5-phase process: Context → Options → Trade-offs → Iteration → Planning
- Conversation summarization after 20 messages to manage context window
- Error handling for rate limits and API failures

### Security Features
- Helmet.js for security headers
- CORS configuration for cross-origin requests
- Rate limiting (100 requests per 15 minutes per IP)
- Input validation with express-validator
- XSS protection through input sanitization

### Database Schema
```sql
sessions (
  sessionId TEXT PRIMARY KEY,
  createdAt TEXT,
  lastAccessed TEXT,
  currentPhase INTEGER DEFAULT 1,
  customInstructions TEXT,
  conversationHistory TEXT, -- JSON array of messages
  summary TEXT              -- JSON conversation summary
)
```

### Testing Strategy
- **Backend**: Jest with supertest for API testing
- **Frontend**: React Testing Library for component tests
- OpenAI API calls are mocked in tests
- Integration tests with real SQLite database
- Target: >80% test coverage

## MVP Limitations

- No authentication/authorization system
- SQLite database (not production-ready for scale)
- Designed for 10 concurrent users maximum
- No real-time features (basic request/response)
- Sessions auto-delete after 30 days
- Basic error handling without advanced recovery

## File Structure Conventions

### Backend Structure
```
backend/src/
├── controllers/     # Request handlers
├── models/         # Database operations
├── services/       # External integrations (OpenAI)
├── middleware/     # Validation, security, logging
├── routes/         # API route definitions
├── utils/          # Utilities (logger)
├── scripts/        # Maintenance scripts
└── types/          # TypeScript type definitions
```

### Frontend Structure  
```
frontend/src/
├── components/     # React components
├── contexts/       # React contexts
├── services/       # API client
└── types/          # TypeScript types
```

## Important Development Notes

- Always run tests before committing changes
- Check health endpoint: `http://localhost:3001/health`
- Logs stored in `backend/logs/` (combined.log, error.log)
- Use correlation IDs for request tracking across the system
- Session data includes conversation history and optional custom instructions
- Export functionality generates Markdown with conversation history